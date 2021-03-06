module.exports = function(RED) {
  'use strict';
  var db = require('node-crate');

  function CrateNode(config) {
    RED.nodes.createNode(this, config);
    this.url = config.url;
    this.name = config.name;
  }
  RED.nodes.registerType("crate", CrateNode);

  function CrateOutNode(config) {
    RED.nodes.createNode(this, config);
    this.table = config.table;
    this.name = config.name;
    this.crateConfig = RED.nodes.getNode(config.database);

    if(this.crateConfig) {
      var node = this;
      //use the token to connect to the correct database
      db.connect(node.crateConfig.url);

      node.on('input', function(msg) {
        // if a table was specified
        if(msg.table || node.table) {
          var table = msg.table || node.table;

          // a straight insert
          if(msg.data && !msg.where) {
            db.insert(table, msg.data)
            .success(node.status({fill:"green",shape:"dot",text:"success"}));
          }
          // an update
          else if(msg.data && msg.where) {
            db.update(table, msg.data, msg.where)
            .success(function() {
              node.status({fill:"green",shape:"dot",text:"success"});
            });
          }
          else {
            node.status({fill:"red",shape:"dot",text:"failure"});
            node.error('No data property in msg object to insert.');
          }
        }
        // no table referenced
        else {
          node.status({fill:"red",shape:"dot",text:"failure"});
          node.error('No table specified in node options or incoming msg object.');
        }
      });
    }
  }
  RED.nodes.registerType("crate out", CrateOutNode);

  function CrateInNode(config) {
    RED.nodes.createNode(this, config);
    this.crateConfig = RED.nodes.getNode(config.database);
    this.name = config.name;

    if(this.crateConfig) {
      var node = this;
      //use the token to connect to the correct database
      db.connect(node.crateConfig.url);

      node.on('input', function(msg) {
        // if a query was specified
        if(msg.query || node.query) {
          var query = msg.query || node.query;

          if(msg.args) {
            db.execute(query, msg.args)
            .success(function(res) {
              node.status({fill:"green",shape:"dot",text:"success"});
              msg.payload = res;
              node.send(msg);
            });
          }
          // no args
          else {
            node.status({fill:"red",shape:"dot",text:"failure"});
            node.error('No arguments for the query specified in incoming msg object.');
          }
        }
        // no query referenced
        else {
          node.status({fill:"red",shape:"dot",text:"failure"});
          node.error('No query specified in incoming msg object.');
        }
      });
    }
  }
  RED.nodes.registerType("crate in", CrateInNode);
};
