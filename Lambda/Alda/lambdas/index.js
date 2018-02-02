require('dotenv').config(); // process.env.<WHATEVER>
import request from 'request';
import {
    respondOK,
    respondError
} from '../lib/lambda';
import {
    respondTextMessage,
    respondAttachmentMessage,
    getMessageText
} from '../lib/messenger.js';
import {
    sendWelcomeMessages
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
    retrieveAccounts,
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
                return respondTextMessage(state.messenger.psid, "Uups, algo ha ido mal.").then(() => {
                    respondOK(callback);
                });
            });
            break;
        case "QUICK_REPLY":
            respondToQuickReply(state.messenger.psid, pool, state.messenger.event).then(() => {
                respondOK(callback);
            }).catch((error) => {
                console.error(`MySQL: ${error.code}`);
                respondOK(callback);
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
    //             //     const intent = new Intent(intentName, person);
    //             //     const response = intent.getResponse();
    //             //     messenger.addTextMessage(response);
    //             //     return messenger.sendAsync(response);
    //             // }).then(() => {
    //             //     lambda.respond(200, null);
    //             // });
    //             lambda.respond(200, null);
    //         }
        break;
    default:
        console.error(`Unsuported httpMethod: ${httpMethod}`);
        respond(403, `Unsuported httpMethod: ${httpMethod}`, callback);
    }
};

function respond(responseCode, responseBody, callback) {
  callback(null, {
    statusCode: responseCode,
    headers: {
        "x-custom-header" : "my custom header value"
    },
    body: JSON.stringify(responseBody)
  })
}

function messengerGET(queryStringParameters, callback) {
  // curl -X GET "https://9f532725.ngrok.io/webhook?hub.verify_token=aldaHURN&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe"
  let VERIFY_TOKEN = "aldaHURN";

  let mode = queryStringParameters['hub.mode'];
  let token = queryStringParameters['hub.verify_token'];
  let challenge = queryStringParameters['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenged token from the request
      console.log('WEBHOOK_VERIFIED');
      callback(null, {
        statusCode: 200,
        headers: {
            "x-custom-header" : "my custom header value"
        },
        body: challenge
      })
    } else {
      // Respons with '403 Forbidden' if verify tokens do not match
      console.error('Facebook Webhook failed');
      respond(403, `Forbidden`, callback);
    }
  }
  respond(400, '', callback);
}

// Handles messages events
function handleMessage(sender_psid, received_message, callback) {

  let response;

  // Check if the message contains text
  if (received_message.text) {
    if (received_message.text != 'template') {
      // Create the payload
      response = {
        "text": `Hello`
      }
    } else {
      response = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": "Is this the right picture?",
              "subtitle": "Tap a button to answer.",
              "image_url": "https://www.google.es/url?sa=i&rct=j&q=&esrc=s&source=images&cd=&cad=rja&uact=8&ved=0ahUKEwi2zqGHucrYAhUJvxQKHW6TArUQjRwIBw&url=https%3A%2F%2Fwww.w3schools.com%2Fw3css%2Fw3css_images.asp&psig=AOvVaw1iJ2G4yinJP3IJFdq14PN5&ust=1515572334421701",
              "buttons": [
                {
                  "type": "postback",
                  "title": "Yes!",
                  "payload": "yes",
                },
                {
                  "type": "postback",
                  "title": "No!",
                  "payload": "no",
                }
              ],
            }]
          }
        }
      }
    }
  }

  callSendAPI(sender_psid, response, callback);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback, callback) {
  let response;

  let payload = received_postback.payload

  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text" : "Opps, try again!" }
  }

  callSendAPI(sender_psid, response, callback);
}
