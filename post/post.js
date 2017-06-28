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

                var cetext = config.cetext;
                var regex = /msg./gi, result, indices = [];
                while ( (result = regex.exec(cetext)) ) {
                    indices.push(result.index);
                }

                var replacements = [];
                for (i = 0; i < indices.length; i++) {
                    var msgIndex = indices[i];
                    var delIndex = leastPositiveIndex(
                        cetext.indexOf(" ", msgIndex),
                        cetext.indexOf("\n", msgIndex)
                    );

                    var paramString;
                    // Case 1: variable followed by space or new line
                    if (delIndex > -1) {
                        // Case 1*: variable at end of sentence mid-text
                        if (cetext.charAt(delIndex - 1) === ".") {
                            delIndex -= 1;
                        }
                        paramString = cetext.substring(msgIndex + 4, delIndex);
                    }
                    // Case 2: variable is last word in whole text
                    else if (cetext.charAt(cetext.length - 1) === ".") {
                        delIndex = cetext.length - 1;
                        paramString = cetext.substring(msgIndex + 4, delIndex);
                    }

                    if (paramString) {
                        var params = paramString.split(".");
                        var result = msg;
                        for (j = 0; j < params.length; j++) {
                            result = result[params[j]];
                        }

                        if (result) {
                            result = result.toString();
                            if (result === "\"" || result === "\'") {
                                result = " ";
                            }
                            result = "\"" + result + "\"";
                        }
                        replacements.push({
                                "variable": "msg." + paramString,
                                "value": result
                            }
                        );
                    }
                }

                for (r = 0; r < replacements.length; r++) {
                    var rep = replacements[r];
                    cetext = cetext.replace(rep.variable, rep.value);
                }

                // Look for instances of {uid}
                // If there are two, split sentences into the creation of the object and it's use
                // Use the creation sentence for the first request...
                // ... then use the response to gets its name and replace {uid} with it in the use sentence

                ce += cetext;

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
                    node.status({fill:"green",shape:"dot",text:"success"});
                    node.send(err);
                })
            }

            else {
                this.status({fill:"green",shape:"dot",text:"success"});
            }
        });


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

function leastPositiveIndex(a, b) {
    var output;
    if (a >= 0 && b >= 0) {
        output = Math.min(a, b);
    }
    else {
        output = Math.max(a, b);
    }
    return output;
}
