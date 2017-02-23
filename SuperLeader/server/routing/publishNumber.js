const snsapi = require('../libs/snsApi.js');
const dynamoapi = require('../libs/dynamoApi.js');
console.log("provcess argv", process.argv[2]);

/** Sends the daily number to the new user */
setTimeout(function () {

    var params = {
        TableName: "DailyNumber",
        Key: {
            "admin": "agostinistefano1991@gmail.com"
        }
    };

    dynamoapi.dynamodbCl.get(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else if (data.Item.number !== undefined) {

            var temp_string = 'Il numero di oggi è ' + data.Item.number;
            //email and text with draw number
            snsapi.sendToNewUser(process.argv[2], temp_string);
        }
    });

}, 300000);

process.once('exit', (code) => {
    process.kill(process.pid, 'SIGKILL');
});
