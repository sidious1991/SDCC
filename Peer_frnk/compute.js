/** Source for curious : https://it.wikipedia.org/wiki/Roulette */

const util = require('./utils/betTmplt.js');

function bet(list, num) {
    /** It returns the multiplier of the current bet */
    /** @param list is the bet
        @param num is the number generated
    */
console.log("bet compute",list);
    var n = list.length;
    var filtered = list.filter((value) => value === num);

    return (filtered.length > 0 ? (util.constants.MAX_NUM / n) : 0);
}

function simpleBet(type, num) {
    /** It returns the multiplier of the current bet */
    /** @param type is the simple bet
        @param num is the number generated
    */

    switch (type) {

        case util.constants.PAIR:

            return 2 * (num % 2 === 0 && num !== 0);

        case util.constants.IMPAIR:

            return 2 * (num % 2 !== 0);

        case util.constants.MANQUE:

            return 2 * ((num >= 1) && (num <= 18));

        case util.constants.PASSE:

            return 2 * ((num >= 19) && (num <= 36));

        case util.constants.ROUGE:

            return bet(util.constants.ROUGE_NUM, num);

        case util.constants.NOIR:

            return bet(util.constants.NOIR_NUM, num);

        default:

            break;
    }

    return 0;
}

function multiplier(l_s, num) {
    /** It returns the multiplier of the current bet */
    /** @param l_s is of type string or list
        @param num is the number generated
    */

    return (typeof (l_s) === 'string' ? simpleBet(l_s, num) : bet(l_s, num));
}

/** Use the follower */

exports.wonCash = function wonCash(bet, bet_cash, num) {
    /** It returns the money won in the current bet (win) */
    /** @param bet is of type string or list
        @param num is the number generated
        @param bet_cash is the bet cash
    */

    return bet_cash * (multiplier(bet, num));
}
