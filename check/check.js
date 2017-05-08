module.exports = function(RED) {
    function CheckNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var conf = config;

        node.on('input', function(msg) {
          var outputMsg = { format: "string"};

          if (typeof msg.payload == "string") {
            outputMsg.msg = "CE text (non-JSON) responses cannot be checked";
          } else {
            if (msg.payload.structured_response != null) {
              var valSens = msg.payload.structured_response.valid_sentences;
              var invSens = msg.payload.structured_response.invalid_sentences;

              if ((valSens > 0) || (invSens > 0)) {
                outputMsg.msg = "Sentences were processed: ";
                outputMsg.msg += valSens + " valid, ";
                outputMsg.msg += invSens + " invalid";
              }
            } else {
              outputMsg.msg = "Nothing could be determined from this response";
            }
          }

          if ((outputMsg.msg != null) && (outputMsg.msg != "")) {
            RED.comms.publish("debug",outputMsg);
          }

          node.send(msg);
        });
    }
    RED.nodes.registerType("ce-check",CheckNode);
}
