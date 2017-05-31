module.exports = function(RED) {
    var request = require('request-promise');

    function CEPost(config) {
        RED.nodes.createNode(this,config);
        // node-specific code goes here
        var node = this;

        this.on('input', function(msg) {

            // Get url and store if set
            var ceUrl;
            if (node.context().flow.get('ceUrl')) {
                ceUrl = node.context().flow.get('ceUrl');
            }
            else if (node.context().global.get('ceUrl')) {
                ceUrl = node.context().global.get('ceUrl');
            }

            if (ceUrl) {
                node.status({fill:"blue",shape:"dot",text:"posting " + config.cetype});

                // account for variations in url format
                if (ceUrl.indexOf("/ce-store") === -1) {
                  ceUrl += "/ce-store";
                }
                if (ceUrl.indexOf("http") !== 0) {
                  ceUrl = "https://" + ceUrl;
                }

                // determine which store to use
                var ceStore;
                if (node.context().flow.get('ceStore')) {
                    ceStore = node.context().flow.get('ceStore');
                }
                else if (node.context().global.get('ceStore')) {
                    ceStore = node.context().global.get('ceStore');
                }

                if ((ceStore == null) || (ceStore == "") || (ceStore == "DEFAULT")) {
                    // Do nothing; just use default store
                }
                else {
                    ceUrl += "/stores/" + ceStore;
                }

                var ce = '';
                if (config.cetype === 'rules') {
                    ce = '[' + config.rulename + ']\n';
                }
                else if (config.cetype === 'queries') {
                    ce = '[' + config.queryname + ']\n';
                }
                ce += config.cetext;

                var params = {};
                if (config.action) {
                    params.action = config.action;
                }
                if (config.returninstances) {
                    params.returnInstances = config.returninstances;
                }
                if (config.steps) {
                    params.steps = config.steps;
                }
                if (config.mode && config.cetype !== 'rules' && config.cetype !== 'queries') {
                    params.mode = config.mode;
                }

                var url = ceUrl;
                url += "/sentences";
                url += "?ceText=";
                url += ce;
                url += getOptions(params);
                var opts = {
                    method: 'POST',
                    json: true,
                    uri: url
                };
                request(opts)
                .then(function (resp1) {
                    if (config.cetype === 'rules' || config.cetype === 'queries') {

                        var getUrl = ceUrl;
                        if (config.cetype === 'rules') {
                            getUrl += "/rules/";
                            getUrl += config.rulename;
                        }
                        else if (config.cetype === 'queries') {
                            getUrl += "/queries/";
                            getUrl += config.queryname;
                        }
                        getUrl += '/execute';
                        getUrl += '?returnInstances=true';
                        if (config.mode) {
                            getUrl += '&mode=';
                            getUrl += config.mode;
                        }
                        var getOpts = {
                            method: 'GET',
                            json: true,
                            uri: getUrl
                        };

                        return request(getOpts);
                    }
                    else {
                        node.status({fill:"green",shape:"dot",text:"success"});
                        msg.payload = resp1;
                        node.send(msg);
                    }
                })
                .then(function (resp2) {
                    if (config.cetype === 'rules' || config.cetype === 'queries') {
                        node.status({fill:"green",shape:"dot",text:"success"});
                        msg.payload = resp2;
                        node.send(msg);
                    }
                })
                .catch(function (err) {
                    node.status({fill:"red",shape:"dot",text:"http error"});
                    node.send(err);
                })
            }

            else {
                this.status({fill:"red",shape:"dot",text:"ceUrl not set"});
            }
        });


        //this.send(msg);


        this.on('close', function() {
            // tidy up any state
        });


    }
    RED.nodes.registerType("ce-post",CEPost);
}


function getOptions(options) {
    var rtn = "";
    for (key in options) {
    rtn += "&" + key + "=" + options[key];
    }
    return rtn;
}
