import logging
from enum import Enum

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class Language(Enum):
    SPANISH = 1


class Translate():

    _language = Language.SPANISH
    _sp_dictionary = {
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
    }

    def __init__(self, language):
        """
        :param language: Language(ENUM)
        :init: Initializes translation module
        """

    def getTranslation(self, word):
        """ Translated word into _language

        Args:
            word: String, the word to be translated

        Returns:
            The in Translate._language translated word

        To Improve:
            - error when word cannot be translated (is not contained in _language_dictionary)
        """

        if word in self._sp_dictionary:
            return self._sp_dictionary[word]
        else:
            return word
