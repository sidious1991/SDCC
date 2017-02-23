var AWS = require('aws-sdk');
AWS.config.loadFromPath('./utils/config.json');
var snsIr = new AWS.SNS({ apiVersion: '2010-03-31', region: 'eu-west-1' });
var snsFr = new AWS.SNS({ apiVersion: '2010-03-31', region: 'eu-central-1' });
var metadata = require('node-ec2-metadata');
var nodemailer = require('nodemailer');

var subscribe = function (topicArn, region) {
  /** Subscribe this node to the topic of the specified region (west or central eu)
   *  @param topicArn is the topic id
   *  @param region is west or central eu
   */

  var sns;

  if (region == "eu-west-1")
    sns = snsIr;
  else
    sns = snsFr;

  metadata.getMetadataForInstance('public-hostname')
    .then(function (publicHostname) {
      var endpoint = "http://" + publicHostname + ":8080/stateNode/topic";
      console.log("Instance ID: " + publicHostname);

      var params = {
        Protocol: 'HTTP', /* required */
        TopicArn: topicArn, /* required */
        Endpoint: endpoint
      };

      sns.subscribe(params, function (err, data) {
        if (err) console.log(err, err.stack);//an error occurred
        else {//subscribe success
          console.log("SubscriptionArn:", data);
        }
      });
    })
    .fail(function (error) {
      console.log("Error in subscribe : " + error);
    });
}


var confirm = function (token, topicArn, region) {
  /** Confirm the subscription to the topicArn in the specified region
   *  @param token is returned after subscription by sns
   *  @param topicArn is the topic id
   *  @param region is west or central eu
   */

  var sns;

  if (region == "eu-west-1")
    sns = snsIr;
  else
    sns = snsFr;

  var params = {
    Token: token,
    TopicArn: topicArn
  }
  sns.confirmSubscription(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data); // successful response
  });
}


var publishStringMessage = function (TopicArn, message, region) {
  /** Publish a String message on TopicArn
*  @param TopicArn id of topic
*  @param message object to send to topic
*  @param region  region of topic
*/

  var sns;

  if (region == "eu-west-1")
    sns = snsIr;
  else
    sns = snsFr;

  var publishParams = {
    TopicArn: TopicArn,
    Message: message
  };

  sns.publish(publishParams, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log("SCRITTURA SU TOPIC: " + JSON.stringify(data));// successful response
  });
}

var publishEmailMessage = function (TopicArn, message) {
  /** Publish a String message on TopicArn */

  var sns = snsIr;

  var publishParams = {
    TopicArn: TopicArn,
    Message: JSON.stringify({ 'default': message, 'email-json': message, 'email': message }),
    MessageStructure: 'json',
    Subject: 'daily_number'
  };

  sns.publish(publishParams, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log("SCRITTURA SU TOPIC: " + JSON.stringify(data));// successful response
  });
}

var publishJsonMessage = function (TopicArn, message, region) {
  /** Publish a Json message on TopicArn
 *  @param TopicArn is the topic id
 *  @param message object to save in hash table
 *  @param region is west or central
 */

  var sns;

  if (region == "eu-west-1")
    sns = snsIr;
  else
    sns = snsFr;

  var msg = { 'default': JSON.stringify(message) };

  var publishParams = {
    TopicArn: TopicArn,
    Message: JSON.stringify(msg),
    MessageStructure: 'json'
  };

  sns.publish(publishParams, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log("SCRITTURA SU TOPIC: " + JSON.stringify(data));// successful response
  });
}


var recurseUnsub = function (nextTok, endpoint, recursiveCount, sns) {
  /** Recursive Unsubscribe from topic
  *  @param nextTok token of next  from list of subscription
  *  @param endpoint address of http endpoint of sns
  *  @param  recursiveCount counter of recursive action
  *  @param  sns sns object
  */

  if (nextTok !== undefined)
    params = { NextToken: nextTok };
  else params = {}

  sns.listSubscriptions(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      if (data.NextToken !== undefined) {
        nextTok = data.NextToken;
        recurseUnsub(nextTok, endpoint, recursiveCount + 1, sns)
      }

      var sub;

      for (var i = 0; i < data.Subscriptions.length; i++) {

        if (data.Subscriptions[i].Endpoint.indexOf(endpoint) > -1) {
          sub = data.Subscriptions[i].SubscriptionArn;
          if (sub != "PendingConfirmation") {
            sns.unsubscribe({ SubscriptionArn: sub }, function (err, data) {
              if (err) console.log(err, err.stack); // an error occurred
              else console.log("cancellato");           // successful response
            });
          }
        }
      }
      setTimeout(function () { console.log("in round", recursiveCount, " read ", data.Subscriptions.length); }, 1000);

    }
  })
}


var unsubscribe = function (topicArn, region) {
  /** Unsubscribe from topic
  *  @param topicArn  id of subscribe topic
  *  @param region  region of sns topic
  */

  var sns;
  if (region == "eu-west-1")
    sns = snsIr
  else
    sns = snsFr

  metadata.getMetadataForInstance('public-hostname')
    .then(function (publicHostname) {
      var endpoint = "http://" + publicHostname;

      recurseUnsub(undefined, endpoint, 0, sns);
    })
    .fail(function (error) {
      console.log("Error in subscribe : " + error);
    });
}

var subscribeNewUser = function (username, topicArn) {

  var params = {
    Protocol: 'email', /* required */
    TopicArn: topicArn, /* required */
    Endpoint: username
  };

  //Topic is in Eire
  snsIr.subscribe(params, function (err, data) {
    if (err) console.log(err, err.stack);//an error occurred
    else {//subscribe success
      console.log("SubscriptionArn:", data);
    }
  });
}

var recurseSend = function (nextTok, endpoint, recursiveCount, sns, daily) {
  /** Called by sendToNewUser method */

  if (nextTok !== undefined)
    params = { NextToken: nextTok };
  else params = {}

  sns.listSubscriptions(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      if (data.NextToken !== undefined) {
        nextTok = data.NextToken;
        recurseSend(nextTok, endpoint, recursiveCount + 1, sns, daily)
      }

      var sub;

      for (var i = 0; i < data.Subscriptions.length; i++) {
        console.log("BEFORE:", data.Subscriptions[i]);

        if (data.Subscriptions[i].Endpoint.indexOf(endpoint) > -1) {
          sub = data.Subscriptions[i].SubscriptionArn;
          if (sub != "PendingConfirmation") {
            var transporter = nodemailer.createTransport({
              service: 'Gmail',
              auth: {
                user: 'bellagio.casino.sdcc@gmail.com', // Your email id
                pass: 'b3llagio' // Your password
              }
            });
            var mailOptions = {
              from: 'bellagio.casino.sdcc@gmail.com', // sender address
              to: endpoint, // list of receivers
              subject: 'Daily Number', // Subject line
              text: daily //, // plaintext body
            };
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log('Message sent: ' + info.response);
              };
            });

          }
        }
      }
      setTimeout(function () { console.log("in round", recursiveCount, " read ", data.Subscriptions.length); }, 1000);

    }
  })
}


var sendToNewUser = function (userEmail, daily) {
  recurseSend(undefined, userEmail, 0, snsIr, daily)
}


module.exports.sendToNewUser = sendToNewUser;
module.exports.subscribeNewUser = subscribeNewUser;
module.exports.confirm = confirm;
module.exports.subscribe = subscribe;
module.exports.publishStringMessage = publishStringMessage;
module.exports.publishJsonMessage = publishJsonMessage;
module.exports.publishEmailMessage = publishEmailMessage;
module.exports.unsubscribe = unsubscribe;
