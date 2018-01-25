import { create } from 'apisauce';

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
}
