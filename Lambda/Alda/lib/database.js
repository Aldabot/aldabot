import Person from './person';
import Promise from 'bluebird';
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

const getConnection = (pool) => {
    return pool.getConnectionAsync().disposer((connection) => {
        connection.release();
    });
};

const query = (pool, sql, values) => {
    return Promise.using(getConnection(pool), (connection) => {
        return connection.queryAsync(sql, values);
    });
};


////////////////////////////////////////////////////////////////
// PERSON
////////////////////////////////////////////////////////////////

export const createPerson = (pool, dbPerson) => {
    const sql = `INSERT IGNORE INTO persons SET ?`;
    return query(pool, sql, dbPerson);
};
export const retrievePerson = (pool, psid) => {
    const sql = `SELECT * FROM persons WHERE psid = ?`;
    return query(pool, sql, [psid]).then((result) => {
        return result[0];
    });
};
export const updatePerson = (pool, dbPerson) => {
    if (!dbPerson.psid) { throw new Error("UpdatePerson needs a PSID"); }

    return retrievePerson(pool, dbPerson.psid).then((retrievedPerson) => {
        const mergedPerson = { ...retrievedPerson, ...dbPerson }; // overwrite all given person values
        const values = [mergedPerson, mergedPerson.psid];
        const sql = "UPDATE persons SET ? WHERE psid = ?";
        return query(pool, sql, values);
    });
};


////////////////////////////////////////////////////////////////
// SALTEDGE
////////////////////////////////////////////////////////////////

export const createSaltedgeCustomer = (pool, saltedgeCustomer) => {
    const sql = "INSERT INTO saltedge_customers SET ?";
    return query(pool, sql, saltedgeCustomer);
};
export const deleteSaltedgeCustomer = (pool, customerId) => {
    const sql = "DELETE FROM saltedge_customers WHERE id = ?";
    return query(pool, sql, [customerId]);
};

// Logins
export const retrieveLoginsFromCustomerId = (pool, customerId) => {
    const sql = "SELECT * FROM saltedge_logins WHERE customer_id = ?";
    return query(pool, sql, [customerId]);
};

// Accounts
export const retrieveAccountsFromLoginId = (pool, loginId) => {
    const sql = "SELECT * FROM saltedge_accounts WHERE login_id = ?";
    return query(pool, sql, [loginId]);
};
// returns an array of logins containing an array of accounts ([[accounts]])
export const retrieveAccounts = (pool, psid) => {
    return retrievePerson(pool, psid).then((person) => {
        return retrieveLoginsFromCustomerId(pool, person.customer_id);
    }).then((logins) => {
        let promises = [];
        for (let login of logins) {
            promises.push(retrieveAccountsFromLoginId(pool, login.id));
        }
        return Promise.all(promises).then((loginAccounts) => {
            return [].concat(...loginAccounts);
        }).catch((error) => {
            throw error;
        });
    }).catch((error) => {
        throw error;
    });
};

// Transactions
export const retrieveTransactionFromAccountId = (pool, accountId) => {
    const sql = "SELECT * FROM saltedge_transactions WHERE account_id = ?";
    return query(pool, sql, [accountId]);
};
export const retrieveTransactions = (pool, psid) => {
    return retrieveAccounts(pool, psid).then((accounts) => {
        let promises = [];
        for (let account of accounts) {
            promises.push(retrieveTransactionFromAccountId(pool, account.id));
        }
        return Promise.all(promises).then((accountTransactions) => {
            return [].concat(...accountTransactions);
        }).catch((error) => {
            throw error;
        });
    }).catch((error) => {
        throw error;
    });
};
