/** StateChangeHandler */
const cp = require('child_process');
const snsapi = require('../libs/snsApi.js');
const tools = require('./tools');
var last_msgs = null;

exports.handleInizialization = function handleInizialization(db) {
    /** Trigger that when inizialize the leader cluster
     *  Write { 'phase': 'compute', 'hand': 0, 'num': 0, 'date': new Date} in memdown
     *  and { 'last_msg': 'played'}, where 'last_msg' is the last sns message sent (played or computed)
     *  @param db is level up logEntry of this Raft
     */

    db.put('state', { 'phase': 'compute', 'hand': 0, 'num': 0, 'date': new Date() },{'sync':true}, function (err) {
        if (err) return console.log('I/O error', err);
    });
	last_msgs = 'played';

    db.put('last_msg', { 'last_msg': 'played' },{'sync':true}, function (err) {
        if (err) return console.log('I/O error', err);
    });

    setTimeout(() => {
        snsapi.publishStringMessage('arn:aws:sns:eu-west-1:993460052932:computed', 'frnk', 'eu-west-1');
    }, 5000);

	last_msgs =  'computed' ;

    db.put('last_msg', { 'last_msg': 'computed' },{'sync':true}, function (err) {
        if (err) return console.log('I/O error', err);
    });
}


exports.changeState = function changeState(m, db) {
    /** Change the leader state in function of the notification
     *  @param m is the msg to handle
     *  @param db is level up logEntry of this Raft
     *  Struct of m e.g.: { 'phase': 'compute', 'hand': 0, 'num': 0, 'date': new Date }
    */

    // Check last state
    db.get('state', function (err, value) {

        if (err)
            return console.log(err);

        // SuperLeader is not crazy
        if (value.phase !== m.phase && (new Date(m.date)).getTime() > (new Date(value.date)).getTime()) {

            m.date = new Date(m.date);

            console.log('CHANGE STATE EIRE: ', m.phase);

            db.put('state', m,{'sync':true}, function (err) {
                if (err) return console.log('I/O error', err);
            });

            /** Spawn play_module process */
            const p = cp.fork('./play/play_module.js');

            if (m.phase === 'compute') {
                //do some operation (parallel process) ... and then notify something to superleader and update 'last_msg'
                p.send({ sbj: 'cmp', num: m.num });

                p.once('message', (m) => {

		   last_msgs = 'computed';

		    db.put('last_msg', { 'last_msg': 'computed' },{'sync':true}, function (err) {
                        if (err) return console.log('I/O error', err);
                    });
                });
            }

            //m.phase === 'play'
            else {
                //do something else (parallel process) ... and then notify something to superleader and update 'last_msg'
                p.send({ play_date: m.date });

                p.once('message', (m) => {

                   last_msgs = 'played' ;

		      db.put('last_msg', { 'last_msg': 'played' },{'sync':true}, function (err) {
                        if (err) return console.log('I/O error', err);
                    });
                });
            }
        }
    })
}


exports.sendCurrentState = function sendCurrentState(db) {
    /** Send to SuperLeader the current_state of this peer */

    db.get('state', function (err, value) {

        var toSend = value;

        snsapi.publishJsonMessage('arn:aws:sns:eu-west-1:993460052932:leader_state', toSend, 'eu-west-1');
    });
}

exports.sendLastMsg = function sendLastMsg(db) {
    /** Send to SuperLeader the last_msg of this peer (played or computed topic with msg 'frnk') */

    db.get('last_msg', function (err, value) {

	if(last_msgs !== null)
	 value = last_msgs;

        if (value === 'played') {
            snsapi.publishStringMessage('arn:aws:sns:eu-west-1:993460052932:played', 'frnk', 'eu-west-1');
        }

        // Computed
        else {
            snsapi.publishStringMessage('arn:aws:sns:eu-west-1:993460052932:computed', 'frnk', 'eu-west-1');
        }

    });
}

exports.allSubscriptions = function allSubscriptions() {
    /** Subscribe this leader to all the topic of interest */

    snsapi.subscribe('arn:aws:sns:eu-central-1:993460052932:frnk_leader_topic', 'eu-central-1');
 }


exports.returnProcedure = function returnProcedure(db) {
    /** If some other leader crashed previously */

    db.get('state', function (err, value) {

        /** Spawn play_module process */
        const p = cp.fork('./play/play_module.js');

        if (value.phase === 'compute') {
            //do some operation (parallel process) ... and then notify something to superleader and update 'last_msg'
            p.send({ sbj: 'cmp', num: value.num });

            p.once('message', (m) => {
			last_msgs = 'computed';

                db.put('last_msg', { 'last_msg': 'computed' },{'sync':true}, function (err) {
                    if (err) return console.log('I/O error', err);
                });
            });
        }

        else {
            //do something else (parallel process) ... and then notify something to superleader and update 'last_msg'
            p.send({ play_date: value.date });

            p.once('message', (m) => {

		last_msgs = 'played';

                db.put('last_msg', { 'last_msg': 'played' },{'sync':true}, function (err) {
                    if (err) return console.log('I/O error', err);
                });
            });
        }
    });
}

exports.unsubscribeAll = function unsubscribeAll() {
  snsapi.unsubscribe('arn:aws:sns:eu-central-1:993460052932:frnk_leader_topic', 'eu-central-1');
}
