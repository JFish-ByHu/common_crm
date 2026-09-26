export const RoleErrors: Readonly<{
    ROLE_NOT_FOUND: Readonly<{
        code: 130001;
        httpStatus: 404;
        msg: "角色不存在，请刷新后重试";
    }>;
    ROLE_CONFLICT: Readonly<{
        code: 130002;
        httpStatus: 409;
        msg: "角色编码已存在";
    }>;
    ROLE_IN_USE: Readonly<{
        code: 130003;
        httpStatus: 409;
        msg: "角色已分配给用户，请先解除分配后再删除";
    }>;
    ROLE_DISABLED: Readonly<{
        code: 130004;
        httpStatus: 409;
        msg: "不能新增分配停用的角色，请刷新后重试";
    }>;
    INVALID_INPUT: Readonly<{
        code: 130005;
        httpStatus: 400;
        msg: "角色参数无效或没有可更新的字段";
    }>;
    SYSTEM_ROLE_IMMUTABLE: Readonly<{
        code: 130006;
        httpStatus: 403;
        msg: "系统管理角色不可修改";
    }>;
    SYSTEM_ROLE_UNDELETABLE: Readonly<{
        code: 130007;
        httpStatus: 403;
        msg: "系统管理角色不可删除";
    }>;
    SYSTEM_ROLE_MEMBERS_PROTECTED: Readonly<{
        code: 130008;
        httpStatus: 403;
        msg: "系统管理角色成员不可通过业务接口调整";
    }>;
}>;
