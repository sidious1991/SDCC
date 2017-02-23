const countdown = require('countdown');

exports.elapsedTime = function elapsedTime(start) {
    /** It returns the elapsedTime from start (Now - Start)
     *  in milliseconds
     *  @param start is the start time
     */
    var now = new Date();

    return countdown(start, now, countdown.SECONDS).value;
}


exports.getRandomIntInclusive = function getRandomIntInclusive(min, max) {
    /**
     * Returns a random integer between min (included) and max (included) 
     */

    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.mostRecent = function mostRecent(s1, s2) {
    /** 
     * Returns true if state s1 is more recent than s2, false otherwise
     * 
     * Structure of s (e.g.): { 'phase': 'compute', 'hand': 0, 'num': 0, 'date': new Date(), 'list_response': [] }
     * if hand(s1) > hand(s2) return true
     * else if(hand(s1) < hand(s2)) return false
     * else compare the phases
     * else return false
     */

    if (s1.hand !== s2.hand) {
        return s1.hand > s2.hand;
    }

    // s1.hand === s2.hand
    else if (s1.phase !== s2.phase) {
        return (s1.phase === 'compute' && s2.phase === 'play');
    }

    else {
        return false;
    }
}
