const proxyResponse = (statusCode, headers, body) => {
    return {
        statusCode,
        headers,
        body: JSON.stringify(body)
    };
};

export const respondOK = (callback) => {
    callback(null, proxyResponse(200, {}, {}));
};

export const respondError = (callback) => {
    callback(null, proxyResponse(500, {}, {}));
};

export const respondForbidden = (callback) => {
    callback(null, proxyResponse(400, {}, {}));
};
