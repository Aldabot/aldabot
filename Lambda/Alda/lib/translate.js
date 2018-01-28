const spDictionary = {
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
    'Shopping': 'Compras',
    'loan': 'Préstamo'
};

export const translateToSp = (word) => {
    if(spDictionary[word]) {
        return spDictionary[word];
    } else {
        return word;
    }
};
