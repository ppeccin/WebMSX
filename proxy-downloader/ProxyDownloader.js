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

    res.attachment(url);
    request(url).pipe(res);

}

