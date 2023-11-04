const Codes = {
    100: "CONTINUE",
    101: "SWITCHING_PROTOCOLS",
    102: "PROCESSING",
    103: "EARLY_HINTS",
    200: "OK",
    201: "CREATED",
    202: "ACCEPTED",
    203: "NON_AUTHORITATIVE_INFORMATION",
    204: "NO_CONTENT",
    205: "RESET_CONTENT",
    206: "PARTIAL_CONTENT",
    207: "MULTI_STATUS",
    208: "ALREADY_REPORTED",
    226: "IM_USED",
    300: "MULTIPLE_CHOICES",
    301: "MOVED_PERMANENTLY",
    302: "FOUND",
    303: "SEE_OTHER",
    304: "NOT_MODIFIED",
    305: "USE_PROXY",
    307: "TEMPORARY_REDIRECT",
    308: "PERMANENT_REDIRECT",
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    402: "PAYMENT_REQUIRED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    406: "NOT_ACCEPTABLE",
    407: "PROXY_AUTHENTICATION_REQUIRED",
    408: "REQUEST_TIMEOUT",
    409: "CONFLICT",
    410: "GONE",
    411: "LENGTH_REQUIRED",
    412: "PRECONDITION_FAILED",
    413: "PAYLOAD_TOO_LARGE",
    414: "URI_TOO_LONG",
    415: "UNSUPPORTED_MEDIA_TYPE",
    416: "RANGE_NOT_SATISFIABLE",
    417: "EXPECTATION_FAILED",
    418: "I_AM_A_TEAPOT",
    421: "MISDIRECTED_REQUEST",
    422: "UNPROCESSABLE_ENTITY",
    423: "LOCKED",
    424: "FAILED_DEPENDENCY",
    425: "TOO_EARLY",
    426: "UPGRADE_REQUIRED",
    428: "PRECONDITION_REQUIRED",
    429: "TOO_MANY_REQUESTS",
    431: "REQUEST_HEADER_FIELDS_TOO_LARGE",
    451: "UNAVAILABLE_FOR_LEGAL_REASONS",
    500: "INTERNAL_SERVER_ERROR",
    501: "NOT_IMPLEMENTED",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
    504: "GATEWAY_TIMEOUT",
    505: "HTTP_VERSION_NOT_SUPPORTED",
    506: "VARIANT_ALSO_NEGOTIATES",
    507: "INSUFFICIENT_STORAGE",
    508: "LOOP_DETECTED",
    509: "BANDWIDTH_LIMIT_EXCEEDED",
    510: "NOT_EXTENDED",
    511: "NETWORK_AUTHENTICATION_REQUIRED"
}
const Status = {
    CONTINUE: 100,
    SWITCHING_PROTOCOLS: 101,
    PROCESSING: 102,
    EARLY_HINTS: 103,
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NON_AUTHORITATIVE_INFORMATION: 203,
    NO_CONTENT: 204,
    RESET_CONTENT: 205,
    PARTIAL_CONTENT: 206,
    MULTI_STATUS: 207,
    ALREADY_REPORTED: 208,
    IM_USED: 226,
    MULTIPLE_CHOICES: 300,
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    SEE_OTHER: 303,
    NOT_MODIFIED: 304,
    USE_PROXY: 305,
    TEMPORARY_REDIRECT: 307,
    PERMANENT_REDIRECT: 308,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    NOT_ACCEPTABLE: 406,
    PROXY_AUTHENTICATION_REQUIRED: 407,
    REQUEST_TIMEOUT: 408,
    CONFLICT: 409,
    GONE: 410,
    LENGTH_REQUIRED: 411,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE: 413,
    URI_TOO_LONG: 414,
    UNSUPPORTED_MEDIA_TYPE: 415,
    RANGE_NOT_SATISFIABLE: 416,
    EXPECTATION_FAILED: 417,
    I_AM_A_TEAPOT: 418,
    MISDIRECTED_REQUEST: 421,
    UNPROCESSABLE_ENTITY: 422,
    LOCKED: 423,
    FAILED_DEPENDENCY: 424,
    TOO_EARLY: 425,
    UPGRADE_REQUIRED: 426,
    PRECONDITION_REQUIRED: 428,
    TOO_MANY_REQUESTS: 429,
    REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
    UNAVAILABLE_FOR_LEGAL_REASONS: 451,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
    HTTP_VERSION_NOT_SUPPORTED: 505,
    VARIANT_ALSO_NEGOTIATES: 506,
    INSUFFICIENT_STORAGE: 507,
    LOOP_DETECTED: 508,
    BANDWIDTH_LIMIT_EXCEEDED: 509,
    NOT_EXTENDED: 510,
    NETWORK_AUTHENTICATION_REQUIRED: 511
}

export class yinError extends Error {
    status
    code = 500
    message
    query

    constructor(status, message, query) {
        super()
        if (typeof status === 'number') {
            this.code = status
            this.status = Codes[status]
        }
        else {
            this.status = status
            this.code = Status[status]
        }
        this.message = message || this.status
        this.query = query
    }

    forFastifyReply() {
        return {
            status: this.status,
            code: this.code,
            message: this.message,
            query: this.query
        }
    }
}

// 生成yinStatus
// let fn = '{'
// for (let s in Status) {
//     const code = Status[s]
//     if (code < 400)
//         fn += `${s}:(message,query)=>new yinError(${code}, message, query),`
//     else
//         fn += `${s}:(message,query)=>Promise.reject(new yinError(${code}, message, query)),`
// }
// fn += '}'
// console.log(fn)

export const yinStatus = {
    CONTINUE: (message, query) => new yinError(100, message, query),
    SWITCHING_PROTOCOLS: (message, query) => new yinError(101, message, query),
    PROCESSING: (message, query) => new yinError(102, message, query),
    EARLY_HINTS: (message, query) => new yinError(103, message, query),
    OK: (message, query) => new yinError(200, message, query),
    CREATED: (message, query) => new yinError(201, message, query),
    ACCEPTED: (message, query) => new yinError(202, message, query),
    NON_AUTHORITATIVE_INFORMATION: (message, query) => new yinError(203, message, query),
    NO_CONTENT: (message, query) => new yinError(204, message, query),
    RESET_CONTENT: (message, query) => new yinError(205, message, query),
    PARTIAL_CONTENT: (message, query) => new yinError(206, message, query),
    MULTI_STATUS: (message, query) => new yinError(207, message, query),
    ALREADY_REPORTED: (message, query) => new yinError(208, message, query),
    IM_USED: (message, query) => new yinError(226, message, query),
    MULTIPLE_CHOICES: (message, query) => new yinError(300, message, query),
    MOVED_PERMANENTLY: (message, query) => new yinError(301, message, query),
    FOUND: (message, query) => new yinError(302, message, query),
    SEE_OTHER: (message, query) => new yinError(303, message, query),
    NOT_MODIFIED: (message, query) => new yinError(304, message, query),
    USE_PROXY: (message, query) => new yinError(305, message, query),
    TEMPORARY_REDIRECT: (message, query) => new yinError(307, message, query),
    PERMANENT_REDIRECT: (message, query) => new yinError(308, message, query),
    BAD_REQUEST: (message, query) => Promise.reject(new yinError(400, message, query)),
    UNAUTHORIZED: (message, query) => Promise.reject(new yinError(401, message, query)),
    PAYMENT_REQUIRED: (message, query) => Promise.reject(new yinError(402, message, query)),
    FORBIDDEN: (message, query) => Promise.reject(new yinError(403, message, query)),
    NOT_FOUND: (message, query) => Promise.reject(new yinError(404, message, query)),
    METHOD_NOT_ALLOWED: (message, query) => Promise.reject(new yinError(405, message, query)),
    NOT_ACCEPTABLE: (message, query) => Promise.reject(new yinError(406, message, query)),
    PROXY_AUTHENTICATION_REQUIRED: (message, query) => Promise.reject(new yinError(407, message, query)),
    REQUEST_TIMEOUT: (message, query) => Promise.reject(new yinError(408, message, query)),
    CONFLICT: (message, query) => Promise.reject(new yinError(409, message, query)),
    GONE: (message, query) => Promise.reject(new yinError(410, message, query)),
    LENGTH_REQUIRED: (message, query) => Promise.reject(new yinError(411, message, query)),
    PRECONDITION_FAILED: (message, query) => Promise.reject(new yinError(412, message, query)),
    PAYLOAD_TOO_LARGE: (message, query) => Promise.reject(new yinError(413, message, query)),
    URI_TOO_LONG: (message, query) => Promise.reject(new yinError(414, message, query)),
    UNSUPPORTED_MEDIA_TYPE: (message, query) => Promise.reject(new yinError(415, message, query)),
    RANGE_NOT_SATISFIABLE: (message, query) => Promise.reject(new yinError(416, message, query)),
    EXPECTATION_FAILED: (message, query) => Promise.reject(new yinError(417, message, query)),
    I_AM_A_TEAPOT: (message, query) => Promise.reject(new yinError(418, message, query)),
    MISDIRECTED_REQUEST: (message, query) => Promise.reject(new yinError(421, message, query)),
    UNPROCESSABLE_ENTITY: (message, query) => Promise.reject(new yinError(422, message, query)),
    LOCKED: (message, query) => Promise.reject(new yinError(423, message, query)),
    FAILED_DEPENDENCY: (message, query) => Promise.reject(new yinError(424, message, query)),
    TOO_EARLY: (message, query) => Promise.reject(new yinError(425, message, query)),
    UPGRADE_REQUIRED: (message, query) => Promise.reject(new yinError(426, message, query)),
    PRECONDITION_REQUIRED: (message, query) => Promise.reject(new yinError(428, message, query)),
    TOO_MANY_REQUESTS: (message, query) => Promise.reject(new yinError(429, message, query)),
    REQUEST_HEADER_FIELDS_TOO_LARGE: (message, query) => Promise.reject(new yinError(431, message, query)),
    UNAVAILABLE_FOR_LEGAL_REASONS: (message, query) => Promise.reject(new yinError(451, message, query)),
    INTERNAL_SERVER_ERROR: (message, query) => Promise.reject(new yinError(500, message, query)),
    NOT_IMPLEMENTED: (message, query) => Promise.reject(new yinError(501, message, query)),
    BAD_GATEWAY: (message, query) => Promise.reject(new yinError(502, message, query)),
    SERVICE_UNAVAILABLE: (message, query) => Promise.reject(new yinError(503, message, query)),
    GATEWAY_TIMEOUT: (message, query) => Promise.reject(new yinError(504, message, query)),
    HTTP_VERSION_NOT_SUPPORTED: (message, query) => Promise.reject(new yinError(505, message, query)),
    VARIANT_ALSO_NEGOTIATES: (message, query) => Promise.reject(new yinError(506, message, query)),
    INSUFFICIENT_STORAGE: (message, query) => Promise.reject(new yinError(507, message, query)),
    LOOP_DETECTED: (message, query) => Promise.reject(new yinError(508, message, query)),
    BANDWIDTH_LIMIT_EXCEEDED: (message, query) => Promise.reject(new yinError(509, message, query)),
    NOT_EXTENDED: (message, query) => Promise.reject(new yinError(510, message, query)),
    NETWORK_AUTHENTICATION_REQUIRED: (message, query) => Promise.reject(new yinError(511, message, query)),
}

// export const yinStatus = {
//     CONTINUE: (message = "CONTINUE", query) => new yinError('CONTINUE', 100, message, query),
//     SWITCHING_PROTOCOLS(message = "SWITCHING_PROTOCOLS", query) {
//         return new yinError('SWITCHING_PROTOCOLS', 101, message, query)
//     },
//     PROCESSING(message = "PROCESSING", query) {
//         return new yinError('PROCESSING', 102, message, query)
//     },
//     EARLYHINTS(message = "EARLYHINTS", query) {
//         return new yinError('EARLYHINTS', 103, message, query)
//     },
//     OK(message = "OK", query) {
//         return new yinError('OK', 200, message, query)
//     },
//     CREATED(message = "CREATED", query) {
//         return new yinError('CREATED', 201, message, query)
//     },
//     ACCEPTED(message = "ACCEPTED", query) {
//         return new yinError('ACCEPTED', 202, message, query)
//     },
//     NON_AUTHORITATIVE_INFORMATION(message = "NON_AUTHORITATIVE_INFORMATION", query) {
//         return new yinError('NON_AUTHORITATIVE_INFORMATION', 203, message, query)
//     },
//     NO_CONTENT(message = "NO_CONTENT", query) {
//         return new yinError('NO_CONTENT', 204, message, query)
//     },
//     RESET_CONTENT(message = "RESET_CONTENT", query) {
//         return new yinError('RESET_CONTENT', 205, message, query)
//     },
//     PARTIAL_CONTENT(message = "PARTIAL_CONTENT", query) {
//         return new yinError('PARTIAL_CONTENT', 206, message, query)
//     },
//     AMBIGUOUS(message = "AMBIGUOUS", query) {
//         return new yinError('AMBIGUOUS', 300, message, query)
//     },
//     MOVED_PERMANENTLY(message = "MOVED_PERMANENTLY", query) {
//         return new yinError('MOVED_PERMANENTLY', 301, message, query)
//     },
//     FOUND(message = "FOUND", query) {
//         return new yinError('FOUND', 302, message, query)
//     },
//     SEE_OTHER(message = "SEE_OTHER", query) {
//         return new yinError('SEE_OTHER', 303, message, query)
//     },
//     NOT_MODIFIED(message = "NOT_MODIFIED", query) {
//         return new yinError('NOT_MODIFIED', 304, message, query)
//     },
//     TEMPORARY_REDIRECT(message = "TEMPORARY_REDIRECT", query) {
//         return new yinError('TEMPORARY_REDIRECT', 307, message, query)
//     },
//     PERMANENT_REDIRECT(message = "PERMANENT_REDIRECT", query) {
//         return new yinError('PERMANENT_REDIRECT', 308, message, query)
//     },
//
//
//     /**
//      * 400以上自动返回reject
//      * @param message
//      * @param query
//      * @constructor
//      */
//     BAD_REQUEST(message = "BAD_REQUEST", query) {
//         return Promise.reject(new yinError('BAD_REQUEST', 400, message, query))
//     },
//     UNAUTHORIZED(message = "UNAUTHORIZED", query) {
//         return Promise.reject(new yinError('UNAUTHORIZED', 401, message, query))
//     },
//     PAYMENT_REQUIRED(message = "PAYMENT_REQUIRED", query) {
//         return Promise.reject(new yinError('PAYMENT_REQUIRED', 402, message, query))
//     },
//     FORBIDDEN(message = "FORBIDDEN", query) {
//         return Promise.reject(new yinError('FORBIDDEN', 403, message, query))
//     },
//     NOT_FOUND(message = "NOT_FOUND", query) {
//         return Promise.reject(new yinError('NOT_FOUND', 404, message, query))
//     },
//     METHOD_NOT_ALLOWED(message = "METHOD_NOT_ALLOWED", query) {
//         return Promise.reject(new yinError('METHOD_NOT_ALLOWED', 405, message, query))
//     },
//     NOT_ACCEPTABLE(message = "NOT_ACCEPTABLE", query) {
//         return Promise.reject(new yinError('NOT_ACCEPTABLE', 406, message, query))
//     },
//     PROXY_AUTHENTICATION_REQUIRED(message = "PROXY_AUTHENTICATION_REQUIRED", query) {
//         return Promise.reject(new yinError('PROXY_AUTHENTICATION_REQUIRED', 407, message, query))
//     },
//     REQUEST_TIMEOUT(message = "REQUEST_TIMEOUT", query) {
//         return Promise.reject(new yinError('REQUEST_TIMEOUT', 408, message, query))
//     },
//     CONFLICT(message = "CONFLICT", query) {
//         return Promise.reject(new yinError('CONFLICT', 409, message, query))
//     },
//     GONE(message = "GONE", query) {
//         return Promise.reject(new yinError('GONE', 410, message, query))
//     },
//     LENGTH_REQUIRED(message = "LENGTH_REQUIRED", query) {
//         return Promise.reject(new yinError('LENGTH_REQUIRED', 411, message, query))
//     },
//     PRECONDITION_FAILED(message = "PRECONDITION_FAILED", query) {
//         return Promise.reject(new yinError('PRECONDITION_FAILED', 412, message, query))
//     },
//     PAYLOAD_TOO_LARGE(message = "PAYLOAD_TOO_LARGE", query) {
//         return Promise.reject(new yinError('PAYLOAD_TOO_LARGE', 413, message, query))
//     },
//     URI_TOO_LONG(message = "URI_TOO_LONG", query) {
//         return Promise.reject(new yinError('URI_TOO_LONG', 414, message, query))
//     },
//     UNSUPPORTED_MEDIA_TYPE(message = "UNSUPPORTED_MEDIA_TYPE", query) {
//         return Promise.reject(new yinError('UNSUPPORTED_MEDIA_TYPE', 415, message, query))
//     },
//     REQUESTED_RANGE_NOT_SATISFIABLE(message = "REQUESTED_RANGE_NOT_SATISFIABLE", query) {
//         return Promise.reject(new yinError('REQUESTED_RANGE_NOT_SATISFIABLE', 416, message, query))
//     },
//     EXPECTATION_FAILED(message = "EXPECTATION_FAILED", query) {
//         return Promise.reject(new yinError('EXPECTATION_FAILED', 417, message, query))
//     },
//     I_AM_A_TEAPOT(message = "I_AM_A_TEAPOT", query) {
//         return Promise.reject(new yinError('I_AM_A_TEAPOT', 418, message, query))
//     },
//     MISDIRECTED(message = "MISDIRECTED", query) {
//         return Promise.reject(new yinError('MISDIRECTED', 421, message, query))
//     },
//     UNPROCESSABLE_ENTITY(message = "UNPROCESSABLE_ENTITY", query) {
//         return Promise.reject(new yinError('UNPROCESSABLE_ENTITY', 422, message, query))
//     },
//     FAILED_DEPENDENCY(message = "FAILED_DEPENDENCY", query) {
//         return Promise.reject(new yinError('FAILED_DEPENDENCY', 424, message, query))
//     },
//     PRECONDITION_REQUIRED(message = "PRECONDITION_REQUIRED", query) {
//         return Promise.reject(new yinError('PRECONDITION_REQUIRED', 428, message, query))
//     },
//     TOO_MANY_REQUESTS(message = "TOO_MANY_REQUESTS", query) {
//         return Promise.reject(new yinError('TOO_MANY_REQUESTS', 429, message, query))
//     },
//     INTERNAL_SERVER_ERROR(message = "INTERNAL_SERVER_ERROR", query) {
//         return Promise.reject(new yinError('INTERNAL_SERVER_ERROR', 500, message, query))
//     },
//     NOT_IMPLEMENTED(message = "NOT_IMPLEMENTED", query) {
//         return Promise.reject(new yinError('NOT_IMPLEMENTED', 501, message, query))
//     },
//     BAD_GATEWAY(message = "BAD_GATEWAY", query) {
//         return Promise.reject(new yinError('BAD_GATEWAY', 502, message, query))
//     },
//     SERVICE_UNAVAILABLE(message = "SERVICE_UNAVAILABLE", query) {
//         return Promise.reject(new yinError('SERVICE_UNAVAILABLE', 503, message, query))
//     },
//     GATEWAY_TIMEOUT(message = "GATEWAY_TIMEOUT", query) {
//         return Promise.reject(new yinError('GATEWAY_TIMEOUT', 504, message, query))
//     },
//     HTTP_VERSION_NOT_SUPPORTED(message = "HTTP_VERSION_NOT_SUPPORTED", query) {
//         return Promise.reject(new yinError('HTTP_VERSION_NOT_SUPPORTED', 505, message, query))
//     }
// }

