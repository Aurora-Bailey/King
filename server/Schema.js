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
    {name: 'schema', type: {name: 'Schema', type: 'enum', symbols: ['map', 'mapbit', 'move', 'leaderboard']}},
    {name: 'data', type: 'bytes'}
  ]
});

const type = {};

type.map = avro.parse({
  name: 'Map',
  type: 'record',
  fields: [
    {name: 'm', type: {name: 'M', type: 'enum', symbols: ['map']}},
    {name:'units',type:{type:'array',items:{type:'array',items:'int'}}},
    {name:'owner',type:{type:'array',items:{type:'array',items:'int'}}},
    {name:'token',type:{type:'array',items:{type:'array',items:'int'}}}
  ]
});
type.mapbit = avro.parse({
  name: 'Mapbit',
  type: 'record',
  fields: [
    {name: 'm', type: {name: 'M', type: 'enum', symbols: ['mapbit']}},
    {name:'units',type:{type:'array',items:'int'}},
    {name:'owner',type:{type:'array',items:'int'}},
    {name:'token',type:{type:'array',items:'int'}}
  ]
});
type.move = avro.parse({
  name: 'Move',
  type: 'record',
  fields: [
    {name: 'm', type: {name: 'M', type: 'enum', symbols: ['move']}},
    {name:'move',type:{type:'array',items:'int'}}
  ]
});
type.leaderboard = avro.parse({
  name: 'Leaderboard',
  type: 'record',
  fields: [
    {name: 'm', type: {name: 'M', type: 'enum', symbols: ['leaderboard']}},
    {name:'data',type:{type:'array',items:{type:'record',fields:[
      {name:'pid',type:'int'},
      {name:'units',type:'int'},
      {name:'cells',type:'int'}
    ]}}}
  ]
});
// add name to wrapper enum for each new type
/* eslint-enable */
