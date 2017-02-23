const countdown = require('countdown');


exports.elapsedTime = function elapsedTime(start) {
    /** It returns the elapsedTime from start (Now - Start)
     *  in milliseconds
     *  @param start is the start time
     */
    var now = new Date();

    return countdown(start, now, countdown.SECONDS).value;
}

/*
var now = new Date();
var elp = elapsedTime(now);


while (elp < 5000) {
    elp = elapsedTime(now);
}
*/
