require('dotenv').config(); // process.env.<WHATEVER>
import request from 'request';
import {
    respondOK,
    respondError
} from '../lib/lambda';
import {
    messengerGET,
    respondTextMessage,
    respondAttachmentMessage,
    getMessageText
} from '../lib/messenger.js';
import {
    sendWelcomeMessages,
    sendFirstLoginMessages,
    sendSomethingWrongMessage
} from '../lib/predefinedMessages.js';
import {
    eventType,
    respondToMessage,
    respondToPostback,
    respondToQuickReply
} from '../lib/messenger/webhookEvents.js';
import {
    createPerson,
    retrievePerson,
    updatePerson,
    retrieveAccounts
} from '../lib/database.js';
import mysql from 'mysql';
import Promise from 'bluebird';
import {
    deleteCustomer
} from '../lib/saltedge.js';
import {
    respondIntent
} from '../lib/intents.js';

console.log("STARTING");


var pool = mysql.createPool({
    connectionLimit: 10,
    host     : process.env.RDS_HOST,
    user     : process.env.RDS_USER,
    password : process.env.RDS_PASSWORD,
    database : process.env.RDS_DB
});

function logError(intention, error) {
    console.error(`Intention: ${intention}`);

    let error_matched = false;
    // only logs error code from RDS or Saltedge
    if (error.code) { error_matched = true; console.error(`Error: RDS: ${error.code}`); }; // RDS
    if (error.error_class) { error_matched = true; console.error(`Error: Saltedge: ${error.error_class}`); }; // Saltedge

    if(!error_matched) {
        console.error(error);
    }
};

export function handler(event, context: any, callback): void {
    context.callbackWaitsForEmptyEventLoop = false;
    console.info("\n NEW: Lambda handler");
    // console.info(event);
    // console.info(context);

    let httpMethod = event.httpMethod;
    let queryStringParameters = event.queryStringParameters;
    let body = JSON.parse(event.body);

    switch(httpMethod) {
    case "GET":
        messengerGET(queryStringParameters, callback);
        break;
        // respond(200, `httpMethod: ${httpMethod}`, callback);
    case "POST":
        // centralized state
        let state = {
            messenger: {
                psid: body.entry[0].messaging[0].sender.id,
                event: body.entry[0].messaging[0]
            }
        };

        switch(eventType(state.messenger.event)) {
        case "MESSAGE":
            respondToMessage(state.messenger.psid, getMessageText(state.messenger.event), pool, state.messenger.event).then(() => {
                respondOK(callback);
            }).catch((error) => {
                console.log(JSON.stringify(error, null, 4));
                return respondTextMessage(state.messenger.psid, "Uups, algo ha ido mal.").then(() => {
                    respondOK(callback);
                });
            });
            break;
        case "QUICK_REPLY":
            respondToQuickReply(state.messenger.psid, pool, state.messenger.event).then(() => {
                return sendFirstLoginMessages(state.messenger.psid);
            }).then(() => {
                respondOK(callback);
            }).catch((error) => {
                console.log(JSON.stringify(error, null, 4));
                sendSomethingWrongMessage(state.messenger.psid).then(() => {
                    respondOK(callback);
                });
            });
            break;
        case "POSTBACK":
            respondToPostback(pool, state.messenger.event).then(() => {
                respondOK(callback);
            }).catch((error) => {
                respondTextMessage(state.messenger.psid, 'Ups algo ha ido mal.');
                respondOK(callback);
            });
            break;
        case "OPTIN":
            const sessionId = state.messenger.event.optin.ref;
            const dbPerson = {
                psid: state.messenger.psid,
                session_id: sessionId
            };
            updatePerson(pool, dbPerson).then(() => {
                console.log("Fullfilled OPTIN Login");
                respondOK(callback);
            }).catch((error) => {
                log.error("User Login, trying to update session_id from person", error);
                respondError(callback);
            });
            break;
        default:
            console.error('Error: Facebook webhook event not defined!');
            respondError(callback);
        }
        break;
    default:
        console.error(`Unsuported httpMethod: ${httpMethod}`);
        respond(403, `Unsuported httpMethod: ${httpMethod}`, callback);
    }
};


