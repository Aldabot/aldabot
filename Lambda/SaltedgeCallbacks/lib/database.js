import { sendTextMessage } from './messenger.js';
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
    const sql = `INSERT INTO persons SET ?`;
    return query(pool, sql, dbPerson);
};

export const retrievePerson = (pool, psid) => {
    const sql = `SELECT * FROM persons WHERE psid = ?`;
    return query(pool, sql, [psid]).then((result) => {
        return result[0];
    });
};

export const retrievePersonFromCustomerId = (pool, customerId) => {
    const sql = `SELECT * FROM persons WHERE customer_id = ?`;
    return query(pool, sql, [customerId]).then((result) => {
        return result[0];
    }).catch((error) => {
        throw error;
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

////////////////////////////////////////////////////////////
// Notifications
////////////////////////////////////////////////////////////

export function retrieveNotificationsFromPersonId(pool, personId) {
    const sql = 'SELECT * FROM notifications_sent WHERE person_id = ?';
    return query(pool, sql, [personId]);
}

export function saveSentNotification(pool, person_id, notification_id, json) {
    const sql = 'INSERT INTO notifications_sent SET ?';

    let dbNotificationSent = {
        person_id,
        notification_id,
        json: JSON.stringify(json)
    };
    return query(pool, sql, dbNotificationSent);
}

export function isCreatedLoginNotificationAlreadySent(pool, personId, loginId) {
    return retrieveNotificationsFromPersonId(pool, personId).then((sentNotifications) => {
        for (let notification of sentNotifications) {
            console.log(JSON.stringify(notification, null, 4));
            if (JSON.parse(notification.json).loginId == loginId) {
                return true;
            }
        }
        return false;
    });
}

export const sendCreatedLoginNotification = (pool, customerId, loginId) => {
    return retrievePersonFromCustomerId(pool, customerId).then((person) => {

        let promises = [];
        promises.push(person);
        promises.push(isCreatedLoginNotificationAlreadySent(pool, person.id, loginId));
        return Promise.all(promises);
    }).then(([person, isCreatedLoginNotificationAlreadySent]) => {
        let promises = [];
        if (!isCreatedLoginNotificationAlreadySent) {
            promises.push(promises.push(sendTextMessage(person.psid, "Hemos recibido nuevas transacciones de tus cuentas! Consultame sobre tu saldo y tus gastos.")));
            // notification with id = 1 is "created Login"
            promises.push(saveSentNotification(pool, person.id, 1, {loginId}));
            return Promise.all(promises);
        } else {
            return true;
        }
    });
};
