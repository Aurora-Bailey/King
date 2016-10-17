var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost:27017/king', function (king_err, king_db) {
  MongoClient.connect('mongodb://localhost:27017/kingz', function (kingz_err, kingz_db) {
    king_db.collection('players').find().toArray(function(err, docs){
      if (err) {
        console.log(err);
      } else if (docs.length != 0) {
        //Results
        docs.forEach((old, i)=>{
          let fresh = {};
          fresh.cookie = old.cookie;
          fresh.facebook = false;
          fresh.id = old.id;
          fresh.name = old.name;
          fresh.points = {game_classic: ((old.points - 100000) * 50) + 15000} ;
          fresh.totalplays = {game_classic: old.numplays};
          fresh.totaltime = 0;
          fresh.lastlogin = old.lastlogin;
          fresh.signupdate = Date.now();
          fresh.pastnames = [];
          fresh.session = [];
          fresh.pastgames = [];

          kingz_db.collection('players').insertOne(fresh, function(err){
            if(!err)
              console.log(fresh.name);
          });
        });

      } else {
        console.log('No results.');
      }
    });
  });
});
