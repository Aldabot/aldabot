

export default class Database {
    constructor(pool) {
        this.pool = pool;

        this.query = this.query.bind(this);
    }

    query() {
        return new Promise((resolve, reject) => {
            this.pool.getConnectionAsync().then((connection, error)  => {
                console.log('got connection');
                connection.queryAsync('SELECT * FROM facebook_profil').then((results, error) => {
                    connection.release();
                    resolve(results);

                    if (error) reject(error);
                });
            });
        });
    }
}
