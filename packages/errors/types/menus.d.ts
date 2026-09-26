export const MenuErrors: Readonly<{
    NO_PERMISSION: Readonly<{
        code: 140001;
        httpStatus: 403;
        msg: "没有该操作的权限";
    }>;
    MENU_NOT_FOUND: Readonly<{
        code: 140002;
        httpStatus: 404;
        msg: "菜单不存在";
    }>;
    ACTION_NOT_FOUND: Readonly<{
        code: 140003;
        httpStatus: 404;
        msg: "按钮不存在";
    }>;
    ROUTE_CONFLICT: Readonly<{
        code: 140004;
        httpStatus: 409;
        msg: "路由路径与已有页面冲突，参数改名不能区分两个路由";
    }>;
    PROTECTED_MENU_VISIBLE: Readonly<{
        code: 140005;
        httpStatus: 400;
        msg: "菜单管理及其上级目录必须保持启用和显示";
    }>;
    PROTECTED_ENTRY: Readonly<{
        code: 140006;
        httpStatus: 400;
        msg: "菜单管理入口不能更换组件或类型，也不能清空路由路径";
    }>;
    MENU_TYPE_IN_USE: Readonly<{
        code: 140007;
        httpStatus: 400;
        msg: "存在子项的菜单不能更改类型";
    }>;
    PARENT_CYCLE: Readonly<{
        code: 140008;
        httpStatus: 400;
        msg: "父级不能是自身或后代菜单";
    }>;
    INVALID_PARENT: Readonly<{
        code: 140009;
        httpStatus: 400;
        msg: "父级必须是已存在的目录";
    }>;
    PROTECTED_PARENT: Readonly<{
        code: 140010;
        httpStatus: 400;
        msg: "菜单管理入口不能移动到停用或隐藏的目录";
    }>;
    CODE_USED_BY_ACTION: Readonly<{
        code: 140011;
        httpStatus: 409;
        msg: "权限标识已被按钮使用";
    }>;
    PROTECTED_DELETE: Readonly<{
        code: 140012;
        httpStatus: 400;
        msg: "菜单管理入口不能删除";
    }>;
    MENU_IN_USE: Readonly<{
        code: 140013;
        httpStatus: 409;
        msg: "请先删除目录下的菜单和按钮权限";
    }>;
    ACTION_REQUIRES_PAGE: Readonly<{
        code: 140014;
        httpStatus: 400;
        msg: "按钮必须属于页面菜单";
    }>;
    ACTION_MOVE_FORBIDDEN: Readonly<{
        code: 140015;
        httpStatus: 400;
        msg: "按钮不可移动到其他菜单，请重新创建";
    }>;
    CODE_USED_BY_MENU: Readonly<{
        code: 140016;
        httpStatus: 409;
        msg: "权限标识已被菜单使用";
    }>;
    REVISION_CONFLICT: Readonly<{
        code: 140017;
        httpStatus: 409;
        msg: "权限配置已变更，请重新加载后保存";
    }>;
    SYSTEM_GRANTS_IMMUTABLE: Readonly<{
        code: 140018;
        httpStatus: 403;
        msg: "系统管理角色固定拥有全部权限，不能修改";
    }>;
    UNKNOWN_ACTIONS: Readonly<{
        code: 140019;
        httpStatus: 400;
        msg: "包含不存在的按钮权限";
    }>;
    UNKNOWN_MENUS: Readonly<{
        code: 140020;
        httpStatus: 400;
        msg: "包含不存在的菜单";
    }>;
    BINDING_CONFLICT: Readonly<{
        code: 140021;
        httpStatus: 409;
        msg: "权限标识、路由、组件或接口绑定重复";
    }>;
    RECORD_NOT_FOUND: Readonly<{
        code: 140022;
        httpStatus: 404;
        msg: "记录不存在";
    }>;
    RECORD_IN_USE: Readonly<{
        code: 140023;
        httpStatus: 409;
        msg: "仍存在关联记录，请刷新后重试";
    }>;
    TRAILING_SLASH: Readonly<{
        code: 140024;
        httpStatus: 400;
        msg: "路由路径不能以斜杠结尾";
    }>;
    DUPLICATE_PARAMETER: Readonly<{
        code: 140025;
        httpStatus: 400;
        msg: "路由参数名不能重复";
    }>;
    PARAMETER_PAGE_VISIBLE: Readonly<{
        code: 140026;
        httpStatus: 400;
        msg: "包含动态参数的页面必须隐藏导航";
    }>;
    INVALID_APP_PATH: Readonly<{
        code: 140027;
        httpStatus: 400;
        msg: "页面路由必须位于 /system 或 /customer 下";
    }>;
    RESERVED_ROUTE: Readonly<{
        code: 140028;
        httpStatus: 400;
        msg: "不能占用应用保留路由";
    }>;
    COMPONENT_APP_MISMATCH: Readonly<{
        code: 140029;
        httpStatus: 400;
        msg: "组件与所属应用路由不一致";
    }>;
    DIRECTORY_HAS_PAGE: Readonly<{
        code: 140030;
        httpStatus: 400;
        msg: "目录不绑定页面组件和路由";
    }>;
    UNKNOWN_ENDPOINT: Readonly<{
        code: 140031;
        httpStatus: 400;
        msg: "包含不存在或不允许配置的接口";
    }>;
    DUPLICATE_ENDPOINT: Readonly<{
        code: 140032;
        httpStatus: 400;
        msg: "接口不能重复绑定";
    }>;
}>;
