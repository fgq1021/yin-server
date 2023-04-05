export const yinStatus = {
    CONTINUE(message = "Continue", query?) {
        return {status: 'CONTINUE', message: message, query: query}
    },
    SWITCHING_PROTOCOLS(message = "Switching Protocols", query?) {
        return {status: 'SWITCHING_PROTOCOLS', message: message, query: query}
    },
    PROCESSING(message = "Processing", query?) {
        return {status: 'PROCESSING', message: message, query: query}
    },
    OK(message = "OK", query?) {
        return {status: 'OK', message: message, query: query}
    },
    CREATED(message = "Created", query?) {
        return {status: 'CREATED', message: message, query: query}
    },
    ACCEPTED(message = "Accepted", query?) {
        return {status: 'ACCEPTED', message: message, query: query}
    },
    NON_AUTHORITATIVE_INFORMATION(message = "Non Authoritative Information", query?) {
        return {status: 'NON_AUTHORITATIVE_INFORMATION', message: message, query: query}
    },
    NO_CONTENT(message = "No Content", query?) {
        return {status: 'NO_CONTENT', message: message, query: query}
    },
    RESET_CONTENT(message = "Reset Content", query?) {
        return {status: 'RESET_CONTENT', message: message, query: query}
    },
    PARTIAL_CONTENT(message = "Partial Content", query?) {
        return {status: 'PARTIAL_CONTENT', message: message, query: query}
    },
    MULTI_STATUS(message = "Multi-Status", query?) {
        return {status: 'MULTI_STATUS', message: message, query: query}
    },
    MULTIPLE_CHOICES(message = "Multiple Choices", query?) {
        return {status: 'MULTIPLE_CHOICES', message: message, query: query}
    },
    MOVED_PERMANENTLY(message = "Moved Permanently", query?) {
        return {status: 'MOVED_PERMANENTLY', message: message, query: query}
    },
    MOVED_TEMPORARILY(message = "Moved Temporarily", query?) {
        return {status: 'MOVED_TEMPORARILY', message: message, query: query}
    },
    SEE_OTHER(message = "See Other", query?) {
        return {status: 'SEE_OTHER', message: message, query: query}
    },
    NOT_MODIFIED(message = "Not Modified", query?) {
        return {status: 'NOT_MODIFIED', message: message, query: query}
    },
    USE_PROXY(message = "Use Proxy", query?) {
        return {status: 'USE_PROXY', message: message, query: query}
    },
    TEMPORARY_REDIRECT(message = "Temporary Redirect", query?) {
        return {status: 'TEMPORARY_REDIRECT', message: message, query: query}
    },
    PERMANENT_REDIRECT(message = "Permanent Redirect", query?) {
        return {status: 'PERMANENT_REDIRECT', message: message, query: query}
    },
    BAD_REQUEST(message = "Bad Request", query?) {
        return {status: 'BAD_REQUEST', message: message, query: query}
    },
    UNAUTHORIZED(message = "您没有访问此对象的权限", query?) {
        return {status: 'UNAUTHORIZED', message: message, query: query}
    },
    PAYMENT_REQUIRED(message = "Payment Required", query?) {
        return {status: 'PAYMENT_REQUIRED', message: message, query: query}
    },
    FORBIDDEN(message = "禁止访问", query?) {
        return {status: 'FORBIDDEN', message: message, query: query}
    },
    NOT_FOUND(message = "未找到该对象", query?) {
        return {status: 'NOT_FOUND', message: message, query: query}
    },
    METHOD_NOT_ALLOWED(message = "Method Not Allowed", query?) {
        return {status: 'METHOD_NOT_ALLOWED', message: message, query: query}
    },
    NOT_ACCEPTABLE(message = "Not Acceptable", query?) {
        return {status: 'NOT_ACCEPTABLE', message: message, query: query}
    },
    PROXY_AUTHENTICATION_REQUIRED(message = "Proxy Authentication Required", query?) {
        return {status: 'PROXY_AUTHENTICATION_REQUIRED', message: message, query: query}
    },
    REQUEST_TIMEOUT(message = "Request Timeout", query?) {
        return {status: 'REQUEST_TIMEOUT', message: message, query: query}
    },
    CONFLICT(message = "Conflict", query?) {
        return {status: 'CONFLICT', message: message, query: query}
    },
    GONE(message = "Gone", query?) {
        return {status: 'GONE', message: message, query: query}
    },
    LENGTH_REQUIRED(message = "Length Required", query?) {
        return {status: 'LENGTH_REQUIRED', message: message, query: query}
    },
    PRECONDITION_FAILED(message = "Precondition Failed", query?) {
        return {status: 'PRECONDITION_FAILED', message: message, query: query}
    },
    REQUEST_TOO_LONG(message = "Request Entity Too Large", query?) {
        return {status: 'REQUEST_TOO_LONG', message: message, query: query}
    },
    REQUEST_URI_TOO_LONG(message = "Request-URI Too Long", query?) {
        return {status: 'REQUEST_URI_TOO_LONG', message: message, query: query}
    },
    UNSUPPORTED_MEDIA_TYPE(message = "Unsupported Media Type", query?) {
        return {status: 'UNSUPPORTED_MEDIA_TYPE', message: message, query: query}
    },
    REQUESTED_RANGE_NOT_SATISFIABLE(message = "Requested Range Not Satisfiable", query?) {
        return {status: 'REQUESTED_RANGE_NOT_SATISFIABLE', message: message, query: query}
    },
    EXPECTATION_FAILED(message = "Expectation Failed", query?) {
        return {status: 'EXPECTATION_FAILED', message: message, query: query}
    },
    IM_A_TEAPOT(message = "I'm a teapot", query?) {
        return {status: 'IM_A_TEAPOT', message: message, query: query}
    },
    INSUFFICIENT_SPACE_ON_RESOURCE(message = "Insufficient Space on Resource", query?) {
        return {status: 'INSUFFICIENT_SPACE_ON_RESOURCE', message: message, query: query}
    },
    METHOD_FAILURE(message = "Method Failure", query?) {
        return {status: 'METHOD_FAILURE', message: message, query: query}
    },
    MISDIRECTED_REQUEST(message = "Misdirected Request", query?) {
        return {status: 'MISDIRECTED_REQUEST', message: message, query: query}
    },
    UNPROCESSABLE_ENTITY(message = "Unprocessable Entity", query?) {
        return {status: 'UNPROCESSABLE_ENTITY', message: message, query: query}
    },
    LOCKED(message = "Locked", query?) {
        return {status: 'LOCKED', message: message, query: query}
    },
    FAILED_DEPENDENCY(message = "Failed Dependency", query?) {
        return {status: 'FAILED_DEPENDENCY', message: message, query: query}
    },
    PRECONDITION_REQUIRED(message = "Precondition Required", query?) {
        return {status: 'PRECONDITION_REQUIRED', message: message, query: query}
    },
    TOO_MANY_REQUESTS(message = "Too Many Requests", query?) {
        return {status: 'TOO_MANY_REQUESTS', message: message, query: query}
    },
    REQUEST_HEADER_FIELDS_TOO_LARGE(message = "Request Header Fields Too Large", query?) {
        return {status: 'REQUEST_HEADER_FIELDS_TOO_LARGE', message: message, query: query}
    },
    UNAVAILABLE_FOR_LEGAL_REASONS(message = "Unavailable For Legal Reasons", query?) {
        return {status: 'UNAVAILABLE_FOR_LEGAL_REASONS', message: message, query: query}
    },
    INTERNAL_SERVER_ERROR(message = "Internal Server Error", query?) {
        return {status: 'INTERNAL_SERVER_ERROR', message: message, query: query}
    },
    NOT_IMPLEMENTED(message = "Not Implemented", query?) {
        return {status: 'NOT_IMPLEMENTED', message: message, query: query}
    },
    BAD_GATEWAY(message = "Bad Gateway", query?) {
        return {status: 'BAD_GATEWAY', message: message, query: query}
    },
    SERVICE_UNAVAILABLE(message = "Service Unavailable", query?) {
        return {status: 'SERVICE_UNAVAILABLE', message: message, query: query}
    },
    GATEWAY_TIMEOUT(message = "Gateway Timeout", query?) {
        return {status: 'GATEWAY_TIMEOUT', message: message, query: query}
    },
    HTTP_VERSION_NOT_SUPPORTED(message = "HTTP Version Not Supported", query?) {
        return {status: 'HTTP_VERSION_NOT_SUPPORTED', message: message, query: query}
    },
    INSUFFICIENT_STORAGE(message = "Insufficient Storage", query?) {
        return {status: 'INSUFFICIENT_STORAGE', message: message, query: query}
    },
    NETWORK_AUTHENTICATION_REQUIRED(message = "Network Authentication Required", query?) {
        return {status: 'NETWORK_AUTHENTICATION_REQUIRED', message: message, query: query}
    }
}

