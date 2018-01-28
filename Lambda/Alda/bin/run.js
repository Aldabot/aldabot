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

function textMessage(text) {
    return  {
        "mid":"mid.$cAAA51ZR31vhnEKsrHlg32Xixeo7y",
        text
    };
}

function quickReply(text, payload) {
    return {
        "mid":"mid.$cAAA51ZR31vhnEKsrHlg32Xixeo7y",
        text,
        quick_reply: {
            payload
        }
    };
}

function webhookEvent(eventType, text, payload) {
    var eventFormat = {
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
                        "timestamp":1515576484638
                    }
                ]
            }
        ]
    };
    switch(eventType) {
    case "messages":
        eventFormat.entry[0].messaging[0].message = textMessage(text);
        break;
    case "quickReply":
        eventFormat.entry[0].messaging[0].message = quickReply(text, payload);
        break;
    };

    return eventFormat;
};


// console.log(webhookEvent("messages", "saldo"));
// const messengerBody = JSON.stringify(webhookEvent("messages", "saldo"), null, 4);
const messengerBody = JSON.stringify(webhookEvent("messages", "gastos"), null, 4);
// const messengerBody = JSON.stringify(webhookEvent("quickReply", "Empecemos", "START_LOGIN"), null, 4);
// console.log(messengerBody);
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
