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

const messengerBody = JSON.stringify({
    sessionId: '38269b29-4334-49ad-90fc-e0d1dfb45cef',
    username: 'y4310687h',
    password: '2063'
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
