export const AuthErrors: Readonly<{
    INVALID_CREDENTIALS: Readonly<{
        code: 110001;
        httpStatus: 401;
        msg: "用户名或密码错误";
    }>;
    SESSION_EXPIRED: Readonly<{
        code: 110002;
        httpStatus: 401;
        msg: "登录已过期，请重新登录";
    }>;
    INVALID_REFRESH_TOKEN: Readonly<{
        code: 110003;
        httpStatus: 401;
        msg: "登录凭据已失效，请重新登录";
    }>;
    ACCOUNT_UNAVAILABLE: Readonly<{
        code: 110004;
        httpStatus: 401;
        msg: "账号不可用，请联系管理员";
    }>;
    PASSWORD_UNCHANGED: Readonly<{
        code: 110005;
        httpStatus: 400;
        msg: "新密码不能与原密码相同";
    }>;
    INVALID_INPUT: Readonly<{
        code: 110006;
        httpStatus: 400;
        msg: "认证参数无效";
    }>;
}>;
