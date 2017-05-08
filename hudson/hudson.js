module.exports = function(RED) {
    function HudsonNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var conf = config;

        node.on('input', function(msg) {
          msg.payload = "tbc";

          node.send(msg);
        });
    }
    RED.nodes.registerType("ce-hudson",HudsonNode);
}
