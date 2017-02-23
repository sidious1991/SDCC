var AWS = require('aws-sdk');
AWS.config.loadFromPath('./utils/config.json');
var snsIr = new AWS.SNS({ apiVersion: '2010-03-31', region: 'eu-west-1' });
var snsFr = new AWS.SNS({ apiVersion: '2010-03-31', region: 'eu-central-1' });
var metadata = require('node-ec2-metadata');

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
    var endpoint = "http://" + publicHostname + ":8080/roulette/topic";
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

    recurseUnsub(undefined, endpoint, 0, sns)
  })
  .fail(function (error) {
    console.log("Error in subscribe : " + error);
  });
}

module.exports.confirm = confirm;
module.exports.subscribe = subscribe;
module.exports.publishStringMessage = publishStringMessage;
module.exports.publishJsonMessage = publishJsonMessage;
module.exports.unsubscribe = unsubscribe;
