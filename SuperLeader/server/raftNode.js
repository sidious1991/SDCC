const cp = require('child_process');
const Skiff = require('skiff');
const sch = require('./utils/stateChangeHndlr.js');

function handleHttp(h, db) {
  /** Handle http requests */
  /** @param db is memdown instance of this Raft
      @param h is http child process
  */
  h.on('message', m => {

    console.log("MESSAGGIO STAMPATO", m);
    if (m.type === 'state?') {
      db.get('state', function (err, value) {
        // Get actual state
        (err ? h.send(err) : h.send(value));
      })
    }

    else if (m.type === 'leader_state') {
      //If m.payload is more recent than the current state of this raft update it
      sch.handleLeaderState(m.payload, db);
    }

    // m.type === 'action'
    else if (m.type === 'action') {
      // Change Raftstate if necessary and reply (if necessary)
      sch.changeState(m.payload, db);
    }

  });
}

function handleSignal(h, on_sig, then_sig) {
  /** Handle termination signals */
  /** @param h is http child process
      @param on_sig is input signal
      @param then_sig is output signal
  */
  process.on(on_sig, (code) => {
    h.kill(then_sig);
    process.kill(process.pid, then_sig);
  });
}

exports.startRaft = function startRaft(peers, me) {
  /** Start this Raft node */
  /**@param peers are other cluster nodes
  */

  /** Prepare Raft */
  const options = {
    db: require('memdown'),
    peers: peers,
    options: { rpcTimeoutMS: 10000, electionTimeoutMinMS: 800, electionTimeoutMaxMS: 1200 }
  }

  const skiff = Skiff(me, options);

  const db = skiff.levelup();

  /** Start Raft */
  skiff.start(err => {

    if (err) {
      console.error('Error starting skiff node: ', err.message);

    } else {

      console.log('Skiff node started');

      skiff.on('new state', () => {

        console.log(skiff.is('leader'));
        console.log(skiff.term());

        if (skiff.is('leader')) {

          db.get('state', function (err, value) {

            if (err && err.notFound) {
              /** Inizialize the cluster (Raft) -- first cluster leader */
              setTimeout(() => {
                sch.handleInizialization(db);
                sch.allSubscriptions();
              }, 5000);
            }

            else {
              /** If some other superleader crashed */
              sch.unsubscribeAll();
              setTimeout(() => {
                sch.returnProcedure(db);
              }, 5000);
            }

          })
        }

        // Follower or candidate
        else {
          sch.unsubscribeAll();
        }

      })
    }
  })

  /** Spawn httpServer process */
  const h = cp.fork('./httpServer.js');

  handleHttp(h, db);
  handleSignal(h, 'SIGINT', 'SIGTERM');
}

/** STATE OF SUPERLEADER CLUSTER NODE:
 *
 *  PHASES:
 *  PLAY -->> ALL ROULETTE CLUSTERS HAVE COMPUTED
 *  COMPUTE -->> ALL ROULETTE CLUSTERS HAVE PLAYED
 *
 *  HAND: INTEGER
 *
 *  NUM: INTEGER
 *
 *  DATE: date (istant of change state)
 *
 *  LIST RESPONSE (2 ZONES): []
 *
 *
 *
 *
 *
 *
 *
 */
