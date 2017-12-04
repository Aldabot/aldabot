class DialogflowSimulator:
    __webhook_request = {
        "session": string,
        "responseId": string,
        "queryResult": {
            object(QueryResult)
        },
        "originalDetectIntentRequest": {
            object(OriginalDetectIntentRequest)
        },
    }
