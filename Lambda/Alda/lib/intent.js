import Translate from './translate';

export default class Intent {
    constructor(intent, person) {
        this.intent = intent;
        this.person = person;
        this.translate = new Translate();

        switch(intent) {
        case "smalltalk.greetings.hello":
            this.response = this.smalltalkGreetingsHello();
            break;
        case "alda.query.balance":
            this.response = this.queryBalance();
            break;
        }

        this.smalltalkGreetingsHello = this.smalltalkGreetingsHello.bind(this);
        this.queryBalance = this.queryBalance.bind(this);
    }

    smalltalkGreetingsHello() {
        return "Hola";
    }

    queryBalance() {
        const accounts = this.person.getAccounts();
        let total = 0;
        var response = 'Hola, \n';
        accounts.forEach((account) => {
            total += account.balance;
            let accountNature = this.translate.getTranslation(account.nature);
            response += `${accountNature.slice(0,10)} (${account.name.slice(-4)}): ${account.balance} €\n`;
        });
        response += `\r Total: ${total} € 📈`;
        return response;
    }

    getResponse() {
        return this.response; 
    }
}
