import axios from 'axios';

const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Client-id': 'QTPsSIxhOxBxIRf3IKzWew',
    'Service-secret': 'b6aeHuRHbvQouDqS_zB-R0cdXzKdvbi3kLnkMYE6EcU'
};

const instance = axios.create({
    baseURL: 'https://www.saltedge.com/api/v3',
    timeout: 1000,
    headers
});

export const createSaltedgeCustomer = (identifier) => {
    const params = {
        data: {
            identifier
        }
    };
    return instance.post('/customers', params).then((result) => {
        return result.data.data;
    }).catch((error) => {
        throw error.response.data;
    });
};
