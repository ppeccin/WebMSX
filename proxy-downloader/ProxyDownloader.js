
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
    addCorsResponseHeader(res);
    console.log(">>> Accepted");
    request
        .get(url)
        .on('response', function(response) {
            console.log(">>> OK! Response status: " + response.statusCode);
        })
        .on('error', function(err) {
            console.log(">>> Error: " + err);
            res.sendStatus(400);
        })
        .pipe(res);

    function addCorsResponseHeader(response) {
        if (cors && origin) {
            response.setHeader("access-control-allow-origin", origin);
            response.setHeader("Access-Control-Allow-Origin", origin);
        }
    }
}