var apiai = require('apiai');

var app = apiai("9f8ab0fe92fa4de0bc4a47bb586cbb19");

var request = app.textRequest('saldo', {
    sessionId: 'abc'
});

request.on('response', function(response) {
    console.log(response);
});

request.on('error', function(error) {
    console.log(error);
});

request.end();
