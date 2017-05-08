module.exports = function(RED) {
    function WriteNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var conf = config;

        node.on('input', function(msg) {
            msg.payload = conf.cetext || msg.payload;

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
            var sourceFrag = null;
            if ((conf.cesource == null) || (conf.cesource == "")) {
              sourceFrag = "sentences/";
            } else {
              sourceFrag = "sources/" + conf.cesource + "/";
            }

            //Specific
            if ((conf.action != null) && (conf.action != "") && (conf.action != "save")) {
              parmsFrag += connector + "action=" + conf.action;
            }

            msg.url = msg.cestore.server + storeFrag + sourceFrag + parmsFrag;
            msg.method = "POST";
            node.send(msg);
        });
    }
    RED.nodes.registerType("ce-write",WriteNode);
}
