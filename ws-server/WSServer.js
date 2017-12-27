/**
 * Created by peccin on 18/07/2016.
 */

module.exports = {
    wsserver: WSServer
};

// const HTTP_PORT = 5001;

// const fs = require('fs');
// const http = require('http');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

function WSServer(httpServer, httpPort) {

    // Yes, SSL is required
    // const serverConfig = {
    //     key: fs.readFileSync('key.pem'),
    //     cert: fs.readFileSync('cert.pem'),
    // };

    // ----------------------------------------------------------------------------------------

    // Create a server for the client html page
    // var handleRequest = function (request, response) {
    //     // Render the single client html file for any request the HTTP server receives
    //     console.log('request received: ' + request.url);
    //
    //     if (request.url === '/') {
    //         response.writeHead(200, {'Content-Type': 'text/html'});
    //         response.end(fs.readFileSync('client/index.html'));
    //     } else if (request.url === '/webrtc.js') {
    //         response.writeHead(200, {'Content-Type': 'application/javascript'});
    //         response.end(fs.readFileSync('client/webrtc.js'));
    //     }
    // };

    // var httpServer = http.createServer(serverConfig, handleRequest);
    // var httpServer = http.createServer(handleRequest);
    // httpServer.listen(HTTP_PORT, '0.0.0.0');

    // ----------------------------------------------------------------------------------------

    // Create a server for handling websocket calls
    var wss = new WebSocketServer({server: httpServer});   // , port: httpPort });

    wss.on('connection', function (ws) {
        console.log('new ws connection');
        ws.on('message', function (message) {
            // Broadcast any received message to all clients
            console.log('ws received: %s', message);
            wss.broadcast(message);
        });
    });

    wss.broadcast = function (data) {
        this.clients.forEach(function  (client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    };

    console.log('WebSocket server running on port: ' + httpPort);

}