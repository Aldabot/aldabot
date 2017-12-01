import pymysql.cursors
import logging
import json
from saltedge import SaltEdge
from login import Login
import sys
import configparser

config = configparser.ConfigParser()
config.read('config.ini')

# Facebook Page Token
# EAAYxS7zz3koBAOpFk1YePLYkPc81cMDMAwt8lKQnMCqH3TXZAMtuFL7VrY9Nfx6QKqMHbzsqaqu129D0cFj7irZCT40UZC61jrR3afRVgQkgnQmPZAbFpti48YXZCit8SqQOnZC7iGjDukZACZAXYRog4A8crUZA3zfteJMFi4GqD2zRz6S5R1P2Q

logger = logging.getLogger()
logger.setLevel(logging.INFO)

logger.info('Starting')

try:
    # Connect to the database
    connection = pymysql.connect(
        host=config['DEFAULT']['mysqlHost'],
        user=config['DEFAULT']['mysqlUser'],
        password=config['DEFAULT']['mysqlPassword'],
        db=config['DEFAULT']['mysqlDB'],
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
except connection.Error:
    logger.error('ERROR: Unexpected error:'
                 'Could not connect to MySql instance.')
    sys.exit()

logger.info("SUCCESS: Connection to RDS mysql instance succeeded")


def handler(event, context):
    print(event)
    request = json.loads(event['body'])
    logger.info(request)
    customer_id = request['data']['customer_id']
    login_id = request['data']['login_id']

    login = Login(connection, customer_id, login_id)
    logger.info(login.queryAccounts())

    mysqlAccountList = login.queryAccounts()
    mysqlTransactionList = []
    for mysqlAccount in mysqlAccountList:
        account_id = mysqlAccount[0]
        mysqlTransactionList.extend(login.queryTransactions(account_id))

    login.saveLogin()
    login.saveAccounts(mysqlAccountList)
    login.saveTransactions(mysqlTransactionList)







    # app = SaltEdge('QTPsSIxhOxBxIRf3IKzWew', 'b6aeHuRHbvQouDqS_zB-R0cdXzKdvbi3kLnkMYE6EcU', 'private.pem', 'public.pem')
    #
    # # query ACCOUNTS
    # url = 'https://www.saltedge.com/api/v3/accounts?customer_id='+str(customer_id)
    # response = app.get(url)
    # data = response.json()
    #
    # mysqlAccountList = []
    # for account in data['data']:
    #     mysqlAccountList.append((account['id'], account['login_id'], account['name'], account['currency_code'],
    #                              account['balance'], account['nature']))
    #
    # # query TRANSACTIONS
    # url = 'https://www.saltedge.com/api/v3/transactions?login_id='+str(login_id)
    # response = app.get(url)
    # data = response.json()
    # mysqlTransactionList = []
    # for transaction in data['data']:
    #     mysqlTransactionList.append((transaction['id'], transaction['account_id'], transaction['category'],
    #                                  transaction['amount'], transaction['description'],
    #                                  transaction['extra']['account_balance_snapshot'], transaction['made_on']))
    #
    # with connection.cursor() as cursor:
    #     query = """
    #         INSERT INTO `login` (`id`, `customer_id`)
    #         VALUES (%s, %s)
    #         ON DUPLICATE KEY UPDATE
    #         id = VALUES(id), customer_id = VALUES(customer_id)
    #     """
    #     cursor.execute(query, (login_id, customer_id))
    #     connection.commit()
    #     logger.info("RDS: saved Login")
    #
    #     query = """
    #         INSERT INTO `account` (`id`, `login_id`, `name`, `currency_code`, `balance`, `nature`)
    #         VALUES (%s, %s, %s, %s, %s, %s)
    #         ON DUPLICATE KEY UPDATE
    #         id = VALUES(id), login_id = VALUES(login_id), name = VALUES(name), currency_code = VALUES(currency_code),
    #         balance = VALUES(balance), nature = VALUES(nature)
    #     """
    #     cursor.executemany(query, mysqlAccountList)
    #     connection.commit()
    #     logger.info("RDS: saved Account/s")
    #
    #     query = """
    #         INSERT INTO `transaction` (`id`, `account_id`, `category`, `amount`, `description`,
    #                                    `account_balance_snapshot`, `made_on`)
    #         VALUES (%s, %s, %s, %s, %s, %s, %s)
    #         ON DUPLICATE KEY UPDATE
    #         id = VALUES(id), account_id = VALUES(account_id), category = VALUES(category), amount = VALUES(amount),
    #         description = VALUES(description), account_balance_snapshot = VALUES(account_balance_snapshot),
    #         made_on = VALUES(made_on)
    #     """
    #     cursor.executemany(query, mysqlTransactionList)
    #     connection.commit()
    #     logger.info("RDS: saved Transactions")
