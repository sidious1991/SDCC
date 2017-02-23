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
      var endpoint = "http://" + publicHostname + ":8081/roulette/topic";
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
  /** Publish a String message on TopicArn */

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
   *  message is Json object (must have all parameters different from object!)
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
  //console.log("recursive Round:", recursiveCount, nextTok);
  if (nextTok !== undefined)
    params = { NextToken: nextTok };
  else params = {}

  sns.listSubscriptions(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      if (data.NextToken !== undefined) {
        nextTok = data.NextToken;
        //console.log("nextTok", nextTok)
        recurseUnsub(nextTok, endpoint, recursiveCount + 1, sns)
      }

      var sub;
      //console.log("NextToken round", recursiveCount, ":", data.NextToken);
      for (var i = 0; i < data.Subscriptions.length; i++) {
        //console.log("BEFORE:",data.Subscriptions[i]);

        if (data.Subscriptions[i].Endpoint.indexOf(endpoint) > -1) {
          //console.log("found:",data.Subscriptions[i],data.Subscriptions[i].SubscriptionArn);
          sub = data.Subscriptions[i].SubscriptionArn;
          if (sub != "PendingConfirmation") {
            sns.unsubscribe({ SubscriptionArn: sub }, function (err, data) {
              if (err) console.log(err, err.stack); // an error occurred
              else console.log("cancellato");           // successful response
            });
          }
        }
      }//chiusura for
      setTimeout(function () { console.log("in round", recursiveCount, " read ", data.Subscriptions.length); }, 1000);

    }
  })
}


var unsubscribe = function (topicArn, region) {
  var sns;
  if (region == "eu-west-1")
    sns = snsIr
  else
    sns = snsFr

  metadata.getMetadataForInstance('public-hostname')
    .then(function (publicHostname) {
      var endpoint = "http://" + publicHostname;
      //console.log("Instance ID: " + publicHostname);

      recurseUnsub(undefined, endpoint, 0, sns)
      //console.log(" 	EXIT_LOOP	");
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
