
wmsx.Session = function() {

    const Class = function Session(id, manager) {

        this.id = id;
        this.manager = manager;

        this.server = undefined;
        this.clients = {};

    };
    const Proto = Class.prototype;

    Proto.transferWSClientAsServer = function(wsClient) {
        console.log("Session " + this.id + " >>> Setting Server " + wsClient.id);

        this.server = wsClient;
        wsClient.setMessageListener(onServerMessage);
    };

    Proto.transferWSClientAsClient = function(wsClient) {
        console.log("Session " + this.id + " >>> Joining Client " + wsClient.id);

        this.clients[wsClient.id] = wsClient;
        wsClient.setMessageListener(onClientMessage);
    };

    Proto.onServerMessage = function (wsClient, message) {
        console.log("Session " + this.id + " >>> Server message: " + message);
    };

    Proto.onClientMessage = function (wsClient, message) {
        console.log("Session " + this.id + " >>> Client " + wsClient.id + " message: " + message);
    };

    return Class;

}();