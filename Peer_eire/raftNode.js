const cp = require('child_process');
const Skiff = require('skiff');
const sch = require('./utils/stateChangeHndlr.js');

function handleHttp(h, db) {
  /** Handle http requests */
  /** @param db is memdown instance of this Raft
      @param h is http child process
  */
  h.on('message', m => {

    if (typeof (m) === 'object' && m.type === 'state?') {
      db.get('state', function (err, value) {
        // Get actual state
        (err ? h.send(err) : h.send(value));
      })
    }

    else if (typeof (m) === 'object') {
      // sns notification
      sch.changeState(m, db);
    }

    else if (typeof (m) === 'string' && m === 'current_state') {
      //send to superleader my current_state
      sch.sendCurrentState(db);
    }

    else if (typeof (m) === 'string' && m === 'last_msg') {
      //send to superleader my last sns message sent
      sch.sendLastMsg(db);
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
    options: { rpcTimeoutMS: 10000, electionTimeoutMinMS: 800, electionTimeoutMaxMS:1200 }
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
                sch.allSubscriptions();
                sch.handleInizialization(db);
              }, 5000);
            }

            else {
              /** If some other superleader crashed */
              setTimeout(() => {
                sch.allSubscriptions();
                sch.returnProcedure(db);
              }, 5000);
            }

          })
        }

        // follower or candidate
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

/** STATE OF LEADER CLUSTER NODE:
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
 *  LAST SNS MESSAGE STRUCTURE ('PLAYED' OR 'COMPUTED'):
 *
 *  e.g.
 *
 * 'last_msg', { 'last_msg': 'played'},
 *
 *
 *
 *
 *
 */
