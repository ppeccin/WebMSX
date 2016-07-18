var express = require('express');
var request = require('request');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/static'));

app.get('/proxy-remote-download/', function(req, res) {

    var url = req.params.u;
    console.log(">>> Serving proxy download from: " + url);

    var url2 = req.u;
    console.log(">>> Serving proxy download from: " + url2);

    request(url).pipe(res);

});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
