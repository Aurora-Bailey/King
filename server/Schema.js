/* eslint-disable */
const avro = require('avsc/etc/browser/avsc-types');

module.exports.pack = function (schema, data) {
  return wrapper.toBuffer({schema: schema, data: type[schema].toBuffer(data)})
}
module.exports.unpack = function (buf) {
  var unwrapped = wrapper.fromBuffer(buf);
  return type[unwrapped.schema].fromBuffer(unwrapped.data);
}
module.exports.dummy = 'asdf';

const wrapper = avro.parse({
  name: 'Message',
  type: 'record',
  fields: [
    {name: 'schema', type: 'string'},
    {name: 'data', type: 'bytes'}
  ]
});

const type = {};

type.map = avro.parse({
  name: 'Map',
  type: 'record',
  fields: [
    {name:'m',type:'string'},
    {name:'type',type:'string'},
    {name:'data',type:{type:'array',items:{type:'array',items:'int'}}}
  ]
});
/* eslint-enable */
