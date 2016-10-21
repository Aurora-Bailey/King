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
    {name: 'schema', type: {name: 'Schema', type: 'enum', symbols: [
      'map',
      'mapbit',
      'move',
      'leaderboard',
      'movedone',
      'q',
      'joinupdate'
    ]}},
    {name: 'data', type: 'bytes'}
  ]
});

const type = {};

// Game
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
type.movedone = avro.parse({
  name: 'Movedone',
  type: 'record',
  fields: [
    {name: 'm', type: {name: 'M', type: 'enum', symbols: ['movedone']}},
    {name: 'x',type: 'int'},
    {name: 'y',type: 'int'}
  ]
});

// Server
type.q = avro.parse({
  name: 'Q',
  type: 'record',
  fields: [
    {name: 'm', type: {name: 'M', type: 'enum', symbols: ['q']}},
    {name: 'type',type: 'string'},
    {name: 'n',type: 'int'}
  ]
});
type.joinupdate = avro.parse({
  name: 'Joinupdate',
  type: 'record',
  fields: [
    {name: 'm', type: {name: 'M', type: 'enum', symbols: ['joinupdate']}},
    {name: 'players',type: 'int'},
    {name: 'force',type: 'int'},
    {name: 'timeout',type: 'long'},
    {name: 'note',type: 'string'}
  ]
});
// add name to wrapper enum for each new type
/* eslint-enable */
