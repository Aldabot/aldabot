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
            "transport": {
                name: "Transport",
                emoji: "🚂",
                amount: 0
            },
            "bills": {
                name: "Bills",
                emoji: "💸",
                amount: 0
            },
            "education": {
                name: "Education",
                emoji: "💸",
                amount: 0
            },
            "entertainment": {
                name: "Entertainment",
                emoji: "🎡",
                amount: 0
            },
            "fitness": {
                name: "Fitness",
                emoji: "⚽",
                amount: 0
            },
            "shopping": {
                name: "Shopping",
                emoji: "🛍",
                amount: 0
            },
            "food": {
                name: "Food",
                emoji: "🍏",
                amount: 0
            },
            "health": {
                name: "Health",
                emoji: "🏥",
                amount: 0
            },
            "kids": {
                name: "Kids",
                emoji: "🍼",
                amount: 0
            },
            "pets": {
                name: "Pets",
                emoji: "🐶",
                amount: 0
            },
            "restaurants": {
                name: "Restaurants",
                emoji: "🥘",
                amount: 0
            },
            "travel": {
                name: "Travel",
                emoji: "✈️",
                amount: 0
            }
        };
        var response = "";
        for (let transaction of transactions) {
            switch(transaction.category) {
            case "car_rental":
            case "gas_and_fuel":
            case "parking":
            case "public_transportation":
            case "service_and_parts":
            case "taxi":
                expenses.travel.amount -= transaction.amount;
                break;
            case "bills":
                expenses.bills.amount -= transaction.amount;
                break;
            case "books_and_supplies":
                expenses.eduation.amount -= transaction.amount;
                break;
            case "amusement":
            case "games":
            case "movies_and_music":
            case "newspapers_and_magazines":
                expenses.entertainment.amount -= transaction.amount;
                break;
            case "clothing":
            case "electronics_and_software":
            case "sporting_goods":
            case "shopping":
                expenses.shopping.amount -= transaction.amount;
                break;
            case "cafes_and_restaurants":
            case "alcohol_and_bars" :
                expenses.restaurants.amount -= transaction.amount;
                break;
            case "groceris":
                expenses.food.amount -= transaction.amount;
                break;
            case "personal_car":
            case "sports":
                expenses.fitness.amount -= transactions.amount;
                break;
            case "doctor":
            case "pharmacy":
                expenses.health.amount -= transaction.amount;
                break;
            case "allowance":
            case "baby_supplies":
            case "child_support":
            case "kids_activities":
            case "toys":
            case "babysitter_and_daycare":
                expenses.kids.amount -= transaction.amount;
                break;
            case "pet_food_and_supplies":
            case "pet_grooming":
            case "veterinary":
                expenses.pets.amount -= transaction.amount;
                break;
            case "hotel":
            case "transportation":
            case "vacation":
                expenses.travel.amount -= transaction.amount;
            }
        }
        Object.keys(expenses).forEach((key) => {
            if(expenses[key].amount != 0) {
                response += expenses[key].amount.toFixed(0) + "€ " + translateToSp(expenses[key].name) + " " + expenses[key].emoji + "\n";
                total += expenses[key].amount;
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
