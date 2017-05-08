module.exports = function(RED) {
    function SetupNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var conf = config;

        node.on('input', function(msg) {
            msg.cestore = {server: conf.server, store: conf.store};

            node.send(msg);
        });
    }
    RED.nodes.registerType("ce-setup",SetupNode);
}
