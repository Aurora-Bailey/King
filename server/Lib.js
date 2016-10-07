'use strict';
var crypto = require('crypto');

class Lib {
  static  randString(length, lower, upper, numbers) {
    var text = "";
    var possible = "";
    var possLower = 'abcdefghijklmnopqrstuvwxyz';
    var possUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var possNum = '0123456789';

    if (lower)
      possible += possLower;
    if (upper)
      possible += possUpper;
    if (numbers)
      possible += possNum;

    for (var i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  static distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  static deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  static md5(string) {
    return crypto.createHash('md5').update('' + string).digest('hex');
  }

  static humanTimeDiff(from, to) {
    let diff = to - from;
    let hours = Math.floor(diff/3600000);
    diff = diff % 3600000;
    let minutes = Math.floor(diff/60000);
    diff = diff % 60000;
    let seconds = Math.floor(diff/1000);

    if (seconds < 10) seconds = '0' + seconds;

    return '' + hours + 'h ' + minutes + ':' + seconds
  }
}

module.exports = Lib;
