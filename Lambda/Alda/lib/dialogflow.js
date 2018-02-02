import dotenv from 'dotenv';
import {
    respondTextMessage,
    respondImageMessage,
    respondGenericTemplateMessage,
    createWebUrlButton,
    createPostbackButton,
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
    for (let i = 0; i < messages.length; i++) {
        switch(messages[i].type) {
        case 1: // Card
            console.log(JSON.stringify(messages[i], null, 4));
            // create whole carousel ( get all following cards and join elements together)
            while (messages[i] && messages[i].type == 1) {
                let buttons = [];
                if (messages[i].buttons) {
                    buttons = messages[i].buttons.map((button) => {
                        // if url => urlbutton else postbackbutton
                        if(isURL(button.postback)) {
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
        case 3: // Image
            promises.push( () => {return respondImageMessage(psid, messages[i].imageUrl);} );
            break;
        default:
            if(messages[i] && messages[i].speech) {
                promises.push( () => {
                    return respondTextMessage(psid, messages[i].speech);
                } );
            } else {
                console.error("Dialogflow Redirect messages TYPE not defined");
            }
        }
    }

    return Promise.each(promises, (promise) => {
        return promise();
    });
};

function isURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                             '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
                             '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                             '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                             '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                             '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return pattern.test(str);
}
