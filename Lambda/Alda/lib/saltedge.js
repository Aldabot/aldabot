import { create } from 'apisauce';
import {
    retrievePerson,
    updatePerson,
    createPerson
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


export const createSaltedgeCustomer = (identifier) => {
    const params = {
        data:
        {
            identifier
        }
    };
    return api.post('/customers', params);
};
export const deleteCustomer = (customerId) => {
    return api.delete(`/customers/${customerId}`);
};

export const isLoginExistent = (pool, psid) => {
    return retrievePerson(pool, psid).then((person) => {
        return api.get(`/logins?customer_id=${person.customer_id}`);
    }).then((response) => {
        if(response.ok) {
            return (response.data.data.length > 0) ? true : false;
        } else {
            throw "Saltedge isLoginExistent error";
        }
    }).catch((error) => {
        throw error;
    });
};



export const createAndLinkSaltedgeCustomer = (pool, psid) => {
    return createSaltedgeCustomer(psid).then((response) => {
        if(response.ok) {
            let customerId = response.data.data.id;
            let dbPerson = {
                psid,
                customer_id: customerId
            };
            return createPerson(pool, dbPerson);
        } else {
            // if saltedge_error anything different then duplicated throw
            if(response.data.error_class) {
                if(response.data.error_class != "DuplicatedCustomer") {
                    throw response.data.error_class;
                } else {
                    return true;
                }
                throw response.data.error_class;
            } else {
                throw "Saltedge Server Error";
            }
        }
    });
};
