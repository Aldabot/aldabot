import dotenv from 'dotenv';
import {
    respondTextMessage,
    respondImageMessage,
    respondGenericTemplateMessage,
    respondTextQuickReplies,
    createWebUrlButton,
    createPostbackButton,
    createTextQuickReply,
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
    for (let i = 0; i < messages.length; i++) {
        switch(messages[i].type) {
        case 1: // Card
            // create whole carousel ( get all following cards and join elements together)
            while (messages[i] && messages[i].type == 1) {
                let buttons = [];
                if (messages[i].buttons) {
                    buttons = messages[i].buttons.map((button) => {
                        // NEEDS TO BE FIXED: until now ONLY https://aldabot.es buttons are allowed
                        // if url => urlbutton else postbackbutton
                        if(button.postback == "https://aldabot.es") {
                            return createWebUrlButton(button.text, button.postback); //button.postback);
                        } else {
                            return createPostbackButton(button.text, button.postback);
                        }
                    });
                }
                elements.push(createElement(messages[i].title, messages[i].subtitle, buttons));
                i++;
            }
            promises.push( () => {return respondGenericTemplateMessage(psid, elements);} );
            break;
        case 2: // Quick Replies
            let quickReplies = [];
            for (let reply of messages[i].replies) {
                quickReplies.push(createTextQuickReply(reply, "QUICK_REPLY"));
            }
            promises.push( () => { return respondTextQuickReplies(psid, messages[i].title, quickReplies);} );
            break;
        case 3: // Image
            promises.push( () => {return respondImageMessage(psid, messages[i].imageUrl);} );
            break;
        default:
            if(messages[i] && messages[i].speech) {
                promises.push( () => {return respondTextMessage(psid, messages[i].speech);} );
            } else {
                console.error("Dialogflow Redirect messages TYPE not defined");
            }
        }
    }

    return Promise.each(promises, (promise) => {
        return promise();
    });
};

