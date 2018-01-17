import dotenv from 'dotenv'; // process.env.<WHATEVER>
import mysql from 'mysql';
import Promise from 'bluebird';
import axios from 'axios';
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

dotenv.config();
console.log("STARTING SALTEDGE_CREATE_CUSTOMER");

console.log(process.env);
var pool = mysql.createPool({
    connectionLimit: 20,
    host     : process.env.RDS_HOST,
    user     : process.env.RDS_USER,
    password : process.env.RDS_PASSWORD,
    database : process.env.RDS_DB
});

export function handler(event: any, context: any, callback: any): void {
    context.callbackWaitsForEmptyEventLoop = false;
  // console.info(event);
  // console.info(context);
    let httpMethod = event.httpMethod;
    let queryStringParameters = event.queryStringParameters;
    let body = JSON.parse(event.body);

    // some setup
    const lambdaResponse = {
        statusCode: 200,
        headers: null,
        body: null
    };
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Client-id': 'QTPsSIxhOxBxIRf3IKzWew',
        'Service-secret': 'b6aeHuRHbvQouDqS_zB-R0cdXzKdvbi3kLnkMYE6EcU'
    };
    var instance = axios.create({
        baseURL: 'https://www.saltedge.com/api/v3/',
        timeout: 10000,
        headers
    });

    const {sessionId, username, password } = body;

    pool.getConnectionAsync().then((connection) => {
        console.log("connected!");
        const sql = `SELECT customer_id FROM person WHERE session_id = '${sessionId}'`;
        return connection.queryAsync(sql);
    }).then((person) => {
        const customerId = person[0].customer_id;
        console.log(`customerId: ${customerId}`);
        const params = {
	          "data": {
		            "customer_id": customerId,
		            "country_code": "ES",
		            "provider_code": "sabadell_es",
		            "credentials": {
			              "login": username,
			              "password": password 
		            }
	          }
        };

       return instance.post('/logins', params);
    }).then((response) => {
        const loginId = response.data.data.id;
        console.log(`loginId: ${loginId}`);
        callback(null, lambdaResponse);
    }).catch((error) => {
        console.log(error);
        lambdaResponse.statusCode = 400;
        callback(null, lambdaResponse);
    });
}
