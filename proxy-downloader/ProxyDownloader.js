/**
 * Created by peccin on 18/07/2016.
 */

module.exports = {
    processGet: processGet
};

var request = require('request');

function processGet(req, res) {

    var url = req.query.url;
    console.log(">>> Serving proxy download from: " + url);

    // Return a good filename
    res.attachment(url);

    // Restrict use

    var cors = process.env.CORS_FROM;
    if (cors) {
        console.log(">>> CORS: " + cors);
        res.header("Access-Control-Allow-Origin", cors);
    }

    // Fire
    request(url).pipe(res);

}

