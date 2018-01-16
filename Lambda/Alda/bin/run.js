const lambdaModule = require('../dist/index.js');
const lambda = lambdaModule['handler'];

function succeed(result) {
  console.log(result);
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

// Messenger message body
// const body = {"object":"page","entry":[{"id":"109017126525560","time":1515582777160,"messaging":[{"sender":{"id":"1705514732805822"},"recipient":{"id":"109017126525560"},"timestamp":1515576484638,"message":{"mid":"mid.$cAAA51ZR31vhnEKsrHlg32Xixeo7y","seq":111371,"text":"hola"}}]}]}


const messengerBody = JSON.stringify({
    "object":"page",
    "entry":[
        {
            "id":"109017126525560",
            "time":1515582777160,
            "messaging":[
                {
                    "sender":{
                        "id":"1705514732805822"
                    },
                    "recipient":{
                        "id":"109017126525560"
                    },
                    "timestamp":1515576484638,
                    "message":{
                        "mid":"mid.$cAAA51ZR31vhnEKsrHlg32Xixeo7y",
                        "seq":111371,
                        "text":"saldo"
                    }
                }
            ]
        }
    ]
});

const event = {
    httpMethod: "POST",
    queryStringParameters: {},
    body: messengerBody
};

const callback = (noIdea, response) => {
    console.log(JSON.stringify(response, null, 4));
    process.exit();
};

lambda(event, context, callback);
