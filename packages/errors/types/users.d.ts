export const UserErrors: Readonly<{
    USER_NOT_FOUND: Readonly<{
        code: 120001;
        httpStatus: 404;
        msg: "用户不存在，请刷新后重试";
    }>;
    USERNAME_EXISTS: Readonly<{
        code: 120002;
        httpStatus: 409;
        msg: "用户名已存在";
    }>;
    EMAIL_EXISTS: Readonly<{
        code: 120003;
        httpStatus: 409;
        msg: "邮箱已被使用";
    }>;
    USER_CONFLICT: Readonly<{
        code: 120004;
        httpStatus: 409;
        msg: "用户名或邮箱已存在";
    }>;
    INVALID_INPUT: Readonly<{
        code: 120005;
        httpStatus: 400;
        msg: "用户参数无效或没有可更新的字段";
    }>;
    SYSTEM_USER_PROTECTED: Readonly<{
        code: 120006;
        httpStatus: 403;
        msg: "系统管理员账号不能停用、删除或被其他用户修改";
    }>;
}>;
