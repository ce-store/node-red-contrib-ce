module.exports = function(RED) {
    function ExampleNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var conf = config;

        node.on('input', function(msg) {
          var ceText = conf.cetext || msg.payload;
          msg.payload = ceText;

          node.send(msg);
        });
    }
    RED.nodes.registerType("ce-example",ExampleNode);
}
