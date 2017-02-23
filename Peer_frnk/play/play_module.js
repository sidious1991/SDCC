const cmp = require('../compute.js');
const tools = require('../utils/tools.js');
const snsapi = require('../libs/snsApi.js');
const redisapi = require('../libs/redisApi.js');
const dynamoapi = require('../libs/dynamoApi.js');
// Requiring cache and dynamodb instances ...


const play_time = 20000; // milliseconds

var redis = redisapi.createConnection();


/** Do some operation ... and then notify something to superleader and update 'last_msg' in db */

process.once('message', m => {

    // Compute-State
    if (m.sbj === 'cmp') {
        // Do some operation


        setTimeout(() => {

            redis.hgetall('HSET:Bets', function (err, resp) {
                    console.log('hgetall command returns err: %s, resp: ', err, resp);

                if (resp === null || resp.default === '[]') {

                    // Notify the superleader on computed topic with msg: 'frnk'
                    snsapi.publishStringMessage('arn:aws:sns:eu-west-1:993460052932:computed', 'frnk', 'eu-west-1');
                    process.send('done');

                }

                else {

                    console.log('hgetall command returns err: %s, resp: ', err, resp);

                    var bets = JSON.parse(resp.default);
			              console.log("BETS",bets);
                    dynamoapi.writeBetsBatch(bets, m.num, redis, redisapi.deleteAllTable);
                }
            });

        }, 8000);

    }


    // Play-State
    else {
        //Do some operation
        var date = m.play_date; // it is a date!

        console.log('DATE OF PLAYING PHASE: ', date);

        var elapsed = tools.elapsedTime(date); // milliseconds

        if (elapsed >= play_time) {
            snsapi.publishStringMessage('arn:aws:sns:eu-west-1:993460052932:played', 'frnk', 'eu-west-1');
            process.send('done');
        }

        else {
            setTimeout(() => {
                // Notify the superleader on played topic with msg: 'frnk'
                snsapi.publishStringMessage('arn:aws:sns:eu-west-1:993460052932:played', 'frnk', 'eu-west-1');
                process.send('done');
            }, (play_time - elapsed));
        }
    }

});


setTimeout(()=>{
/**Close redis session after last redis operation*/
    redis.end();

    },12000);

process.once('exit',(code)=> {
/** manage the node process and killed them when they finisched*/
 process.kill(process.pid, 'SIGKILL')
});
