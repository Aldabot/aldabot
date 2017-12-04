import json
import logging
from messenger import Messenger

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class Dialogflow:

    sender_id = ''
    query_text = ''
    intent_name = ''
    has_fullfilment = False

    __request = ''
    __response = {'statusCode': 200, 'body': {}}
    # following https://dialogflow.com/docs/reference/api-v2/rest/v2beta1/WebhookResponse
    __webhook_response = {
        'fulfillmentText': "No te entiendo?",
        'fulfillmentMessages': [{
            'text': ['No te entiendo?']
        }]
    }

    def __init__(self, request):
        self.__request = request

        # if messages don't come from Messenger there won't be a sender_id
        # ( for testing via Dialogflow, set my facebook_id as sender_id, otherwise Lambda will break )
        if 'sender' in request['originalDetectIntentRequest']['payload']:
            self.sender_id = request['originalDetectIntentRequest']['payload']['sender']['id']
        else:
            self.sender_id = '1705514732805822'

        self.query_text = request['queryResult']['queryText']
        self.intent_name = request['queryResult']['intent']['displayName']

    @classmethod
    def set_fulfillment_text(self, fulfillmentText):
        self.__webhook_response['fulfillmentText'] = fulfillmentText

    @classmethod
    def get_fulfillment_text(self):
        return self.__webhook_response['fulfillmentText']

    @classmethod
    def set_received_fulfillment(self):
        self.__webhook_response['fulfillmentMessages'] = self.request['queryResult']['fulfillmentMessages']

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
