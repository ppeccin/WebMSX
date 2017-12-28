
const WebSocket = require("ws");

wmsx.WSSever = function() {

    this.start = function(httpServer) {
        this.wss = new WebSocket.Server({ server: httpServer });
        this.wss.on("connection", ws => this.onWSConnection(ws));
    };

    this.setClientConnectedListener = function(listener) {
        this.clientConnectedListener = listener;
    };

    this.setClientDisconnectedListener = function(listener) {
        this.clientDisconnectedListener = listener;
    };

    this.onWSConnection = function(ws) {
        const client = new wmsx.WSClient(++this.nextClientID, ws, this);

        console.log("WSServer >>> New Client " + client.id + " connected");

        if (this.clientConnectedListener) this.clientConnectedListener(client);
    };

    this.onWSClientDisconnected = function(wsClient) {
        console.log("WSServer >>> Client " + wsClient.id + " disconnected");

        if (this.clientDisconnectedListener) this.clientDisconnectedListener(wsClient);
    };

    this.broadcast = function(message) {
        console.log("WSServer >>> Broadcasting message:", message);

        this.wss.clients.forEach(function(ws) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    };


    this.nextClientID = 0;
    this.wss = undefined;
    this.clientConnectedListener = undefined;
    this.clientDiscnnectedListener = undefined;

};
