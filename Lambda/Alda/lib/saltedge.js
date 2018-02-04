import { create } from 'apisauce';
import {
    retrievePerson,
    updatePerson
} from './database.js';

const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Client-id': 'QTPsSIxhOxBxIRf3IKzWew',
    'Service-secret': 'b6aeHuRHbvQouDqS_zB-R0cdXzKdvbi3kLnkMYE6EcU'
};

const api = create({
    baseURL: 'https://www.saltedge.com/api/v3',
    timeout: 1000,
    headers
});

export const createCustomer = (identifier) => {
    const params = {
        data: {
            identifier
        }
    };
    return api.post('/customers', params);
};

export const deleteCustomer = (customerId) => {
    return api.delete(`/customers/${customerId}`);
};

export const createAndLinkSaltedgeCustomer = (pool, psid) => {
    return createCustomer(psid).then((response) => {
        if(response.ok) {
            let customerId = response.data.data.id;
            let dbPerson = {
                psid,
                customer_id: customerId
            };
            return updatePerson(pool, dbPerson);
        } else {
            if(response.data.error_class) {
                if(response.data.error_class == "DuplicatedCustomer") {
                    // Customer already exists within SaltEdge
                    // => do nothing! should be linked in Mysql
                    return Promise.resolve(true);
                } else {
                    throw "Saltedge Create Customer failed?";
                }
            } else {
                throw "Saltedge Server Error";
            }
        }
    });
};
