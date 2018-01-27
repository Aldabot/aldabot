const proxyResponse = (statusCode, headers, body) => {
    return {
        statusCode,
        headers,
        body: JSON.stringify(body)
    };
};

export const respondOK = (callback) => {
    console.log(proxyResponse(200, {"x-custom-header": "my custom header valye"}, {ok: "ok"}));
    console.log('responded OK');
    callback(null, proxyResponse(200, {}, {}));
};

export const respondError = (callback) => {
    callback(null, proxyResponse(500, {"x-custom-header": "my custom header valye"}, {error: "true"}));
}


