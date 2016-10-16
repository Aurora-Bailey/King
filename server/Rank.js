'use strict';

let k = 320;

class Rank {
  static  elo(winner, loser) {
    let e = 1 / (1 + Math.pow(10, (loser - winner) / 4000));
    return Math.round(k * (1 - e));
  }

  static multi(arr) { // Array of points in order of first place first.
    // load players array with points
    let players = [];
    arr.forEach((points, i)=>{
      players[i] = {points: points, winnings: [], average: 0}
    });

    // add wins/loses to player.winnings
    for (let i = 0; i < players.length -1; i++) {
      for (let j = i + 1; j < players.length; j++) {
        let pointDiff = this.elo(players[i].points, players[j].points);
        players[i].winnings.push(pointDiff);
        players[j].winnings.push(-pointDiff);
      }
    }

    // compile win/loss into a single average
    players.forEach((player)=>{
      player.average = Math.round(player.winnings.reduce( (prev, curr) => prev + curr ) / player.winnings.length);
    });

    // join all players together into a single array
    let res = players.reduce(function(prev, curr) {
      prev.push(curr.average);
      return prev;
    }, []);

    // output an array, the same way it was input
    return res;
  }
}

module.exports = Rank;


// console.log(Rank.elo(19000, 25000));

// console.log(Rank.multi([15000,19000,15000]));
