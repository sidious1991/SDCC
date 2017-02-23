/** Source for curious : https://it.wikipedia.org/wiki/Roulette */

exports.constants = {
    'MIN_NUM': 0,
    'MAX_NUM': 36,

    'PAIR': 'p',
    'IMPAIR': 'i',

    'MANQUE': 'm',
    'PASSE': 'ps',

    'ROUGE': 'r',
    'NOIR': 'n',

    'ROUGE_NUM': [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
    'NOIR_NUM': [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]

    // Il resto sono tutti array! Anche se c'è un numero solo
}


/**

Bet template:

{username(or hash): string , hand: number , bet: (list or string) , bet_cash: (number) , win: (number)}

(win is the sum winned)

E.g. :

{
"username" : "plagueis" , 
"hand": 1,
"bet" : [12],
"bet_cash" : 10
}

User template:

{username: string , total_cash: number}

*/
