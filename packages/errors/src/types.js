/**
 * @template {number} Code
 * @template {number} Status
 * @template {string | ((...args: never[]) => string)} Message
 * @param {Code} code
 * @param {Status} httpStatus
 * @param {Message} msg
 */
export const defineError = (code, httpStatus, msg) => Object.freeze({ code, httpStatus, msg })
/** @typedef {Readonly<{code: number, httpStatus: number, msg: string | ((...args: never[]) => string)}>} ErrorDefinition */
