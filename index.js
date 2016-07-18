var express = require('express');
var request = require('request');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/static'));

app.get('/proxy-remote-download/:remoteurl', function(req, res) {

    var url = req.params.remoteurl;
    console.log(">>> Serving proxy download from: " + url);

    request(url).pipe(res);

});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
