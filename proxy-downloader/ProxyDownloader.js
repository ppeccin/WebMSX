/**
 * Created by peccin on 18/07/2016.
 */

module.exports = {
    processGet: processGet
};

var request = require('request');

function processGet(req, res) {

    // Log
    var url = req.query.url;
    console.log(">>> Serving proxy download request: " + url + " from: " + (req.headers["Origin"] || req.headers["origin"]));

    // Return a good filename
    res.attachment(url);

    // Restrict use?
    var cors = process.env.CORS_FROM;

    // Fire
    request
        .get(url)
        .on('response', function(response) {
            if (cors) {
                var allowOriginHeader = response.headers["access-control-allow-origin"] ? "access-control-allow-origin" : "Access-Control-Allow-Origin";
                response.headers[allowOriginHeader] = cors;
            }
        })
        .pipe(res);

}

