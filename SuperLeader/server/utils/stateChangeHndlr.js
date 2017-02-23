/** StateChangeHandler */
const snsapi = require('../libs/snsApi');
const tools = require('./tools');

var leader_states = 0; //  Global # of received states from leaders of frnk and eire
var resp_array = []; // Global list of response 

const N_CLUSTER = 2; // Clusters of AppRoulette (eire and frnk)


function conditionalPush(list, val) {
    /** Push val in the list only if val is not repeated */

    if (list.indexOf(val) === -1) {
        list.push(val);
    }
}


exports.handleIncomingNotification = function handleIncomingNotification(msg, topicArn) {
    /** Create a new object with the identifiers of the incoming notification
     *  @param msg is 'eire' or 'frk'
     *  @param topicArn is computed or played
     *  @return e.g. {'zone' : 'frk', 'topic' : 'played'}
    */

    return (topicArn.indexOf('computed') !== -1 ? { 'zone': msg, 'topic': 'computed' } : { 'zone': msg, 'topic': 'played' })
}


exports.handleInizialization = function handleInizialization(db) {
    /** Trigger that when inizialize the superleader cluster
     *  Write { 'phase': 'compute', 'hand': 0, 'num': 0, 'date': new Date, 'list_response': [] } in memdown
     *  @param db is level up logEntry of this Raft
     */

    db.put('state', { 'phase': 'compute', 'hand': 0, 'num': 0, 'date': new Date(), 'list_response': [] }, function (err) {
        if (err) return console.log('I/O error', err);
    });
}


exports.changeState = function changeState(m, db) {
    /** Change the superleader state in function of the notification if necessary and reply (if necessary)
     *  @param m is the msg to handle
     *  @param db is level up logEntry of this Raft
     *  Struct of m e.g.: {'zone' : 'frk', 'topic' : 'played'} (returned by handleIncomingNotification())
    */

    db.get('state', function (err, value) {
        if (err)
            console.log(err);

        // 1) If waiting for 'computed' notification
        if (value.phase === 'compute' && m.topic === 'computed') {

            console.log('PRIMA\n', value.list_response);
            conditionalPush(resp_array, m.zone);
            conditionalPush(value.list_response, m.zone);
            console.log('DOPO\n', value.list_response);

            // Change State to 'play' (everybody responded)
            if (value.list_response.length === N_CLUSTER || resp_array.length === N_CLUSTER) {

                value.phase = 'play';
                resp_array = [];
                value.list_response = [];
                value.hand += 1;
                value.date = new Date();
                var toSendDate = value.date;
                var toSend = { 'phase': value.phase, 'hand': value.hand, 'num': value.num, 'date': (toSendDate).toISOString() };

                console.log('play');
                snsapi.publishJsonMessage('arn:aws:sns:eu-west-1:993460052932:eire_leader_topic', toSend, 'eu-west-1');
                snsapi.publishJsonMessage('arn:aws:sns:eu-central-1:993460052932:frnk_leader_topic', toSend, 'eu-central-1');
            }

            db.put('state', value, { 'sync': true }, function (err) {
                if (err) return console.log('I/O error', err);
            });
        }

        // 2) If waiting for 'played' notification
        else if (value.phase === 'play' && m.topic === 'played') {
            console.log('in play\n');

            console.log('PRIMA\n', value.list_response);
            conditionalPush(resp_array, m.zone);
            conditionalPush(value.list_response, m.zone);
            console.log('DOPO\n', value.list_response);

            // Change State to 'compute' (everybody responded)
            if (value.list_response.length === N_CLUSTER || resp_array.length === N_CLUSTER) {

                value.phase = 'compute';
                resp_array = [];
                value.list_response = [];
                value.num = tools.getRandomIntInclusive(0, 36);
                console.log(value.num);
                value.date = new Date();
                var toSendDate = value.date;
                var toSend = { 'phase': value.phase, 'hand': value.hand, 'num': value.num, 'date': (toSendDate).toISOString() };

                console.log('compute');
                snsapi.publishJsonMessage('arn:aws:sns:eu-west-1:993460052932:eire_leader_topic', toSend, 'eu-west-1');
                snsapi.publishJsonMessage('arn:aws:sns:eu-central-1:993460052932:frnk_leader_topic', toSend, 'eu-central-1');
            }

            db.put('state', value, { 'sync': true }, function (err) {
                if (err) return console.log('I/O error', err);
            });
        }

        // value.phase === 'play' && m.topic === 'computed' or value.phase === 'compute' && m.topic === 'played'
        else {

            var toSendDate = value.date;

            var toSend = { 'phase': value.phase, 'hand': value.hand, 'num': value.num, 'date': value.date };

            if (m.zone === 'eire') {
                snsapi.publishJsonMessage('arn:aws:sns:eu-west-1:993460052932:eire_leader_topic', toSend, 'eu-west-1');
            }

            else {
                snsapi.publishJsonMessage('arn:aws:sns:eu-central-1:993460052932:frnk_leader_topic', toSend, 'eu-central-1');
            }
        }
    })
}


exports.handleLeaderState = function handleLeaderState(m, db) {
    /** If m is more recent than the current state of this raft update it -- m is sent during the return procedure */

    leader_states += 1;

    db.get('state', function (err, value) {
        if (err)
            console.log(err);

        // Update this raft state
        if (tools.mostRecent(m, value)) {

            Object.assign(m, { 'list_response': [] });
            m.date = new Date(m.date);

            db.put('state', m, { 'sync': true }, function (err) {
                if (err) return console.log('I/O error', err);
            });
        }

        if (leader_states === N_CLUSTER) {

            leader_states = 0;

            // Procedure (call and then listen for responses):

            snsapi.subscribe('arn:aws:sns:eu-west-1:993460052932:computed', 'eu-west-1');
            snsapi.subscribe('arn:aws:sns:eu-west-1:993460052932:played', 'eu-west-1');
            setTimeout(() => {
                snsapi.publishStringMessage('arn:aws:sns:eu-west-1:993460052932:eire_leader_topic', 'last_msg', 'eu-west-1');
                snsapi.publishStringMessage('arn:aws:sns:eu-central-1:993460052932:frnk_leader_topic', 'last_msg', 'eu-central-1');
            }, 5000);
        }
    });
}

exports.allSubscriptions = function allSubscriptions() {
    /** Subscribe this superleader to all the topic of interest (played, computed)*/

    snsapi.subscribe('arn:aws:sns:eu-west-1:993460052932:played', 'eu-west-1');
    snsapi.subscribe('arn:aws:sns:eu-west-1:993460052932:computed', 'eu-west-1');
}

exports.returnProcedure = function returnProcedure(db) {
    /** If the previous superleader crashed -- This node becomes SuperLeader */

    // Procedure (call and then listen for responses):
    snsapi.subscribe('arn:aws:sns:eu-west-1:993460052932:leader_state', 'eu-west-1');

    setTimeout(() => {
        snsapi.publishStringMessage('arn:aws:sns:eu-west-1:993460052932:eire_leader_topic', 'current_state', 'eu-west-1');
        snsapi.publishStringMessage('arn:aws:sns:eu-central-1:993460052932:frnk_leader_topic', 'current_state', 'eu-central-1');
    }, 5000);
}

exports.unsubscribeAll = function unsubscribeAll() {
    /** Delete all subscriptions of this node (superleader) */

    snsapi.unsubscribe('arn:aws:sns:eu-west-1:993460052932:played', 'eu-west-1');
    snsapi.unsubscribe('arn:aws:sns:eu-west-1:993460052932:computed', 'eu-west-1');
    snsapi.unsubscribe('arn:aws:sns:eu-west-1:993460052932:leader_state', 'eu-west-1');
}

