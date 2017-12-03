import json
import logging

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
