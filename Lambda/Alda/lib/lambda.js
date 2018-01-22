const proxyResponse = (statusCode, headers, body) => {
    return {
        statusCode,
        headers,
        body
    };
};
export const respondOK = (callback) => {
    callback(null, proxyResponse(200, {}, {}));
};
