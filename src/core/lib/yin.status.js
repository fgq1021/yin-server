export const status = {
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',
    103: 'Early Hints',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status',
    208: 'Already Reported',
    226: 'IM Used',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: "I'm a Teapot",
    421: 'Misdirected Request',
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    425: 'Too Early',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    509: 'Bandwidth Limit Exceeded',
    510: 'Not Extended',
    511: 'Network Authentication Required'
}

export const yinStatus = {
    CONTINUE(message = "CONTINUE", query) {
        return {status: 'CONTINUE', code: 100, message: message, query: query}
    },
    SWITCHING_PROTOCOLS(message = "SWITCHING_PROTOCOLS", query) {
        return {status: 'SWITCHING_PROTOCOLS', code: 101, message: message, query: query}
    },
    PROCESSING(message = "PROCESSING", query) {
        return {status: 'PROCESSING', code: 102, message: message, query: query}
    },
    EARLYHINTS(message = "EARLYHINTS", query) {
        return {status: 'EARLYHINTS', code: 103, message: message, query: query}
    },
    OK(message = "OK", query) {
        return {status: 'OK', code: 200, message: message, query: query}
    },
    CREATED(message = "CREATED", query) {
        return {status: 'CREATED', code: 201, message: message, query: query}
    },
    ACCEPTED(message = "ACCEPTED", query) {
        return {status: 'ACCEPTED', code: 202, message: message, query: query}
    },
    NON_AUTHORITATIVE_INFORMATION(message = "NON_AUTHORITATIVE_INFORMATION", query) {
        return {status: 'NON_AUTHORITATIVE_INFORMATION', code: 203, message: message, query: query}
    },
    NO_CONTENT(message = "NO_CONTENT", query) {
        return {status: 'NO_CONTENT', code: 204, message: message, query: query}
    },
    RESET_CONTENT(message = "RESET_CONTENT", query) {
        return {status: 'RESET_CONTENT', code: 205, message: message, query: query}
    },
    PARTIAL_CONTENT(message = "PARTIAL_CONTENT", query) {
        return {status: 'PARTIAL_CONTENT', code: 206, message: message, query: query}
    },
    AMBIGUOUS(message = "AMBIGUOUS", query) {
        return {status: 'AMBIGUOUS', code: 300, message: message, query: query}
    },
    MOVED_PERMANENTLY(message = "MOVED_PERMANENTLY", query) {
        return {status: 'MOVED_PERMANENTLY', code: 301, message: message, query: query}
    },
    FOUND(message = "FOUND", query) {
        return {status: 'FOUND', code: 302, message: message, query: query}
    },
    SEE_OTHER(message = "SEE_OTHER", query) {
        return {status: 'SEE_OTHER', code: 303, message: message, query: query}
    },
    NOT_MODIFIED(message = "NOT_MODIFIED", query) {
        return {status: 'NOT_MODIFIED', code: 304, message: message, query: query}
    },
    TEMPORARY_REDIRECT(message = "TEMPORARY_REDIRECT", query) {
        return {status: 'TEMPORARY_REDIRECT', code: 307, message: message, query: query}
    },
    PERMANENT_REDIRECT(message = "PERMANENT_REDIRECT", query) {
        return {status: 'PERMANENT_REDIRECT', code: 308, message: message, query: query}
    },


    /**
     * 400以上自动返回reject
     * @param message
     * @param query
     * @constructor
     */
    BAD_REQUEST(message = "BAD_REQUEST", query) {
        return Promise.reject({status: 'BAD_REQUEST', code: 400, message: message, query: query})
    },
    UNAUTHORIZED(message = "UNAUTHORIZED", query) {
        return Promise.reject({status: 'UNAUTHORIZED', code: 401, message: message, query: query})
    },
    PAYMENT_REQUIRED(message = "PAYMENT_REQUIRED", query) {
        return Promise.reject({status: 'PAYMENT_REQUIRED', code: 402, message: message, query: query})
    },
    FORBIDDEN(message = "FORBIDDEN", query) {
        return Promise.reject({status: 'FORBIDDEN', code: 403, message: message, query: query})
    },
    NOT_FOUND(message = "NOT_FOUND", query) {
        return Promise.reject({status: 'NOT_FOUND', code: 404, message: message, query: query})
    },
    METHOD_NOT_ALLOWED(message = "METHOD_NOT_ALLOWED", query) {
        return Promise.reject({status: 'METHOD_NOT_ALLOWED', code: 405, message: message, query: query})
    },
    NOT_ACCEPTABLE(message = "NOT_ACCEPTABLE", query) {
        return Promise.reject({status: 'NOT_ACCEPTABLE', code: 406, message: message, query: query})
    },
    PROXY_AUTHENTICATION_REQUIRED(message = "PROXY_AUTHENTICATION_REQUIRED", query) {
        return Promise.reject({status: 'PROXY_AUTHENTICATION_REQUIRED', code: 407, message: message, query: query})
    },
    REQUEST_TIMEOUT(message = "REQUEST_TIMEOUT", query) {
        return Promise.reject({status: 'REQUEST_TIMEOUT', code: 408, message: message, query: query})
    },
    CONFLICT(message = "CONFLICT", query) {
        return Promise.reject({status: 'CONFLICT', code: 409, message: message, query: query})
    },
    GONE(message = "GONE", query) {
        return Promise.reject({status: 'GONE', code: 410, message: message, query: query})
    },
    LENGTH_REQUIRED(message = "LENGTH_REQUIRED", query) {
        return Promise.reject({status: 'LENGTH_REQUIRED', code: 411, message: message, query: query})
    },
    PRECONDITION_FAILED(message = "PRECONDITION_FAILED", query) {
        return Promise.reject({status: 'PRECONDITION_FAILED', code: 412, message: message, query: query})
    },
    PAYLOAD_TOO_LARGE(message = "PAYLOAD_TOO_LARGE", query) {
        return Promise.reject({status: 'PAYLOAD_TOO_LARGE', code: 413, message: message, query: query})
    },
    URI_TOO_LONG(message = "URI_TOO_LONG", query) {
        return Promise.reject({status: 'URI_TOO_LONG', code: 414, message: message, query: query})
    },
    UNSUPPORTED_MEDIA_TYPE(message = "UNSUPPORTED_MEDIA_TYPE", query) {
        return Promise.reject({status: 'UNSUPPORTED_MEDIA_TYPE', code: 415, message: message, query: query})
    },
    REQUESTED_RANGE_NOT_SATISFIABLE(message = "REQUESTED_RANGE_NOT_SATISFIABLE", query) {
        return Promise.reject({status: 'REQUESTED_RANGE_NOT_SATISFIABLE', code: 416, message: message, query: query})
    },
    EXPECTATION_FAILED(message = "EXPECTATION_FAILED", query) {
        return Promise.reject({status: 'EXPECTATION_FAILED', code: 417, message: message, query: query})
    },
    I_AM_A_TEAPOT(message = "I_AM_A_TEAPOT", query) {
        return Promise.reject({status: 'I_AM_A_TEAPOT', code: 418, message: message, query: query})
    },
    MISDIRECTED(message = "MISDIRECTED", query) {
        return Promise.reject({status: 'MISDIRECTED', code: 421, message: message, query: query})
    },
    UNPROCESSABLE_ENTITY(message = "UNPROCESSABLE_ENTITY", query) {
        return Promise.reject({status: 'UNPROCESSABLE_ENTITY', code: 422, message: message, query: query})
    },
    FAILED_DEPENDENCY(message = "FAILED_DEPENDENCY", query) {
        return Promise.reject({status: 'FAILED_DEPENDENCY', code: 424, message: message, query: query})
    },
    PRECONDITION_REQUIRED(message = "PRECONDITION_REQUIRED", query) {
        return Promise.reject({status: 'PRECONDITION_REQUIRED', code: 428, message: message, query: query})
    },
    TOO_MANY_REQUESTS(message = "TOO_MANY_REQUESTS", query) {
        return Promise.reject({status: 'TOO_MANY_REQUESTS', code: 429, message: message, query: query})
    },
    INTERNAL_SERVER_ERROR(message = "INTERNAL_SERVER_ERROR", query) {
        return Promise.reject({status: 'INTERNAL_SERVER_ERROR', code: 500, message: message, query: query})
    },
    NOT_IMPLEMENTED(message = "NOT_IMPLEMENTED", query) {
        return Promise.reject({status: 'NOT_IMPLEMENTED', code: 501, message: message, query: query})
    },
    BAD_GATEWAY(message = "BAD_GATEWAY", query) {
        return Promise.reject({status: 'BAD_GATEWAY', code: 502, message: message, query: query})
    },
    SERVICE_UNAVAILABLE(message = "SERVICE_UNAVAILABLE", query) {
        return Promise.reject({status: 'SERVICE_UNAVAILABLE', code: 503, message: message, query: query})
    },
    GATEWAY_TIMEOUT(message = "GATEWAY_TIMEOUT", query) {
        return Promise.reject({status: 'GATEWAY_TIMEOUT', code: 504, message: message, query: query})
    },
    HTTP_VERSION_NOT_SUPPORTED(message = "HTTP_VERSION_NOT_SUPPORTED", query) {
        return Promise.reject({status: 'HTTP_VERSION_NOT_SUPPORTED', code: 505, message: message, query: query})
    }
}

