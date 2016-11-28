/**
 * Created by peccin on 18/07/2016.
 */

module.exports = {
    processGet: processGet
};

var request = require('request');

function processGet(req, res) {

    var url = req.query.url;
    var origin = (req.headers["Origin"] || req.headers["origin"]);

    console.log(">>> Serving proxy download request: " + url + " from: " + origin);

    // Restrict use?
    var cors = process.env.CORS_FROM;

    // Error if not from allowed origins
    if (cors && (!origin || cors.indexOf(origin) < 0)) {
        console.log(">>> Not allowed!");
        res.sendStatus(401);
        return;
    }

    // Return a good filename
    res.attachment(url);

    // Fire
    console.log(">>> Accepted");
    request
        .get(url)
        .on('response', function(response) {
            console.log(">>> Response status: " + response.statusCode);
            addCorsResponseHeader(response);
        })
        .on('error', function(err) {
            console.log(">>> Error: " + err);
            res.write(err);
            res.sendStatus(400);
        })
        .pipe(res);

    function addCorsResponseHeader(response) {
        if (cors && origin) {
            var allowOriginHeader = response.headers["access-control-allow-origin"] ? "access-control-allow-origin" : "Access-Control-Allow-Origin";
            response.headers[allowOriginHeader] = origin;
        }
    }
}