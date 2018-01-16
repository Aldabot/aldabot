export default class Tranlsate {
    constructor() {
        this.language = 'sp';
        this.spDictionary = {
            'account': 'Cuenta',
            'bonus': 'Bonificación',
            'card': 'Tarjeta',
            'checking': 'Cuenta',
            'credit_card': 'Tarjeta',
            'debit_card': 'Tarjeta',
            'ewallet': 'Billetera',
            'insurance': 'Seguro',
            'investment': 'Inversión',
            'mortgage': 'Hipoteca',
            'savings': 'Ahorros',
            'loan': 'Préstamo'
        };

        this.getTranslation = this.getTranslation.bind(this);
    }

    getTranslation(word) {
        return this.spDictionary[word];
    }
}
