var express = require('express');
var proxy =   require('./proxy-downloader/ProxyDownloader');

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/website'));

app.get('/proxy-remote-download', proxy.processGet);

app.listen(app.get('port'), function() {
    console.log('WebMSX started on port', app.get('port'));
});
