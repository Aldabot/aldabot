import apiai from 'apiai';

export default class Dialogflow  {
  constructor(client_access_token) {
    this.app = apiai(client_access_token);

    this.getIntent = this.getIntent.bind(this);
  }

  getIntent(query) {
    return new Promise((resolve, reject) => {
      var request = this.app.textRequest(query, {
          sessionId: '<unique session id>'
      });

      request.on('response', function(response) {
          // console.log(response);
          resolve(response.result.metadata.intentName);
      });

      request.on('error', function(error) {
          console.error(error);
          resolve(error);
      });

      request.end();
    });
  };
}
