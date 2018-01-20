import Person from './person';
import Promise from 'bluebird';

const getConnection = (pool) => {
    return pool.getConnectionAsync().disposer((connection) => {
        connection.release();
    });
};

const query = (pool, sql, values) => {
    return Promise.using(getConnection(pool), (connection) => {
        console.log(values);
        return connection.queryAsync(sql, values);
    });
};

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

export default class Database {
    constructor(pool) {
        this.pool = pool;

        this.query = this.query.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getPersonClass = this.getPersonClass.bind(this);
    }

    getConnectionAsync() {
        return this.pool.getConnectionAsync();
    }

    releaseConnectionAsync(connection) {
        connection.release();
    }

    query(sql) {
        return this.getConnectionAsync().then((connection, error) => {
            return connection.queryAsync(sql);
        });
    }

    getPerson(psid) {
        const sql = `SELECT customer_id FROM person WHERE psid = ${psid}`;
        return this.query(sql);
    }

    getLogins(customer_id) {
        const sql =  `SELECT id FROM saltedge_login WHERE customer_id = ${customer_id}`;
        return this.query(sql);
    }

    getAccounts(login_id) {
        const sql =  `SELECT id, name, balance, nature FROM saltedge_account WHERE login_id = ${login_id}`;
        return this.query(sql);
    }

    getAll(psid) {
        // Person -> Customer -> Logins -> Accounts
        return this.getPerson(psid).then((person) => {
            const customerId = person[0].customer_id;
            this.person = {
                'psid': this.psid,
                'customerId': customerId
            };
            return this.getLogins(customerId);
        }).then((logins) => {
            this.person['logins'] = [];
            var promises = [];
            for (var loginIndex in logins) {
                let loginId = logins[loginIndex].id;
                this.person['logins'].push({
                    'id': loginId
                });
                promises.push(this.getAccounts(loginId));
            }
            return Promise.all(promises);
        }).then((accounts) => {
            var promises = [];
            // returned accounts is an array of an array of accounts
            for (var loginIndex in accounts) {
                this.person['logins'][loginIndex]['accounts'] = [];
                for (var accountIndex in accounts[loginIndex]) {
                    this.person['logins'][loginIndex]['accounts'].push(
                        accounts[loginIndex][accountIndex]
                    );
                }
            }
            // console.log(JSON.stringify(this.person, null, 4));
        });
    }

    getPersonClass(psid) {
        return this.getAll(psid).then((results) => {
            return new Promise((resolve, reject) => {
                resolve(new Person(this.person));
            });
        });
    }

    saveSessionId(sessionId, psid) {
        const sql = `INSERT INTO person (psid, session_id) VALUES ('${psid}', '${sessionId}') ON DUPLICATE KEY UPDATE session_id = '${sessionId}'`;
        return this.query(sql);
    }
}
