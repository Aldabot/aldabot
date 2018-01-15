export default class Intent {
    constructor(intent, person) {
        this.intent = intent;
        this.person = person;

        switch(intent) {
        case "alda.query.balance":
            this.response = this.queryBalance();
        }
    }

    queryBalance() {
        const accounts = person.getAccounts();
        var response = 'Hola, ';
        for (accountIndex in accounts) {
            response += accounts[accountIndex].balacne;
        }
        return response;
    }

    getResponse() {
        return this.response; 
    }
}
