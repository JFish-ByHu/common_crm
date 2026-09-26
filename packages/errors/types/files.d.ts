export const FileErrors: Readonly<{
    INVALID_CATEGORY: Readonly<{
        code: 150001;
        httpStatus: 422;
        msg: "不支持的文件分类";
    }>;
    FILE_TOO_LARGE: Readonly<{
        code: 150002;
        httpStatus: 413;
        msg: (params: {
            maxSizeMB: number;
        }) => string;
    }>;
    UNSUPPORTED_EXTENSION: Readonly<{
        code: 150003;
        httpStatus: 415;
        msg: (params: {
            extensions: string[];
        }) => string;
    }>;
    EMPTY_FILE: Readonly<{
        code: 150004;
        httpStatus: 422;
        msg: "不能上传空文件";
    }>;
    UNRECOGNIZED_CONTENT: Readonly<{
        code: 150005;
        httpStatus: 415;
        msg: "无法识别文件内容，文件可能已损坏";
    }>;
    NOT_TEXT: Readonly<{
        code: 150006;
        httpStatus: 415;
        msg: "文件内容与文本格式不一致";
    }>;
    INVALID_TEXT_CONTROL: Readonly<{
        code: 150007;
        httpStatus: 415;
        msg: "文本文件包含不支持的控制字符";
    }>;
    INVALID_TEXT_ENCODING: Readonly<{
        code: 150008;
        httpStatus: 415;
        msg: "仅支持 UTF-8 编码的纯文本或 CSV 文件";
    }>;
    TYPE_MISMATCH: Readonly<{
        code: 150009;
        httpStatus: 415;
        msg: "文件实际类型与扩展名不一致或格式不受支持";
    }>;
    INVALID_FILENAME: Readonly<{
        code: 150010;
        httpStatus: 422;
        msg: "文件名为空、过长或包含不允许的字符";
    }>;
    FILE_REQUIRED: Readonly<{
        code: 150011;
        httpStatus: 422;
        msg: "请选择要上传的文件";
    }>;
    UPLOAD_BUSY: Readonly<{
        code: 150012;
        httpStatus: 429;
        msg: "上传任务较多，请稍后重试";
    }>;
    MULTIPART_REQUIRED: Readonly<{
        code: 150013;
        httpStatus: 415;
        msg: "请使用 multipart/form-data 上传";
    }>;
    INVALID_MULTIPART_FIELDS: Readonly<{
        code: 150014;
        httpStatus: 422;
        msg: "仅支持单个 file 文件和可选的 category 分类字段";
    }>;
    UPLOAD_INTERRUPTED: Readonly<{
        code: 150015;
        httpStatus: 400;
        msg: "文件上传中断或请求格式不正确";
    }>;
}>;
