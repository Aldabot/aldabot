'use strict';

const
request = require('request'),
express = require('express'),
bodyParser = require('body-parser'),
app = express().use(bodyParser.json());

const lambdaModule = require('../dist/index.js');
const lambda = lambdaModule['handler'];

// fake lambda context
function succeed(result) {
    //console.log(result);
    process.exit(0);
}
function fail(error) {
    console.error(error);
    process.exit(1);
}
const context = {
    succeed: succeed,
    fail: fail,
    done: (err, res) => err ? fail(err) : succeed(res),
    getRemainingTimeInMillis: () => Infinity,
    functionName: "fakeLambda",
    functionVersion: "0",
    invokedFunctionArn: "arn:aws:lambda:fake-region:fake-acc:function:fakeLambda",
    memoryLimitInMB: Infinity,
    awsRequestId: "fakeRequest",
    logGroupName: "fakeGroup",
    logStreamName: "fakeStream",
    identity: null,
    clientContext: null
};

app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

app.post('/webhook', (req, res) => {
    const event = {
        "body": JSON.stringify(req.body),
        "queryStringParameters": req.query,
        "httpMethod": req.method
    };

    const callback = (noIdea, response) => {
        let statusCode = response.statusCode;
        let headers = response.headers;
        let body = response.body;

        res.status(statusCode).send(body);
    };

    lambda(event, context, callback);
})

app.get('/webhook', (req, res) => {
    // curl -X GET "https://9f532725.ngrok.io/webhook?hub.verify_token=aldaHURN&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe"
    let VERIFY_TOKEN = "aldaHURN";

    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            // Responds with the challenged token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            // Respons with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
})
