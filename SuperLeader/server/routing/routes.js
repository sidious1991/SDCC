const express = require('express');
const router = express.Router();
const snsapi = require('../libs/snsApi.js');
const dynamoapi = require('../libs/dynamoApi.js');
const sch = require('../utils/stateChangeHndlr.js');

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

router.use(bodyParser.json());

router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

router.get('/', function (req, res) {
  /** endpoint for the loadbalancer */

  res.send('HomeLogin');
});

router.get('/raftState', function (req, res) {
  /** sends the current raftState */

  process.once('message', m => {
    res.send(m);
  });

  process.send({ type: 'state?' });

});

router.post('/register', urlencodedParser, function (req, res) {
  /** signUp a client */

  var data_l = { username: req.body.username, password: req.body.password, name: req.body.name, surname: req.body.surname };
  console.log("data-l", data_l)

  dynamoapi.signUp(data_l, res);
});

router.post('/homeLogin', urlencodedParser, function (req, res) {
  /** logIn a client */

  console.log("homeLogin:", req.data, req.body, req.body.email);
  var data_l = { username: req.body.email, password: req.body.pass };
  console.log("data-l", data_l)

  dynamoapi.logIn(data_l, res);
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

      //Arrived computed or played
      if (msg === 'eire' || msg === 'frnk') {
        var msg = sch.handleIncomingNotification(JSON.parse(bodyarr.join('')).Message, req.headers['x-amz-sns-topic-arn']);
        var pl = Object.assign({ type: 'action' }, { payload: msg });

        process.send(pl);
      }

      //Arrived leader_state
      else {
        var pl = Object.assign({ type: 'leader_state' }, { payload: JSON.parse(msg) });

        process.send(pl);
      }

    }

  })
});

module.exports = router;
