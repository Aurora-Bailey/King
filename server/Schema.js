const avro = require('avsc');

module.exports.pack = function (message, data) {
  return msg.toBuffer({msg: message, data: schema[message].toBuffer(data)})
}
module.exports.unpack = function (buf) {
  var message = msg.fromBuffer(buf);
  var data = schema[message.msg].fromBuffer(message.data);

  return {message, data};
}

const msg = avro.parse({
  name: 'Message',
  type: 'record',
  fields: [
    {name: 'msg', type: 'string'},
    {name: 'data', type: 'bytes'}
  ]
});




const schema = {};

schema.map = avro.parse({
  name: 'Map',
  type: 'record',
  fields: [
    {"name":"type","type":"string"},
    {"name":"map","type":{"type":"array","items":{"type":"array","items":"int"}}}
  ]
});
