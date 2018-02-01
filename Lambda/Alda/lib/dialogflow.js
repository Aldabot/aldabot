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
    for (let i in messages) {
        switch(messages[i].type) {
        case 1: // Card
            // create whole carousel ( get all following cards and join elements together)
            while (messages[i].type == 1) {
                let buttons = [];
                if (messages[i].buttons) {
                    buttons = messages[i].buttons.map((button) => {
                        return createWebUrlButton(button.text, "https://aldabot.es"); //button.postback);
                    });
                }
                elements.push(createElement(messages[i].title, messages[i].subtitle, buttons));
                i++;
            }
            promises.push( () => {return respondGenericTemplateMessage(psid, elements);} );
            break;
        case 3: // Image
            promises.push( () => {return respondImageMessage(psid, messages[i].imageUrl);} );
            break;
        default:
            if (messages[i].speech) {
                promises.push( () => {return respondTextMessage(psid, messages[i].speech);} );
            } else {
                console.error("dialogflow response type not known");
            }
        }
    }

    // !! all is parallel need to serialize!
    return Promise.each(promises, (promise) => {
        return promise();
    });
};
