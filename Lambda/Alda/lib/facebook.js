import request from 'request'

export default class facebook {
  constructor(page_acces_token, body) {
    this.page_acces_token = page_acces_token;

    this.webhook_event = body.entry[0].messaging[0];
    this.sender_psid = this.webhook_event.sender.id;
    this.messageText = this.webhook_event.message.text;

    this.getMessageText = this.getMessageText.bind(this);
    this._callSendAPI = this._callSendAPI.bind(this);
  }

  getSenderPSID() {
    return this.sender_psid;
  }

  getMessageText() {
    return this.messageText;
  }

  sendTextToMessenger(text)  {
    return new Promise((resolve, reject) => {
      const response = {
        "text": text
      }
      this._callSendAPI(response).then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }
  //
  // handleMessage(sender_psid, received_message) {
  //   let response;
  //
  //   // Check if the message contains text
  //   if (received_message.text) {
  //     if (received_message.text != 'template') {
  //       // Create the payload
  //       response = {
  //         "text": `Hello`
  //       }
  //     } else {
  //       response = {
  //         "attachment": {
  //           "type": "template",
  //           "payload": {
  //             "template_type": "generic",
  //             "elements": [{
  //               "title": "Is this the right picture?",
  //               "subtitle": "Tap a button to answer.",
  //               "image_url": "https://www.google.es/url?sa=i&rct=j&q=&esrc=s&source=images&cd=&cad=rja&uact=8&ved=0ahUKEwi2zqGHucrYAhUJvxQKHW6TArUQjRwIBw&url=https%3A%2F%2Fwww.w3schools.com%2Fw3css%2Fw3css_images.asp&psig=AOvVaw1iJ2G4yinJP3IJFdq14PN5&ust=1515572334421701",
  //               "buttons": [
  //                 {
  //                   "type": "postback",
  //                   "title": "Yes!",
  //                   "payload": "yes",
  //                 },
  //                 {
  //                   "type": "postback",
  //                   "title": "No!",
  //                   "payload": "no",
  //                 }
  //               ],
  //             }]
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  _callSendAPI(response) {
    return new Promise((resolve, reject) => {
      // Construct the message body
      let request_body = {
        "recipient": {
          "id": this.sender_psid
        },
        "message" : response
      }
      // console.log(PAGE_ACCESS_TOKEN);
      console.log(request_body);

      // Send the HTTP request to the Messenger Platform
      request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": this.page_acces_token },
        "method": "POST",
        "json": request_body
      }, (err, res, body) => {
        if (!err) {
          console.log('message sent!')
          resolve();
        } else {
          console.error("Unable to send message:" + err);
          reject(err);
        }
      });
    });
  }
}
