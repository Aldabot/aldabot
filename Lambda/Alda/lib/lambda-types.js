/* @flow */

export type LambdaContext = {
  succeed: (result: any) => void,
  fail: (error: Error) => void,
  done: (error: Error, result: any) => void,
  getRemainingTimeInMillis: () => number,
  functionName: string,
  functionVersion: number | string,
  invokedFunctionArn: string,
  memoryLimitInMB: number,
  awsRequestId: number | string,
  logGroupName: string,
  logStreamName: string,
  identity: ?AmazonCognitoIdentity,
  clientContext: ?AWSMobileSDKClientContext
};
