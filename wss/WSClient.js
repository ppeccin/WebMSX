
const WebSocket = require("ws");

wmsx.WSClient = function() {

    const Class = function WSClient(id, ws, server) {

        this.id = id;
        this.ws = ws;
        this.ws.wmsxWSClient = this;
        this.server = server;
        this.messageListener = undefined;
        this.forceClosed = undefined;

        this.ws.on("message", message => this.onWSMessage(message));
        this.ws.on("close", ws => this.onWSClose(ws));
    };
    const Proto = Class.prototype;

    Proto.sendMessage = function(message) {
        this.ws.send(JSON.stringify(message));
    };

    Proto.closeForced = function() {
        this.forceClosed = true;
        this.ws.close();
    };

    Proto.setMessageListener = function(listener) {
        this.messageListener = listener;
    };

    Proto.onWSMessage = function(message) {
        // console.log("WSClient " + this.id + " >>> Message received:", message);

        if (this.messageListener) this.messageListener(this, JSON.parse(message));
    };

    Proto.onWSClose = function(ws) {
        if (!this.forceClosed) this.server.onWSClientDisconnected(this);
        this.cleanUp();
    };

    Proto.cleanUp = function() {
        this.ws = this.server = this.messageListener = undefined;
    };

    return Class;
}();