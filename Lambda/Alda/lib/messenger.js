// @flow

import request from 'request';
import Promise from 'bluebird';

// Flow types
type UrlButton = {
    type: string,
    url: string,
    title: string
};
type ButtonTemplate = {
    template_type: string,
    text: string,
    buttons: Button
};

export default class Messenger {
    constructor(page_acces_token: string, body) {
        this.page_acces_token = page_acces_token;

        this.webhook_event = body.entry[0].messaging[0];
        this.sender_psid = this.webhook_event.sender.id;
        this.messageText = this.webhook_event.message.text;

        this.messagesToSend = [];

        this.getMessageText = this.getMessageText.bind(this);
        this._callSendAPI = this._callSendAPI.bind(this);
        this.sendAsync = this.sendAsync.bind(this);
        this.addTextMessage = this.addTextMessage.bind(this);
        this.addButtonTemplate = this.addButtonTemplate.bind(this);
    }

    getSenderPSID() {
        return this.sender_psid;
    }

    getMessageText() {
        return this.messageText;
    }

    addTextMessage(text) {
        const message = {
            text
        };
        this.messagesToSend.push(message);
    }

    sendQuickReply(text, quickReply) {
        const response = {
            "text": text,
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": "Vamos a empezar",
                    "payload": "lol"
                }
            ]
        };
        return this._callSendAPI(response);
    }


    urlButton(url: string, title: string): urlButton {
        return {
            type: "web_url",
            url,
            title
        };
    }

    addButtonTemplate(text: string, buttons: Array<Button>): null {
        const buttonTemplateAttachement = {
            attachement: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: text,
                    buttons: buttons
                }
            }

        };
        this.messagesToSend.push(buttonTemplateAttachement);
    }

    sendAsync() {
        return Promise.each(this.messagesToSend, (message) => {
            return this._callSendAPI(message);
        });
    }

    _callSendAPI(response) {
        return new Promise((resolve, reject) => {
            // Construct the message body
            let request_body = {
                "recipient": {
                    "id": this.sender_psid
                },
                "message" : response
            };

            // Send the HTTP request to the Messenger Platform
            request({
                "uri": "https://graph.facebook.com/v2.6/me/messages",
                "qs": { "access_token": this.page_acces_token },
                "method": "POST",
                "json": request_body
            }, (err, res, body) => {
                if (!err) {
                    resolve();
                } else {
                    console.log('SendAPI: ', err);
                    reject(err);
                }
            });
        });
    }
}
