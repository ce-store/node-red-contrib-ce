module.exports = function(RED) {
    function GetNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var conf = config;

        node.on('input', function(msg) {
          //Generic
          var storeFrag = null;
          if ((msg.cestore.store == null) || (msg.cestore.store == "") || (msg.cestore.store == "DEFAULT")) {
            storeFrag = "/";
          } else {
            storeFrag = "/stores/" + msg.cestore.store + "/";
          }

          //Generic
          var parmsFrag = "";
          var connector = "?";
          for (var key in msg.urlparms) {
            if (msg.urlparms.hasOwnProperty(key)) {
              var val = msg.urlparms[key];
              parmsFrag += connector;
              parmsFrag += key;
              parmsFrag += "=";
              parmsFrag += val;
              connector = "&";
            }
          }

          //Specific
          var typeFrag = conf.cetype + "/";

          msg.url = msg.cestore.server + storeFrag + typeFrag + conf.ceid + parmsFrag;
          msg.method = "GET";

          node.send(msg);
        });
    }
    RED.nodes.registerType("ce-get",GetNode);
}
