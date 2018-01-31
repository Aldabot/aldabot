import dotenv from 'dotenv';
import {
    respondTextMessage,
    respondImageMessage
} from "./messenger.js";
import Promise from "bluebird";
var apiai = require('apiai');
dotenv.config();

const app = apiai(process.env.DIALOGFLOW_CLIENT_ACCESS_TOKEN);

const hasMessages = (response) => {
    let messages = response.result.fulfillment.messages;
    console.log(messages[0].speech);
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
    for (let message of messages) {
        switch(message.type) {
        case 1: // Card
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

    return Promise.all(promises);
}
