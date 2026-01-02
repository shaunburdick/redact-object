/* eslint-disable @typescript-eslint/no-explicit-any */
import isPlainObject from 'lodash.isplainobject';

export type ReplaceFunction = (value: any, key: string) => string;

export interface ConfigOptions {
    // do partial matches, default false
    partial?: boolean;

    // do strict key matching, default true
    strict?: boolean;

    // ignore unknown types instead of error, default false
    ignoreUnknown?: boolean;
}

// Yoinked from lodash to save dependencies
function isObject(value: unknown): value is Record<string, unknown> {
    const type = typeof value;
    return value !== null && (type === 'object' || type === 'function');
}

/**
 * Checks for match
 *
 * @param  keywords A list of keywords to look for
 * @param  key      The string to check
 * @param  strict   Use strict case if true
 * @param  partial  Use partial matching if true
 * @return          True for match or false
 */
function isKeywordMatch(keywords: string[], key: string, strict = false, partial = false): boolean {
    return keywords.some(keyword => {
        const keyMatch = strict ? key : key.toLowerCase();
        const keywordMatch = strict ? keyword : keyword.toLowerCase();

        return partial ? keyMatch.includes(keywordMatch) : keyMatch === keywordMatch;
    });
}

/**
 * Parses an object and redacts any keys listed in keywords
 *
 * @param  target     The target object to scan for redactable items
 * @param  keywords   A list of members to redact
 * @param  replaceVal Optional custom replace value or function replacer
 * @param  config     Optional config
 *                             {
 *                               partial: boolean, do partial matches, default false
 *                               strict: boolean, do strict key matching, default true
 *                               ignoreUnknown: boolean, ignore unknown types instead of error, default false
 *                             }
 * @return            the new redacted object
 */
export default function redact(
    target: any,
    keywords: string[],
    replaceVal?: string | ReplaceFunction,
    config?: ConfigOptions
): typeof target {
    config = config ?? {};
    const partial = Object.prototype.hasOwnProperty.call(config, 'partial') ? config.partial : true;
    const strict = Object.prototype.hasOwnProperty.call(config, 'strict') ? config.strict : true;
    const ignoreUnknown = Object.prototype.hasOwnProperty.call(config, 'ignoreUnknown') ? config.ignoreUnknown : false;

    if (!isObject(target)) {
    // If it's not an object then it's a primitive. Nothing to redact.
        return target;
    } else if (Array.isArray(target)) {
    // Create a new array with each value having been redacted
    // Redact each value of the array.
        return target.map(val => redact(val, keywords, replaceVal, config));
    } else if (isPlainObject(target)) {
        return Object.keys(target).reduce(
            (newObj, key) => {
                const isMatch = isKeywordMatch(keywords, key, strict, partial);
                if (isMatch) {
                    newObj[key] = typeof replaceVal === 'function'
                        ? replaceVal(target[key], key) : (replaceVal ?? '[ REDACTED ]');
                } else {
                    newObj[key] = redact(target[key], keywords, replaceVal, config);
                }
                return newObj;
            },
            ({} as typeof target)
        );
    }
    // Redaction only works on arrays, plain objects, and primitives.
    if (ignoreUnknown === true) {
    // ignore the unknown type instead of throwing an error
        return target;
    } else {
        let targetType = typeof target;
        if (targetType === 'object' && !isPlainObject(target)) {
            targetType += ' (not plain)';
        }
        throw new Error(`Unsupported value type for redaction: ${targetType}`);
    }
}
