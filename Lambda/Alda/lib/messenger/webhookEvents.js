import {
    respondIntent
} from '../intents.js';
import {
    getIntent
} from '../dialogflow.js';
import {
    respondTextMessage,
    getMessageText
} from '../messenger.js';
import {
    createPerson
} from '../database.js';
import {
    sendWelcomeMessages
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
        console.log('opt');
        return "OPTIN";
    }

    return 'UNKOWN';
};

export const respondToPostback = (pool, event, callback) => {
    const psid = event.sender.id;
    const payload = event.postback.payload;

    switch(payload) {
    case "FACEBOOK_WELCOME":
        return createPerson(pool, {psid}).then(() => {
            console.info("New person created");
            return sendWelcomeMessages(psid);
        }).catch((error) => {
            if(error.code == "ER_DUP_ENTRY") {
                console.error("MySQL: duplicated entry!");

            } else {
                console.error(`Error: while creating new Person: ${error.code}`);
            }
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
