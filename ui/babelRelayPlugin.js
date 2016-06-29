const getBabelRelayPlugin = require('babel-relay-plugin');
const schemaData = require('./schema.json').data;
const plugin = getBabelRelayPlugin(schemaData);
module.exports = plugin;
