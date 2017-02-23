const express = require('express');
const router = express.Router();
const snsapi = require('../libs/snsApi.js');
const redisapi = require('../libs/redisApi.js');
const dynamoapi = require('../libs/dynamoApi.js');

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

 var redis = redisapi.createConnection();

router.use(bodyParser.json());

router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

router.get('/', function (req, res) {
  res.send('Roulette home page');
});

router.get('/login/:id', function(req, res){
  /**setCookie from current session to access on Client*/

    var obj = {username : req.params.id}
    res.cookie('infoLogin',JSON.stringify(obj),{domain:'eu-central-1.elb.amazonaws.com'});
    res.redirect('http://frankLoadBalancer-1669808597.eu-central-1.elb.amazonaws.com/index.html');

});

router.get('/raftState', function (req, res) {
  /**get information of current raf state, {hand, number,date superLeader, date server}*/

  process.once('message', m => {
    var temp = new Date()
    console.log(m.date,"temp",temp,temp.toISOString(),typeof m.date)
    res.send({superLeader:m,serverDate:temp.toISOString()});
  });

  process.send({ type: 'state?' });

});

router.post('/writeBet',urlencodedParser, function (req, res, message) {
  /** Write a client bet in Redis during the play phase */

  setTimeout(() => {
   console.log("writeBet",req.body,req.body.default);

    redisapi.setJsonRedis(redis, req.body, 'Bets');
  }, 2000);

  res.send('ok');

});

router.post('/getCash',urlencodedParser, function (req, res, message) {
  /** Retrieves the cash of a particular user */

  // Sends {cash: cash} or {}
  dynamoapi.getCash(req.body, res);

});

router.get('/getDailyNumber', function (req, res) {
  /** Retrieves the daily number */

  dynamoapi.getDailyNumber(res);

});

router.post('/topic', function (req, res, message) {
  /** Is the sns endpoint */

  var bodyarr = [];
  req.on('data', function (chunk) {
    bodyarr.push(chunk);
  })

  req.on('end', function () {
    var topic, token, region;

    topic = JSON.parse(bodyarr.join('')).TopicArn;
    token = JSON.parse(bodyarr.join('')).Token;

    if ((JSON.parse(bodyarr.join('')).TopicArn).indexOf("eu-west") > -1) {
      region = "eu-west-1";
    } else {
      region = "eu-central-1";
    }

    if (req.headers['x-amz-sns-message-type'] == 'SubscriptionConfirmation') {
      snsapi.confirm(token, topic, region);
    } else if (req.headers['x-amz-sns-message-type'] == 'Notification') {
      /** Publish events --->> communicate to parent process */

      var msg = JSON.parse(bodyarr.join('')).Message;

      if (msg === 'current_state' || msg === 'last_msg') {
        process.send(msg);
      }

      else {
        process.send(JSON.parse(msg));
      }
    }

  })
});

module.exports = router;

/**
 * - raftState :  { 'phase': 'compute/play', 'hand': .., 'num': .., 'date': Date}
 * - sns last message : { 'last_msg': 'played'},
 */
