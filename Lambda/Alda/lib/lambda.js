const proxyResponse = (statusCode, headers, body) => {
    return {
        statusCode,
        headers,
        body: JSON.stringify(body)
    };
};

export const respondOK = (callback) => {
    console.log(proxyResponse(200, {}, {}));
    console.log('responded OK');
    callback(null, proxyResponse(200, {}, {}));
};

export const respondError = (callback) => {
    callback(null, proxyResponse(500, {}, {}));
}


