var AWS = require('aws-sdk');
var cmp = require('../compute.js');
var snsapi = require('./snsApi.js');
var redisapi = require('./redisApi.js');
AWS.config.loadFromPath('./utils/configDynamo.json'); // required


AWS.config.update({ endpoint: "https://dynamodb.eu-west-1.amazonaws.com" });

var dynamodbCl = new AWS.DynamoDB.DocumentClient();

function updateCash(bet) {
  /** Update the user cash in function of the won cash and the bet
  */

  var sum = bet.win - bet.bet_cash;

  var params = {
    TableName: "Accounts",
    Key: {
      "username": bet.username,
    },
    UpdateExpression: "set cash = cash + :val",
    ExpressionAttributeValues: {
      ":val": sum
    },
    ReturnValues: "UPDATED_NEW"
  };

  dynamodbCl.update(params, function (err, data) {
    if (err) {
      console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    }
  });
}

exports.writeBetsBatch = function writeBetsBatch(bets, num, redis, callback) {
  /** Write a list of computed bets in the db
  *  @param bets is a list of computed bets
  *  @param num is the number generated
  *  @param redis is redis client
  *  @param callback is a function for cleaning the cache
  */
  console.log("bets in writeBetsBatch",bets);
  var length = bets.length;
  var i = 0;

  bets.forEach((bet) => {
    var betParsed= JSON.parse(bet.bet);

    var params = {
      TableName: "Bets",
      Item: {
        "hand": parseInt(bet.hand,10),
        "username": bet.username,
        "bet": betParsed,
        "bet_cash": parseInt(bet.bet_cash,10),
        "win": cmp.wonCash(betParsed, bet.bet_cash, num)
      }
    };

    dynamodbCl.put(params, function (err, data) {
      if (err) {
        console.error("Unable to add bet", bet.username, ". Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.log("PutItem succeeded:", bet.username);

        // Update the account cash in table Accounts of dynamodb
        updateCash(params.Item);

        i++;

        if (i === length) {
          // Remove all item in cache
          callback(redis, 'Bets');
          // Notify the superleader on computed topic with msg: 'eire'
          snsapi.publishStringMessage('arn:aws:sns:eu-west-1:993460052932:computed', 'frnk', 'eu-west-1');
          process.send('done');
        }
      }
    });
  })
}


exports.getCash = function getCash(user, res) {
  /** Return the cash of user
  *  @param user is {username: username}
  *  @param res is the http response
  */
  console.log("get cash",user)
  var params = {
    TableName: "Accounts",
    Key: {
      "username": user.username
    }
  };

  dynamodbCl.get(params, function (err, data) {
    if (err) {
      console.error("GET CASH:Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      res.send({});
    } else if (data.Item !== undefined && data.Item.cash !== undefined) {
      res.send({ cash: data.Item.cash });
    } else {
      res.send({});
    }
  });
}

exports.getDailyNumber = function getDailyNumber(res) {

  var params = {
    TableName: "DailyNumber",
    Key: {
      "admin": "agostinistefano1991@gmail.com"
    }
  };

  dynamodbCl.get(params, function (err, data) {
    if (err) {
      console.error("GET DAILY: Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      res.send({});
    } else if (data.Item !== undefined && data.Item.number !== undefined) {
      res.send({ number: data.Item.number});
    } else {
      res.send({});
    }
  });
}
