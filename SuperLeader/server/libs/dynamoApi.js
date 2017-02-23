var AWS = require('aws-sdk');
var snsapi = require('./snsApi.js');
const cp = require('child_process');

AWS.config.loadFromPath('./utils/configDynamo.json'); // required

AWS.config.update({ endpoint: "https://dynamodb.eu-west-1.amazonaws.com" });

var dynamodbCl = new AWS.DynamoDB.DocumentClient();

// Speed up calls to hasOwnProperty
var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

exports.signUp = function signUp(credentials, res) {
    /** Put credentials in db
     *  @param credentials are the credentials
     *  @param res is the http response
     */

    var tempParam = {
        TableName: "Accounts",
        Key: {
            "username": credentials.username
        }
    };

    dynamodbCl.get(tempParam, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        }

        else if (!isEmpty(data)) {
            res.send('sign error');
        }

        else {

            var params = {
                TableName: "Accounts",
                Item: {
                    "username": credentials.username,
                    "password": credentials.password,
                    "name": credentials.name,
                    "surname": credentials.surname,
                    "cash": 100 // Initial default cash
                }
            };

            dynamodbCl.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add credentials", credentials.username, ". Error JSON:", JSON.stringify(err, null, 2));
                    res.send('sign error');
                } else {
                    console.log("PutItem succeeded:", credentials.username);
                    snsapi.subscribeNewUser(credentials.username, 'arn:aws:sns:eu-west-1:993460052932:daily_code');

                    cp.fork('./routing/publishNumber.js', [credentials.username]);
                    res.send('signed');
                }
            });
        }
    });
}

exports.logIn = function logIn(credentials, res) {
    /** Log in a client with credentials
     *  @param credentials are the credentials
     *  @param res is the http response
    */

    var params = {
        TableName: "Accounts",
        Key: {
            "username": credentials.username
        }
    };

    dynamodbCl.get(params, function (err, data) {

        if (!err && (data.Item !== undefined && data.Item.password === credentials.password)) {
            res.send({ username: data.Item.username, cash: data.Item.cash });
        }

        else {
            res.send({});
        }
    });
}

exports.updateDailyNumber = function updateDailyNumber(admin, number) {
    /** Update the daily number
     */

    var params = {
        TableName: "DailyNumber",
        Key: {
            "admin": admin,
        },
        UpdateExpression: "set number = :val",
        ExpressionAttributeValues: {
            ":val": number
        },
        ReturnValues: "UPDATED_NEW"
    };

    dynamodbCl.update(params, function (err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            var temp_string = 'Il numero di oggi per accedere è ' + number;
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            snsapi.publishEmailMessage('arn:aws:sns:eu-west-1:993460052932:daily_code', temp_string);
        }
    });
}

/** TEMPLATE LOGIN DYNAMODB:
 *
 *  {username: ... , password: ... , name: ... , surname: ... , cash: ...}
 *
 */

module.exports.dynamodbCl = dynamodbCl;
