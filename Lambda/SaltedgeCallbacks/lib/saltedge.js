import dotenv from 'dotenv'; // process.env.<WHATEVER>
import axios from 'axios';
dotenv.config();

console.log(`id: ${process.env.SALTEDGE_CLIENT_ID}`);

const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Client-id': process.env.SALTEDGE_CLIENT_ID,
    'Service-secret': process.env.SALTEDGE_SERVICE_SECRET
};

const instance = axios.create({
    baseURL: 'https://www.saltedge.com/api/v3',
    timeout: 1000,
    headers
});

export const getAccounts = (loginId) => {
    return instance.get(`/accounts?login_id=${loginId}`).then((result) => {
        return result.data.data;
    }).catch((error) => {
        throw error.response.data;
    });
};

export const getTransactions = (loginId) => {
    return instance.get(`/transactions?login_id=${loginId}`).then((result) => {
        return result.data.data;
    }).catch((error) => {
        throw error.response.data;
    });
}
