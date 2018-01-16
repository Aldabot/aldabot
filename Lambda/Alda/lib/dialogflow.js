var apiai = require('apiai');

export default class Dialogflow  {
  constructor(client_access_token, sender_psid) {
    this.app = apiai(client_access_token);

    this.sender_psid = sender_psid;
    this.getIntent = this.getIntent.bind(this);
  }

  getIntent(query) {
    return new Promise((resolve, reject) => {
      var request = this.app.textRequest(query, {
          sessionId: this.sender_psid
      });

      console.log('DIALOGFLOW response');
      request.on('response', function(response) {
        console.log(response);
        resolve(response.result.metadata.intentName);
      });

      request.on('error', function(error) {
        console.error(error);
        reject(error);
      });

      request.end();
    });
  };
}
