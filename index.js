
wmsx = {};  // namespace

require("./wss/WSServer");
require("./wss/WSClient");
require("./sessions/Session");
require("./sessions/SessionManager");

const express =  require("express");
const proxy =    require("./proxy-downloader/ProxyDownloader");
const port =     process.env.PORT || 80;


// Proxy Downloader

const app = express();
app.get('/proxy-remote-download', proxy.processGet);

const httpServer = app.listen(port, function() {
    console.log('Proxy and Signaling server started on port', port);
});


// WS Server

const wss = new wmsx.WSSever();
wss.start(httpServer);


// Session Manager

const sessionManager = new wmsx.SessionManager(wss);