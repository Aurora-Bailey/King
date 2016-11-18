let request = require('request')

let getData = function(route, token, callback){
  let graph_link = "https://graph.facebook.com/v2.8/";
  let graph_token = "&access_token=" + token;
  let url = graph_link + route + graph_token;

  request({
    url: url,
    json: true
  }, function (error, response, jsonObj) {
    if (!error && response.statusCode === 200) {
      callback(jsonObj);
    }
  });
};

module.exports = {
  getData
}
