export default class Person {
    constructor(person) {
        this.psid = person.psid;

        this.logins = person.logins;

        this.getAccounts = this.getAccounts.bind(this);
    }

    getAccounts() {
        let accountsArray = [];
        for (var loginIndex in this.logins) {
            var accounts = this.logins[loginIndex]['accounts'];
            for(var accountIndex in accounts) {
                var account = accounts[accountIndex];
                accountsArray.push(account);
            }
        };
        return accountsArray;
    }
}
