module.exports = function(RED) {
    function ParmsNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var conf = config;

        node.on('input', function(msg) {
          msg.headers = {};
          if ((conf.format == null) || (conf.format == "") || (conf.format == "json")) {
            msg.headers["Accept"] = "application/json";
          } else {
            msg.headers["Accept"] = "text/plain";
          }

          msg.urlparms = {};
          if (conf.showstats) {
            msg.urlparms.showStats = "true";
          } else {
            msg.urlparms.showStats = "false";
          }

          node.send(msg);
        });
    }

    RED.nodes.registerType("ce-parms",ParmsNode);
}
