import pymysql.cursors
import logging
import json
import sys
import requests
from saltedge import SaltEdge
import datetime
import configparser
from dialogflow import Dialogflow

config = configparser.ConfigParser()
config.read('config.ini')

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class Person(Dialogflow):
    def __init__(self, connection, request):
        """
        :param facebook_id: string
        :init: Initializes Customer with customer_id, login_ids and account_ids
               - Customer 1:many Logins 1:many Accounts
        """
        self.connection = connection
        self.saltedge = SaltEdge(config['DEFAULT']['saltedgeClientId'], config['DEFAULT']['saltedgeServiceSecret'],
                                 'private.pem', 'public.pem')
        self.dialogflow = Dialogflow(request)
        self.customer = {}
        self.facebook_id = self.dialogflow.sender_id

        # if not registered create person
        # else get person_id and customer_id
        if not self.isRegistered():
            with self.connection.cursor() as cursor:
                query = """
                    INSERT INTO `person` (`facebook_id`)
                    VALUES (%s)
                """
                cursor.execute(query, (self.facebook_id))
                self.id = cursor.rowcount

                # save Facebook profil
                facebook_profil = self.queryFacebookProfil()
                query = """
                    INSERT INTO facebook_profil
                    SET `id` = %s, `first_name` = %s, `last_name` = %s, `gender` = %s
                """
                cursor.execute(query, (self.facebook_id, facebook_profil['first_name'], facebook_profil['last_name'],
                                       facebook_profil['gender']))
            self.connection.commit()
            logger.info("RDS: saved new person with id: %s" % (self.id))
        else:
            with self.connection.cursor() as cursor:
                query = """
                    SELECT `id`
                    FROM person
                    WHERE `facebook_id` = %s
                """
                cursor.execute(query, (self.facebook_id))
                self.id = cursor.fetchone()['id']

            # get first_name
            self.first_name = self.getFacebookProfil()['first_name']

        with self.connection.cursor() as cursor:
            # get customer if exists
            # else: initialize SaltEdge
            query = """
                SELECT c.`id`
                FROM saltedge_customer c, person p
                WHERE c.`id` = p.`customer_id` AND p.`id` = %s
            """
            cursor.execute(query, (self.id))
            if cursor.rowcount != 0:
                self.customer['id'] = cursor.fetchone()['id']

                # get logins of customer
                query = """
                    SELECT `id` AS login_id
                    FROM saltedge_login
                    WHERE `customer_id` = %s
                """
                cursor.execute(query, (self.customer['id']))
                self.customer['logins'] = []
                for login in cursor.fetchall():
                    loginDict = {}
                    loginDict['id'] = login['login_id']

                    # get accounts of logins
                    query = """
                        SELECT `id` AS account_id, balance, nature, name
                        FROM saltedge_account
                        WHERE `login_id` = %s
                    """
                    cursor.execute(query, (login['login_id']))
                    accountList = []
                    for account in cursor.fetchall():
                        accountDict = {}
                        accountDict['id'] = account['account_id']
                        accountDict['balance'] = account['balance']
                        accountDict['nature'] = account['nature']
                        accountDict['name'] = account['name']
                        accountList.append(accountDict)
                    loginDict['accounts'] = accountList

                    self.customer['logins'].append(loginDict)
                    logger.info(json.dumps(self.customer, sort_keys=True, indent=4))
            else:
                self.initialize()

    def initialize(self):
        """
        :return: Dialogflow speech with button to create another saltedge login
                 if user is not registered
        """
        logger.info("Person.initialize()")
        url = 'https://www.saltedge.com/api/v3/customers/'
        payload = json.dumps({"data": {"identifier": self.id}})
        response = self.saltedge.post(url, payload)
        # if is not saltedge_customer (response.status_code != 409)
        if response.status_code == 200:
            self.customer['id'] = response.json()['data']['id']
            with self.connection.cursor() as cursor:
                query = """
                    UPDATE person
                    SET `customer_id` = %s
                    WHERE `id` = %s
                """
                cursor.execute(query, (self.customer['id'], self.id))
                query = """
                    INSERT INTO saltedge_customer
                    SET `id` = %s
                """
                cursor.execute(query, (self.customer['id']))
            self.connection.commit()
            logger.info("RDS: saved SaltEdge Customer Id")
        else:
            SaltEdge.log(response)
            return self.addBank()

        saltedge_connect_url = self.getSaltEdgeLoginUrl()
        speech = ("Lo primero que tendrás que hacer es iniciar sesión en tu cuenta bancaria para poderacceder a tu"
                  " información financiera.")
        self.set_two_messenger_buttons(speech, "Iniciar sesión", saltedge_connect_url, "Demo", "http://aldabot.es")

    def refresh(self):
        logger.info('Person.refresh()')
        # update FACEBOOK profil
        facebook_profil = self.queryFacebookProfil()
        if facebook_profil:
            with self.connection.cursor() as cursor:
                query = """
                    UPDATE facebook_profil
                    SET `first_name` = %s, `last_name` = %s, `gender` = %s
                    WHERE `id` = %s
                """
                cursor.execute(query, (facebook_profil['first_name'], facebook_profil['last_name'],
                                       facebook_profil['gender'], self.facebook_id))
            self.connection.commit()
            logger.info("RDS: updated Facebook profile")

        # if customer exists and customer.updated not refreshed since more than one hour update SaltEdge data
        if self.isSaltedgeCustomer():
            with self.connection.cursor() as cursor:
                query = """
                    SELECT c.`id` AS customer_id, c.`updated_at`, l.`id` AS login_id
                    FROM saltedge_customer c
                    LEFT JOIN saltedge_login l ON c.`id` = l.`customer_id`
                    LEFT JOIN person p ON c.`id` = p.`customer_id`
                    WHERE p.`id` = %s
                """
                cursor.execute(query, (self.id))
                if cursor.rowcount > 0:
                    fetched = cursor.fetchall()
                    if fetched[0]['updated_at'] < datetime.datetime.now() - datetime.timedelta(hours=1):
                        logger.info("is refreshing")
                        for login in fetched:
                            url = 'https://www.saltedge.com/api/v3/logins/'+str(login['login_id'])+'/refresh'
                            payload = json.dumps({"data": {"fetch_type": "recent"}})
                            response = self.saltedge.put(url, payload)
                            # logSaltedgeError(response.json())
                            logger.info("refreshed login ids")

    def addBank(self):
        logger.info("Adding Bank")
        saltedge_connect_url = self.getSaltEdgeLoginUrl()
        logger.info("got Login URL")
        text = "Tendrás que iniciar sesión en tu cuenta bancaria para poder acceder a tu información financiera."
        self.set_messenger_button(text, "Añadir Banco", saltedge_connect_url)

    def queryBalance(self):
        logger.info("Person.getBalance()")
        fulfillmentText = "Hola %s 😊, \n\r\n\r" % (self.first_name)
        totalBalance = 0
        for login in self.customer['logins']:
            for account in login['accounts']:
                fulfillmentText += "%.10s (%.4s): %.0f € \n" % (account['nature'], account['name'][-4:],
                                                                account['balance'])
                totalBalance += account['balance']

        fulfillmentText += "\n\rTotal: %.0f € 📈" % (totalBalance)
        self.set_fulfillment_text(fulfillmentText)

    def queryExpenses(self):
        with self.connection.cursor() as cursor:
            query = """
                SELECT
                    -SUM(CASE WHEN t.`category` = "car_rental" OR t.`category` = "gas_and_fuel"
                         OR t.`category` = "parking" OR t.`category` = "public_transportation"
                         OR t.`category` = "service_and_parts" OR t.`category` = "taxi"
                         THEN t.`amount` ELSE 0 END) AS transport,
                    -SUM(CASE WHEN t.`category` = "utilities" THEN t.`amount` ELSE 0 END) AS bills,
                    -SUM(CASE WHEN t.`category` = "books_and_supplies" THEN t.`amount` ELSE 0 END) AS education,
                    -SUM(CASE WHEN t.`category` = "amusement" OR t.`category` = "games"
                         OR t.`category` = "movies_and_music" OR t.`category` = "newspapers_and_magazines"
                         THEN t.`amount` ELSE 0 END) AS entertainment,
                    -SUM(CASE WHEN t.`category` = "clothing" OR t.`category` = "electronics_and_software"
                         OR t.`category` = "sporting_goods" THEN t.`amount` ELSE 0 END) AS shopping,
                    -SUM(CASE WHEN t.`category` = "cafes_and_restaurants"
                         OR t.`category` = "alcohol_and_bars" THEN t.`amount` ELSE 0 END) AS dining,
                    -SUM(CASE WHEN t.`category` = "groceries" THEN t.`amount` ELSE 0 END) AS food,
                    -SUM(CASE WHEN t.`category` = "sports" OR t.`category` = "wellness"
                         OR t.`category` = "personal_care" THEN t.`amount` ELSE 0 END) AS fitness,
                    -SUM(CASE WHEN t.`category` = "doctor"
                         OR t.`category` = "pharmacy" THEN t.`amount` ELSE 0 END) AS health,
                    -SUM(CASE WHEN t.`category` = "allowance" OR t.`category` = "baby_supplies"
                         OR t.`category` = "child_support" OR t.`category` = "kids_activities"
                         OR t.`category` = "toys" OR t.`category` = "babysitter_and_daycare"
                         THEN t.`amount` ELSE 0 END) AS kids,
                    -SUM(CASE WHEN t.`category` = "pet_food_and_supplies" OR t.`category` = "pet_grooming"
                         OR t.`category` = "veterinary" THEN t.`amount` ELSE 0 END) AS pets,
                    -SUM(CASE WHEN t.`category` = "hotel" OR t.`category` = "transportation"
                         OR t.`category` = "vacation" THEN t.`amount` ELSE 0 END) AS travel
                FROM saltedge_transaction t
                    INNER JOIN saltedge_account a ON t.`account_id` = a.`id`
                    INNER JOIN saltedge_login l ON a.`login_id` = l.`id`
                    INNER JOIN saltedge_customer c ON l.`customer_id` = c.`id`
                WHERE c.`id` = %s AND t.`made_on`> '2017-10-01'
            """
            # cursor.execute(query, ('1522858621#
            cursor.execute(query, (self.customer['id']))
            categories = cursor.fetchone()

            fulfillmentText = ""
            totalExpenses = 0

            category_es = {
                'transport': {'name': 'Transporte', 'emoji': '🚂'},
                'bills': {'name': 'Facturas', 'emoji': '💸'},
                'education': {'name': 'Educación', 'emoji': '📚'},
                'entertainment': {'name': 'Ocio', 'emoji': '🎡'},
                'shopping': {'name': 'Compras', 'emoji': '🛍'},
                'dining': {'name': 'Restaurantes', 'emoji': '🥘'},
                'food': {'name': 'Alimentacion', 'emoji': '🍏'},
                'fitness': {'name': 'Deportes', 'emoji': '⚽️'},
                'health': {'name': 'Salud', 'emoji': '🏥'},
                'kids': {'name': 'Niños', 'emoji': '🍼'},
                'pets': {'name': 'Mascotas', 'emoji': '🐶'},
                'travel': {'name': 'Viajes', 'emoji': '✈️'}
            }
            for (categoryName, expense) in categories.items():
                if (expense > 0):
                    category = category_es[categoryName]
                    fulfillmentText += "%.0f€ %s %s\r\n" % (expense, category['name'], category['emoji'])
                    totalExpenses += expense

            if (totalExpenses > 0):
                fulfillmentText += "\r\n%.0f€ Total" % (totalExpenses)
            else:
                fulfillmentText += "No has gastado nada!"
            self.set_fulfillment_text(fulfillmentText)

    def getSaltEdgeLoginUrl(self):
        """
        :return: SaltEdge connect url
        """
        url = 'https://www.saltedge.com/api/v3/tokens/create'
        payload = json.dumps({"data": {"customer_id": self.customer['id'], "fetch_type": "recent"}})
        response = self.saltedge.post(url, payload)
        saltedge_connect_url = response.json()['data']['connect_url']
        return saltedge_connect_url

    def getFacebookProfil(self):
        """
        gets facebook profil from OUR database
        :return: mysql facebook profil -> {'first_name', 'last_name', 'gender'}
        """
        with self.connection.cursor() as cursor:
            query = """
                SELECT `first_name`, `last_name`, `gender`
                FROM facebook_profil
                WHERE `id` = %s
            """
            cursor.execute(query, (self.facebook_id))
            return cursor.fetchone()

    def queryFacebookProfil(self):
        """
        queries Facebook profil from the GRAPH API
        :return: Facebook profil -> {'first_name', 'last_name', 'gender'}
        """
        r = requests.get('https://graph.facebook.com/v2.10/'
                         + self.facebook_id + '?access_token='+config['DEFAULT']['facebookPageAccessToken'], timeout=3)
        if r.status_code == 200:
            return r.json()
        else:
            logger.error(r.json())

    def isRegistered(self):
        with self.connection.cursor() as cursor:
            query = """
                SELECT `id` FROM person WHERE `facebook_id` = %s
            """
            cursor.execute(query, (self.facebook_id))

            logger.info("is registered row count %s" % (cursor.rowcount))
            if cursor.rowcount != 0:
                return True
            else:
                return False

    def isSaltedgeCustomer(self):
        with self.connection.cursor() as cursor:
            query = """
                SELECT `customer_id` FROM person
                WHERE `id` = %s
            """
            cursor.execute(query, (self.id))
            if cursor.rowcount != 0 and cursor.fetchone()['customer_id']:
                return True
            else:
                return False

    @staticmethod
    def getFacebookButton(speech, title, url):
        return {
            'speech': speech,
            "data": {
                "facebook": {
                  "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text": speech,
                        "buttons": [
                          {
                            "type": "web_url",
                            "url": url,
                            "title": title,
                            "webview_height_ratio": "tall"
                          }
                        ]
                    }
                  }
                }
            }
        }

    @staticmethod
    def getTwoFacebookButtons(speech, title_1, url_1, title_2, url_2):
        return {
            'speech': speech,
            "data": {
                "facebook": {
                  "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text": speech,
                        "buttons": [
                          {
                            "type": "web_url",
                            "url": url_1,
                            "title": title_1,
                            "webview_height_ratio": "tall"
                          },
                          {
                            "type": "web_url",
                            "url": url_2,
                            "title": title_2,
                            "webview_height_ratio": "tall"
                          }
                        ]
                    }
                  }
                }
            }
        }



# def queryBalance(customer, request):
#     with connection.cursor() as cursor:
#         speech = "Hola %s, \n\r\n\r" % (customer.customer['first_name'])
#
#         # get all accounts
#         query = """
#             SELECT `id`, `name`, `nature`, `balance`, `created_at`
#             FROM `account`
#             WHERE `login_id` = %s
#         """
#         cursor.execute(query, (customer.customer['logins'][0]['id']))
#         # cursor.execute(query, ('1522858621155118'))
#         accounts = cursor.fetchall()
#
#         # check if date parameter exists, if take saldo from transactions else take from balance
#         date = request['result']['parameters']['date']
#         totalBalance = 0
#         exist_account_with_info = False
#         if date:
#             date_datetime = datetime.datetime.strptime(date, '%Y-%m-%d').date()
#             speech += "📅 %s \n" % (date)
#             for account in accounts:
#                 # get oldest transaction
#                 query = """
#                     SELECT t.`made_on`, t.`account_balance_snapshot`
#                     FROM transaction t, account a
#                     WHERE a.`id` = %s
#                     ORDER BY t.`made_on` ASC
#                 """
#                 cursor.execute(query, (account['id']))
#                 fetched = cursor.fetchone()
#                 oldestTransaction = fetched['made_on']
#
#                 # when oldest transaction is <= the date given => output cached saldo
#                 if (oldestTransaction <= date_datetime):
#                     exist_account_with_info = True
#                     balanceForDate = fetched['account_balance_snapshot']
#                     totalBalance += balanceForDate
#                     speech += "%.10s: %.0f € \n" % (account['nature'], balanceForDate)
#         else:
#             # take balances from account
#             for account in accounts:
#                 exist_account_with_info = True
#                 totalBalance += account['balance']
#                 speech += "%.10s: %.0f € \n" % (account['nature'], account['balance'])
#
#         # if none of the accounts has information in the transaction for the date inform the user
#         if (exist_account_with_info):
#             speech += "\n\rTotal: %.0f €" % (totalBalance)
#         else:
#             speech += "\n\rPor este fecha no tenemos informacion 😭"
#
#
#     return {
#         'speech': speech
#     }
