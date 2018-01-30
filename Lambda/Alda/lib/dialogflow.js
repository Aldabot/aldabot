import dotenv from 'dotenv';
var apiai = require('apiai');
dotenv.config();

const app = apiai(process.env.DIALOGFLOW_CLIENT_ACCESS_TOKEN);

export const getIntent = (psid, message) => {
    return new Promise((resolve, reject) => {
        var request = app.textRequest(message, {
            sessionId: psid
        });

        request.on('response', function(response) {
            resolve(response.result.metadata.intentName);
        });

        request.on('error', function(error) {
            reject(error);
        });

        request.end();
    });
};
