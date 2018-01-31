import dotenv from 'dotenv';
import {
    respondTextMessage,
    respondImageMessage,
    respondGenericTemplateMessage,
    createWebUrlButton,
    createElement
} from "./messenger.js";
import Promise from "bluebird";
var apiai = require('apiai');
dotenv.config();

const app = apiai(process.env.DIALOGFLOW_CLIENT_ACCESS_TOKEN);

const hasMessages = (response) => {
    let messages = response.result.fulfillment.messages;
    if (messages[0].speech != "") {
        return true;
    }
    return false;
};

export const getIntent = (psid, message) => {
    return new Promise((resolve, reject) => {
        var request = app.textRequest(message, {
            sessionId: psid
        });

        request.on('response', function(response) {
            // console.log(JSON.stringify(response, null, 4));
            response.result.hasMessages = hasMessages(response);
            resolve(response.result);
        });

        request.on('error', function(error) {
            reject(error);
        });

        request.end();
    });
};


export const dialogflowRedirectMessages = (psid, messages) => {
    let promises = [];
    let elements = [];
    for (let message of messages) {
        switch(message.type) {
        case 1: // Card
            let buttons = [];
            if (message.buttons) {
                buttons = message.buttons.map((button) => {
                    return createWebUrlButton(button.text, "https://aldabot.es"); //button.postback);
                });
            }
            elements.push(createElement(message.title, message.subtitle, buttons));
            break;
        case 3: // Image
            promises.push(respondImageMessage(psid, message.imageUrl));
            break;
        default:
            if (message.speech) {
                promises.push(respondTextMessage(psid, message.speech));
            } else {
                console.error("dialogflow response type not known");
            }
        }
    }
    // !!! messages are not in ORDER !!! FIX THAT
    // elements will always be send last
    if (elements.length > 0) {
        promises.push(respondGenericTemplateMessage(psid, elements));
    };

    // !! all is parallel need to serialize!
    return Promise.all(promises);
};
