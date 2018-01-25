require('dotenv').config(); // process.env.<WHATEVER>
import mysql from 'mysql';
import Promise from 'bluebird';
import * as saltedge from '../lib/saltedge.js';
import {
    replaceCustomer,
    replaceLogin,
    replaceAccount,
    replaceTransaction
} from '../lib/database.js';
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

console.log("STARTING");

var pool = mysql.createPool({
    connectionLimit: 20,
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

export function handler(event: any, context: any, callback): void {
    context.callbackWaitsForEmptyEventLoop = false;
    console.info("START Lambda handler");
    //console.info(event);


    // console.info(context);
    let httpMethod = event.httpMethod;
    let queryStringParameters = event.queryStringParameters;
    let resource = event.resource;
    let body = JSON.parse(event.body);

    switch(resource) {
    case '/saltedge/success':
        const data = body.data;
        const customerId = data.customer_id;
        const loginId = data.login_id;


        const dbCustomer = {
            id: customerId
        };
        replaceCustomer(pool, dbCustomer).then(() => {
            let promises = [];
            promises.push(saltedge.getAccounts(loginId));
            promises.push(saltedge.getTransactions(loginId));
            return Promise.all(promises);
        }).then(([accounts, transactions]) => {
                var promises = [];

                const dbLogin = {
                    id: accounts[0].login_id,
                    customer_id: customerId
                };
                promises.push(replaceLogin(pool, dbLogin));

                promises.push(accounts);
                promises.push(transactions);
                return Promise.all(promises);
        }).then(([loginResult, accounts, transactions]) => {
            let promises = [];
            for (let account of accounts) {
                delete(account.extra);
                delete(account.created_at);
                delete(account.updated_at);

                promises.push(replaceAccount(pool, account));
            }
            promises.push(transactions);
            return Promise.all(promises);
        }).then((result) => {
            let transactions = result.pop();
            let promises = [];
            for (let transaction of transactions) {
                delete(transaction.extra);
                promises.push(replaceTransaction(pool, transaction));
            }
            return Promise.all(promises);
        }).then(() => {
            console.info("Updated Login, Accounts and Transactions!");
            respond(callback, 200, null);
        }).catch((error) => {
            logError('Updating Login, Accounts and Transactions', error);
            respond(callback, 200, null);
        });
        break;
    default:
        console.log("Resource not found");
        respond(callback, 200, null);
    }

};

function respond(callback, responseCode, responseBody) {
  callback(null, {
    statusCode: responseCode,
    headers: {
        "x-custom-header" : "my custom header value"
    },
    body: JSON.stringify(responseBody)
  })
}

