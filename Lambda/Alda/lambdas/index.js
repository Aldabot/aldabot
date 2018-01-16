require('dotenv').config(); // process.env.<WHATEVER>
import request from 'request';
import Dialogflow from '../lib/dialogflow';
import Lambda from '../lib/lambda';
import Messenger from '../lib/messenger.js';
import Person from '../lib/person';
import Intent from '../lib/intent';
import Database from '../lib/database.js';
import mysql from 'mysql';
import Promise from 'bluebird';
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

console.log("STARTING");

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const DIALOGFLOW_CLIENT_ACCESS_TOKEN = process.env.DIALOGFLOW_CLIENT_ACCESS_TOKEN;

var pool = mysql.createPool({
    connectionLimit: 20,
    host     : process.env.RDS_HOST,
    user     : process.env.RDS_USER,
    password : process.env.RDS_PASSWORD,
    database : process.env.RDS_DB,
});

type HelloOptions = {
  name: string
};

export function handler(event: HelloOptions, context: any, callback): void {
    context.callbackWaitsForEmptyEventLoop = false;
    console.info("START Lambda handler");
  // console.info(event);
  // console.info(context);
    let httpMethod = event.httpMethod;
    let queryStringParameters = event.queryStringParameters;
    let body = JSON.parse(event.body);

    // test multiple messages
    const messenger = new Messenger(PAGE_ACCESS_TOKEN, body);
    // let testMessages = ['Nachricht 1', 'Nachricht 2'];
    // messenger.sendMultipleTextMessagesAsync(testMessages).then(() => {
    //     console.log('messages sent');
    // });

    // messenger.addTextMessage('ok');
    // messenger.addTextMessage('ok2');
    // messenger.addTextMessage('ok3');

    // messenger.addQuickReply('title', [messenger.quickReply("Start", "nothing")]);

    // messenger.addButtonTemplate("Button", [messenger.urlButton("https://aldaweb.es", "Aldaweb"), messenger.urlButton("https://aldaweb.es", "Aldaweb")]);

    messenger.addTextMessage('Hola, soy Alda. Estoy aquí para simplificar la administración de tu dinero.');
    messenger.addTextMessage('Puedes pensar en mí como tu asistente personal.');
    messenger.addQuickReply('Lo ayudaré a hacer un seguimiento de lo que está gastando, cómo está gastando y cómo puede hacerlo mejor.', [messenger.quickReply("Empecemos", "start")]);

    messenger.addTextMessage('¡Guay! Para comenzar su viaje hacia una mejor administración del dinero, necesito vincularme con su banca en línea.');
    messenger.addButtonTemplate("Sus detalles están protegidos por seguridad de nivel bancario. Están completamente protegidos y son 100% seguros.", [messenger.urlButton("https://aldabot.es", "Claro 🔒")]);

    messenger.sendAsync().then(() => {
        console.log('message sent');
    });


    switch(httpMethod) {
    case "GET":
        messengerGET(queryStringParameters, callback);
        break;
        // respond(200, `httpMethod: ${httpMethod}`, callback);
    case "POST":
        // const messenger = new Messenger(PAGE_ACCESS_TOKEN, body);
        // const psid = messenger.getSenderPSID();
        // const dialogflow = new Dialogflow(DIALOGFLOW_CLIENT_ACCESS_TOKEN, psid);
        // const lambda = new Lambda(callback);

        // let message = messenger.getMessageText();
        // const database = new Database(pool);
        // var promises = []
        // promises.push(dialogflow.getIntent(message));
        // promises.push(database.getPersonClass(psid));
        // Promise.all(promises).then(([intentName, person]) => {
        //     const intent = new Intent(intentName, person);
        //     const response = intent.getResponse();
        //     console.log(response);
        //     return messenger.sendTextMessageAsync(response);
        // }).then(() => {
        //     lambda.respond(200, null);
        // });
        break;
    default:
        console.error(`Unsuported httpMethod: ${httpMethod}`);
      respond(403, `Unsuported httpMethod: ${httpMethod}`, callback);
    }
}

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
