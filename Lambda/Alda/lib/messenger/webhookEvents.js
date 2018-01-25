// Returns 'MESSAGE', 'QUICK_REPLY', 'OPTIN' or 'POSTBACK' else 'UNKOWN'
export const eventType = (event) => {
    console.log(JSON.stringify(event, null, 4));
    if(event.message) {
        if(event.message.quick_reply) {
            return "QUICK_REPLY";
        }
        return "MESSAGE";
    } else if(event.postback) {
        return "POSTBACK";
    } else if(event.optin) {
        console.log('opt');
        return "OPTIN";
    }

    return 'UNKOWN';
};
