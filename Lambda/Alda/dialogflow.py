import json
import logging
from messenger import Messenger

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class Dialogflow:

    __response = {'statusCode': 200, 'body': {}}
    __webhook_response = {'fulfillmentText': "No te entiendo?"}

    @classmethod
    def set_fulfillmentText(self, fulfillmentText):
        self.__webhook_response['fulfillmentText'] = fulfillmentText

    @classmethod
    def get_fulfillmentText(self):
        return self.__webhook_response['fulfillmentText']

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
