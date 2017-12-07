import json
import logging
from messenger import Messenger
import dateutil.parser

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class Dialogflow:

    sender_id = ''
    query_text = ''
    intent_name = ''
    has_fullfilment = False

    __request = {}
    __response = {'statusCode': 200, 'body': {}}
    # following https://dialogflow.com/docs/reference/api-v2/rest/v2beta1/WebhookResponse
    __webhook_response = {
        'fulfillmentText': "No te entiendo?",
        'fulfillmentMessages': [{
            "platform": "facebook",
            "text": [{
                "text": "No te entiendo?"
            }]
        }],
        'source': "facebook"
    }

    def __init__(self, request):
        logger.info("Dialogflow: __init__")
        Dialogflow.__request = request

        self.__webhook_response = {
            'fulfillmentText': "No te entiendo?",
            'fulfillmentMessages': [{
                "platform": "facebook",
                "text": [{
                    "text": "No te entiendo?"
                }]
            }],
            'source': "facebook"
        }

        logger.info(request)
        logger.info(self.__request)

        # if messages don't come from Messenger there won't be a sender_id
        # ( for testing via Dialogflow, set my facebook_id as sender_id, otherwise Lambda will break )
        if 'sender' in request['originalDetectIntentRequest']['payload']:
            Dialogflow.sender_id = request['originalDetectIntentRequest']['payload']['sender']['id']
        else:
            Dialogflow.sender_id = '1705514732805822'

        Dialogflow.query_text = request['queryResult']['queryText']
        Dialogflow.intent_name = request['queryResult']['intent']['displayName']

    @classmethod
    def set_fulfillment_text(self, fulfillmentText):
        self.__webhook_response['fulfillmentText'] = fulfillmentText
        self.__webhook_response.pop('fulfillmentMessages', None)
        # self.__webhook_response['fulfillmentMessages'] = [{
        #     "platform": "facebook",
        #     "text": [{
        #         "text": fulfillmentText
        #     }]
        # }]
        # self.__webhook_response['source'] = "facebook"

    @classmethod
    def get_fulfillment_text(self):
        return self.__webhook_response['fulfillmentText']

    @classmethod
    def set_received_fulfillment(self):
        logger.info(self.__request)
        logger.info(self.__request['queryResult'])
        self.__webhook_response.pop('fulfillmentText', None)
        self.__webhook_response['fulfillmentText'] = self.__request['queryResult']['fulfillmentMessages'][0]['text']['text']

  #       self.__webhook_response['fulfillmentMessages'] = [
  #   {
  #     "platform": "FACEBOOK",
  #     "text": {
  #       "text": ["Title: this is a title"]
  #     }
  #   },
  #   {
  #     "platform": "FACEBOOK",
  #      "text": {
  #        "text": ["Title: this is a title"]
  #      }
  #   }
  # ]
        self.__webhook_response['source'] = "FACEBOOK"
        # for message in self.__webhook_response['fulfillmenMessages']:
        #     message['platform'] = "facebook"
        # self.__webhook_response['source'] = "facebook"

        # self.__webhook_response['fulfillmentMessages'] = self.__request['queryResult']['fulfillmentMessages']
        # for message in self.__webhook_response['fulfillmentMessages']:
        #     message['platform'] = "FACEBOOK"

    @classmethod
    def set_fullfillment_messages(self, messages):
        self.__webhook_response['fulfillmentMessages'] = messages

    @classmethod
    def get_response(self):
        self.__response['body'] = json.dumps(self.__webhook_response)
        logger.info("Response: %s" % (self.__response))
        return self.__response

    @classmethod
    def set_messenger_button(self, fulfillmentText, title, url):
        self.__webhook_response['fulfillmentText'] = fulfillmentText
        messenger_button_template = Messenger.get_button_template(fulfillmentText, title, url)
        self.__webhook_response['fulfillmentMessages'] = [{
            "payload": {
                "facebook": messenger_button_template
            }
        }]

    @classmethod
    def not_understood(self):
        self.set_fulfillmentText("No te entiendo?")

    @classmethod
    def get_date_parameter(self):
        """ Gets the date 'YYYY-mm-dd' from Dialogflow's transmitted date parameter

        Return:
            Date-parameter as datetime.date() (in the 'YYYY-mm-dd' format)
        """
        date_parameter = self.__request['queryResult']['parameters']['date']
        return dateutil.parser.parse(date_parameter).date()

    @classmethod
    def get_currency_amount(self):
        """ Gets the currency and the amount from Dialogflow's parameters

        Return:
            Tuple: (amount as Int, currency as String)
        """
        unit_currency = self.__request['queryResult']['parameters']['unit-currency']
        return (unit_currency['amount'], unit_currency['currency'])

    @classmethod
    def set_two_messenger_buttons(self, fulfillmentText, title_1, url_1, title_2, url_2):
        self.__webhook_response['fulfillmentText'] = fulfillmentText
        messenger_button_template = Messenger.get_two_button_templates(fulfillmentText, title_1, url_1, title_2, url_2)
        self.__webhook_response['fulfillmentMessages'] = [{
            "payload": {
                "facebook": messenger_button_template
            }
        }]

    @classmethod
    def has_fulfillment(self):
        if 'sender' in self.request['originalDetectIntentRequest']['payload']:
            return True
        else:
            return False

    @staticmethod
    def __text_message(text):
        return {'text': text}
