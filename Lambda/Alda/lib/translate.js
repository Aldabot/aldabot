const spDictionary = {
    'account': 'Cuenta',
    "Bills": "Facturas",
    'bonus': 'Bonificación',
    'card': 'Tarjeta',
    'checking': 'Cuenta',
    'credit_card': 'Tarjeta',
    'debit_card': 'Tarjeta',
    'Education': "Educación",
    'ewallet': 'Billetera',
    "Fitness": "Deportes",
    "Food": "Alimentación",
    'insurance': 'Seguro',
    'investment': 'Inversión',
    "Health": "Salud",
    "Kids": "Niños",
    'mortgage': 'Hipoteca',
    "Pets": "Mascotas",
    "Restaurants": "Restaurantes",
    'savings': 'Ahorros',
    'Shopping': 'Compras',
    "Travel": "Viajes",
    'loan': 'Préstamo'
};

export const translateToSp = (word) => {
    if(spDictionary[word]) {
        return spDictionary[word];
    } else {
        return word;
    }
};
