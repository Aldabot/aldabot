export default class Person {
  constructor(connection, facebook_id) {
    this.connection = connection;
    this.facebook_id = facebook_id;

    this._initialize = this._initialize.bind(this);
  }

  async _initialize() {
    const [rows, fields] = await this.connection.execute('SELECT * FROM `person`');
  }

  static async create(connection, facebook_id) {
    const o = new Person(connection, facebook_id);
    await o._initialize();
    return o;
  }

}
