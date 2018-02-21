import {
    respondIntent
} from '../intents.js';
import {
    getIntent,
    dialogflowRedirectMessages
} from '../dialogflow.js';
import {
    respondTextMessage,
    getMessageText
} from '../messenger.js';
import {
    createPerson,
    updatePerson,
    isPersonExisting
} from '../database.js';
import {
    sendWelcomeMessages
} from '../predefinedMessages.js';
import {
    createCustomer,
    createAndLinkSaltedgeCustomer,
    isLoginExistent
} from '../saltedge.js';
import {
    sendFirstLoginMessages,
    sendYouHaveToLoginMessages
} from '../predefinedMessages.js';

const newPerson = (pool, psid) => {
    return createAndLinkSaltedgeCustomer(pool, psid).then((response) => {
        return sendWelcomeMessages(psid);
    }).catch((error) => {
        throw error;
    });
};


// Returns 'MESSAGE', 'QUICK_REPLY', 'OPTIN' or 'POSTBACK' else 'UNKOWN'
export const eventType = (event) => {
    if(event.message) {
        if(event.message.quick_reply) {
            return "QUICK_REPLY";
        }
        return "MESSAGE";
    } else if(event.postback) {
        return "POSTBACK";
    } else if(event.optin) {
        return "OPTIN";
    }

    return 'UNKOWN';
};

export const respondToMessage = (psid, message, pool, event) => {
    return isPersonExisting(pool, psid).then((isPersonExisting) => {
        if(isPersonExisting) {
            return isLoginExistent(pool, psid).then((isLoginExistent) => {
                if (isLoginExistent) {
                    return getIntent(psid, message).then((response) => {
                        if (response.hasMessages) {
                            let messages = response.fulfillment.messages;
                            return dialogflowRedirectMessages(psid, messages);
                        }
                        let intent = response.metadata.intentName;
                        return respondIntent(pool, psid, intent);
                    });
                } else {
                    return sendYouHaveToLoginMessages(psid);
                }
            });
        } else {
            return newPerson(pool, psid);
        }
    });
};

export const respondToPostback = (pool, event) => {
    const psid = event.sender.id;
    const title = event.postback.title;
    const payload = event.postback.payload;

    if (payload != "FACEBOOK_WELCOME" && payload != "QUERY_BALANCE" && payload != "QUERY_EXPENSES") {
        // handle as message with text=payload
        return respondToMessage(psid, payload, pool, event);
    } else {
        switch(payload) {
        case "FACEBOOK_WELCOME":
            return newPerson(pool, psid);
            break;
        case "QUERY_BALANCE":
            return respondIntent(pool, psid, "alda.query.balance");
            break;
        case "QUERY_EXPENSES":
            return respondIntent(pool, psid, "alda.query.expenses");
            break;
        default:
            return respondTextMessage(psid, 'Que decias?');
        }
    }
};

export const respondToQuickReply = (psid, pool, event) => {
    const payload = event.message.quick_reply.payload;
    const text = event.message.text;

    if (payload != "START_LOGIN") {
        return respondToMessage(psid, text, pool, event);
    } else {
        return createAndLinkSaltedgeCustomer(pool, psid).then(() => {
            return sendFirstLoginMessages(state.messenger.psid);
        }).catch((error) => {
            throw error;
        });
    }
};
