import {
    translateToSp
} from './translate';
import {
    retrieveAccounts
} from './database.js';
import {
    respondTextMessage
} from './messenger.js';

export const respondIntent = (pool, psid, intent) => {
    console.log('respond');
    console.log(intent);
    console.log(psid);
    switch(intent) {
    case "alda.query.balance":
        return queryBalance(pool, psid).then((response) => {
            return respondTextMessage(psid, response);
        }).catch((error) => {
            throw error;
        });
        break;
    default:
        return respondTextMessage(psid, "No te entiendo");
    }
};

const queryBalance = (pool, psid) => {
    return retrieveAccounts(pool, psid).then((logins) => {
        let total = 0;
        var response = 'Hola, \n';
        for (var accounts of logins) {
            for (let account of accounts) {
                total += account.balance;
                let accountNature = translateToSp(account.nature);
                response += `${accountNature.slice(0,10)} (${account.name.slice(-4)}): ${account.balance} €\n`;
            }
        }
        response += `\r Total: ${total} € 📈`;
        return response;
    });
};


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
