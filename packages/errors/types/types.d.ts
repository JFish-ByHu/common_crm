export function defineError<Code extends number, Status extends number, Message extends string | ((...args: never[]) => string)>(code: Code, httpStatus: Status, msg: Message): Readonly<{
    code: Code;
    httpStatus: Status;
    msg: Message;
}>;
export type ErrorDefinition = Readonly<{
    code: number;
    httpStatus: number;
    msg: string | ((...args: never[]) => string);
}>;
