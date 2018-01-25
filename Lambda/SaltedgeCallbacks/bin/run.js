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


const successBody = {
    "data": {
        "login_id": 835741,
        "customer_id":575211,
        "custom_fields":{}
    },
    "meta":{
        "version": "3",
        "time": "2018-01-21T10:28:53.186Z"
    }
};


const event = {
    resource: '/saltedge/success',
    httpMethod: "POST",
    queryStringParameters: {},
    body: JSON.stringify(successBody)
};

const callback = (noIdea, response) => {
    console.log(JSON.stringify(response, null, 4));
    process.exit();
};

lambda(event, context, callback);
