import pymysql.cursors
import json
import logging
import sys
from saltedge import SaltEdge
import configparser

config = configparser.ConfigParser()
config.read('config.ini')

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class Login:
    def __init__(self, connection, customer_id, login_id):
        self.saltedge = SaltEdge(config['DEFAULT']['saltedgeClientId'], config['DEFAULT']['saltedgeServiceSecret'],
                                 'private.pem', 'public.pem')
        self.customer_id = customer_id
        self.login_id = login_id
        self.connection = connection

    def queryAccounts(self):
        url = 'https://www.saltedge.com/api/v3/accounts?login_id='+str(self.login_id)
        response = self.saltedge.get(url)
        if response.status_code == 200:
            accounts = response.json()['data']
            mysqlAccountList = []
            for account in accounts:
                mysqlAccountList.append((account['id'], account['login_id'], account['name'], account['currency_code'],
                                         account['balance'], account['nature']))
            return mysqlAccountList
        else:
            logger.error("Login.queryAccounts: Login not found.")

    def queryTransactions(self, account_id):
        url = 'https://www.saltedge.com/api/v3/transactions?login_id='+str(self.login_id)
        response = self.saltedge.get(url)
        if response.status_code == 200:
            transactions = response.json()['data']
            mysqlTransactionList = []
            for transaction in transactions:
                mysqlTransactionList.append((transaction['id'], transaction['account_id'], transaction['category'],
                                             transaction['amount'], transaction['description'],
                                             transaction['extra']['account_balance_snapshot'], transaction['made_on']))
            return mysqlTransactionList
        else:
            logger.error("Login.queryTransactions: something.")

    def saveCustomer(self):
        with self.connection.cursor() as cursor:
            query = """
                INSERT INTO saltedge_customer (`id`)
                VALUES (%s)
            """
            cursor.execute(query, (self.customer_id))
        self.connection.commit()
        logger.info("RDS: saved Login")

    def saveLogin(self):
        with self.connection.cursor() as cursor:
            query = """
                INSERT INTO saltedge_login (`id`, `customer_id`)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE
                id = VALUES(id), customer_id = VALUES(customer_id)
            """
            cursor.execute(query, (self.login_id, self.customer_id))
        self.connection.commit()
        logger.info("RDS: saved Login")

    def saveAccounts(self, mysqlAccountList):
        with self.connection.cursor() as cursor:
            query = """
                INSERT INTO saltedge_account (`id`, `login_id`, `name`, `currency_code`, `balance`, `nature`)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                id = VALUES(id), login_id = VALUES(login_id), name = VALUES(name),
                currency_code = VALUES(currency_code), balance = VALUES(balance), nature = VALUES(nature)
            """
            cursor.executemany(query, mysqlAccountList)
        self.connection.commit()
        logger.info("RDS: saved Account/s")

    def saveTransactions(self, mysqlTransactionList):
        with self.connection.cursor() as cursor:
            query = """
                INSERT INTO saltedge_transaction (`id`, `account_id`, `category`, `amount`, `description`,
                                           `account_balance_snapshot`, `made_on`)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                id = VALUES(id), account_id = VALUES(account_id), category = VALUES(category), amount = VALUES(amount),
                description = VALUES(description), account_balance_snapshot = VALUES(account_balance_snapshot),
                made_on = VALUES(made_on)
            """
            cursor.executemany(query, mysqlTransactionList)
        self.connection.commit()
        logger.info("RDS: saved Transactions")
