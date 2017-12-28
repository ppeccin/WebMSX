
const WebSocket = require("ws");

wmsx.WSClient = function() {

    const Class = function WSConnection(id, ws, server) {

        this.id = id;
        this.ws = ws;
        this.ws.wmsxWSClient = this;
        this.server = server;
        this.messageListener = undefined;

        this.ws.on("message", message => this.onWSMessage(message));
        this.ws.on("close", ws => this.onWSClose(ws));
    };
    const Proto = Class.prototype;

    Proto.setMessageListener = function(listener) {
        this.messageListener = listener;
    };

    Proto.onWSMessage = function(message) {
        console.log("WSClient " + this.id + " >>> Message received: " + message);

        if (this.messageListener) this.messageListener(this, message);
    };

    Proto.onWSClose = function(ws) {
        this.server.onClientDisconnection(this);
    };

    return Class;
}();