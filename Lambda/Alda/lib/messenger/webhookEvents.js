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
    updatePerson
} from '../database.js';
import {
    sendWelcomeMessages
} from '../predefinedMessages.js';
import {
    createCustomer,
    createAndLinkSaltedgeCustomer,
} from '../saltedge.js';
import {
    sendFirstLoginMessages
} from '../predefinedMessages.js';

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
    return getIntent(psid, message).then((response) => {
        if (response.hasMessages) {
            let messages = response.fulfillment.messages;
            return dialogflowRedirectMessages(psid, messages);
        }
        let intent = response.metadata.intentName;
        return respondIntent(pool, psid, intent);
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
            return createPerson(pool, {psid}).then(() => {
                console.info("New person created");
                return sendWelcomeMessages(psid);
            });
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
        return createAndLinkSaltedgeCustomer(pool, psid);
    }
};
