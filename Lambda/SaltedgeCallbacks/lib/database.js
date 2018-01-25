import Promise from 'bluebird';

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


////////////////////////////////////////////////////////////
// SALTEDGE
////////////////////////////////////////////////////////////

export const replaceCustomer = (pool, dbCustomer) => {
    const sql = `REPLACE INTO saltedge_customers SET ?`;
    return query(pool, sql, dbCustomer);
}

export const replaceLogin = (pool, dbLogin) => {
    const sql = `REPLACE INTO saltedge_logins SET ?`;
    return query(pool, sql, dbLogin);
};

export const replaceAccount = (pool, dbAccount) => {
    const sql = `REPLACE INTO saltedge_accounts SET ?`;
    return query(pool, sql, dbAccount);
};

export const replaceTransaction = (pool, dbTransaction) => {
    const sql = `REPLACE INTO saltedge_transactions SET ?`;
    return query(pool, sql, dbTransaction);
};


////////////////////////////////////////////////////////////
// PERSON
////////////////////////////////////////////////////////////

export const createPerson = (pool, dbPerson) => {
    const sql = `INSERT INTO person SET ?`;
    return query(pool, sql, dbPerson);
};

export const retrievePerson = (pool, psid) => {
    const sql = `SELECT * FROM person WHERE psid = ?`;
    return query(pool, sql, [psid]).then((result) => {
        return result[0];
    });
};

export const updatePerson = (pool, dbPerson) => {
    if (!dbPerson.psid) { throw new Error("UpdatePerson needs a PSID"); }

    return retrievePerson(pool, dbPerson.psid).then((retrievedPerson) => {
        const mergedPerson = { ...retrievedPerson, ...dbPerson }; // overwrite all given person values
        const values = [mergedPerson, mergedPerson.psid];
        const sql = 'UPDATE person SET ? WHERE psid = ?';
        return query(pool, sql, values);
    });
};
