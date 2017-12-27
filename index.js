

var express =  require('express');
var proxy =    require('./proxy-downloader/ProxyDownloader');
var wsserver = require('./ws-server/WSServer');
var port = process.env.PORT || 5000;


// Proxy Downloader

var server = express();
server.set('port', port);
//server.use(express.static(__dirname + '/website'));
server.get('/proxy-remote-download', proxy.processGet);

server.listen(server.get('port'), function() {
    console.log('WebMSX started on port', server.get('port'));
});


// WS Server

wsserver.wsserver(server, port);