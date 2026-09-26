export const CommonErrors: Readonly<{
    BAD_REQUEST: Readonly<{
        code: 100001;
        httpStatus: 400;
        msg: "请求参数无效";
    }>;
    VALIDATION_FAILED: Readonly<{
        code: 100002;
        httpStatus: 422;
        msg: "提交的参数不符合要求，请检查后重试";
    }>;
    INTERNAL_ERROR: Readonly<{
        code: 100003;
        httpStatus: 500;
        msg: "服务器内部错误，请稍后重试";
    }>;
    DATABASE_UNAVAILABLE: Readonly<{
        code: 100004;
        httpStatus: 503;
        msg: "数据库暂时不可用，请稍后重试";
    }>;
    SERVICE_UNAVAILABLE: Readonly<{
        code: 100005;
        httpStatus: 503;
        msg: "服务暂时不可用，请稍后重试";
    }>;
    NOT_FOUND: Readonly<{
        code: 100006;
        httpStatus: 404;
        msg: "请求的资源不存在";
    }>;
    CONFLICT: Readonly<{
        code: 100007;
        httpStatus: 409;
        msg: "数据存在冲突，请刷新后重试";
    }>;
    RATE_LIMITED: Readonly<{
        code: 100008;
        httpStatus: 429;
        msg: "请求过于频繁，请稍后重试";
    }>;
    METHOD_NOT_ALLOWED: Readonly<{
        code: 100009;
        httpStatus: 405;
        msg: "不支持该请求方法";
    }>;
    PAYLOAD_TOO_LARGE: Readonly<{
        code: 100010;
        httpStatus: 413;
        msg: "请求内容过大";
    }>;
    UNSUPPORTED_MEDIA_TYPE: Readonly<{
        code: 100011;
        httpStatus: 415;
        msg: "不支持该内容类型";
    }>;
    BAD_GATEWAY: Readonly<{
        code: 100012;
        httpStatus: 502;
        msg: "上游服务暂时不可用";
    }>;
    REQUEST_TIMEOUT: Readonly<{
        code: 100013;
        httpStatus: 408;
        msg: "请求超时，请稍后重试";
    }>;
}>;
