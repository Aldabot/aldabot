export default class Lambda {
  constructor(callback) {
    this.callback = callback;

    this.respond = this.respond.bind(this);
  }
  respond(responseCode, responseBody) {
    this.callback(null, {
      statusCode: responseCode,
      headers: {
          "x-custom-header" : "my custom header value"
      },
      body: responseBody
    })
  }
}
