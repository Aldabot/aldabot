import {
    translateToSp
} from './translate';
import {
    retrieveAccounts,
    retrieveTransactions
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
    case "alda.query.expenses":
        return queryExpenses(pool, psid).then((response) => {
            return respondTextMessage(psid, response);
        });
    default:
        return respondTextMessage(psid, "No te entiendo");
    }
};

const queryBalance = (pool, psid) => {
    return retrieveAccounts(pool, psid).then((accounts) => {
        let total = 0;
        var response = 'Hola, \n';
        for (let account of accounts) {
            total += account.balance;
            let accountNature = translateToSp(account.nature);
            response += `${accountNature.slice(0,10)} (${account.name.slice(-4)}): ${account.balance} €\n`;
        }
        response += `\r Total: ${total} € 📈`;
        return response;
    });
};

const queryExpenses = (pool, psid) => {
    return retrieveTransactions(pool, psid).then((transactions) => {
        let total = 0;
        let expenses = {
            "shopping": {
                name: "Shopping",
                emoji: "🛍",
                amount: 0
            },
            "restaurants": {
                name: "Restaurants",
                emoji: "🥘",
                amount: 0
            }
        };
        var response = "";
        for (let transaction of transactions) {
            switch(transaction.category) {
                case "shopping":
                expenses.shopping.amount -= transaction.amount;
                break;
            case "cafes_and_restaurants":
            case "alcohol_and_bars" :
                expenses.restaurants.amount -= transaction.amount;
                break;
            }
        }
        Object.entries(expenses).forEach(([key, category]) => {
            if(category.amount != 0) {
                response += category.amount.toFixed(0) + "€ " + translateToSp(category.name) + " " + category.emoji + "\n";
                total += category.amount;
            }
        });
        if(total != 0) {
            response += "Total: " + total.toFixed(0) + "€";
        }
        return response;
    });
};

const expensesByCategory = (transaction) => {
    switch(transaction.category) {
    case "shopping":
        return "shopping";
    default:
        return "";
    }
}


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
