import isPlainObject from 'lodash.isplainobject';

declare namespace redact {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- used for flexibility in replace function
    type ReplaceFunction = (value: any, key: string) => string;

    interface ConfigOptions {
        // do partial matches, default true
        partial?: boolean;

        // do strict key matching, default true
        strict?: boolean;

        // ignore unknown types instead of error, default false
        ignoreUnknown?: boolean;
    }
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
 * @param  isStrict Use strict case if true
 * @param  isPartial Use partial matching if true
 * @return          True for match or false
 */
function isKeywordMatch(keywords: string[], key: string, isStrict = false, isPartial = false): boolean {
    return keywords.some(keyword => {
        const keyMatch = isStrict ? key : key.toLowerCase();
        const keywordMatch = isStrict ? keyword : keyword.toLowerCase();

        return isPartial ? keyMatch.includes(keywordMatch) : keyMatch === keywordMatch;
    });
}

function resolveConfig(config: redact.ConfigOptions = {}): redact.ConfigOptions {
    const resolved: redact.ConfigOptions = { partial: true, strict: true, ignoreUnknown: false };
    for (const key of ['partial', 'strict', 'ignoreUnknown'] as const) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            resolved[key] = config[key];
        }
    }
    return resolved;
}

/**
 * Parses an object and redacts any keys listed in keywords
 *
 * @param  target     The target object to scan for redactable items
 * @param  keywords   A list of members to redact
 * @param  replaceVal Optional custom replace value or function replacer
 * @param  config     Optional config
 *                             {
 *                               partial: boolean, do partial matches, default true
 *                               strict: boolean, do strict key matching, default true
 *                               ignoreUnknown: boolean, ignore unknown types instead of error, default false
 *                             }
 * @return            the new redacted object
 */
function redact(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- used for flexibility in replace function
    target: any,
    keywords: string[],
    replaceVal?: string | redact.ReplaceFunction,
    config?: redact.ConfigOptions
): typeof target {
    const { partial, strict, ignoreUnknown } = resolveConfig(config);

    if (!isObject(target)) {
    // If it's not an object then it's a primitive. Nothing to redact.
        return target;
    }
    if (Array.isArray(target)) {
    // Create a new array with each value having been redacted
    // Redact each value of the array.
        return target.map(val => redact(val, keywords, replaceVal, config));
    }
    if (isPlainObject(target)) {
        const entries = Object.entries(target).map(([key, value]) => {
            if (isKeywordMatch(keywords, key, strict, partial)) {
                const replacement = typeof replaceVal === 'function'
                    ? replaceVal(value, key) : (replaceVal ?? '[ REDACTED ]');
                return [key, replacement] as const;
            }
            return [key, redact(value, keywords, replaceVal, config)] as const;
        });
        return Object.fromEntries(entries) as typeof target;
    }
    // Redaction only works on arrays, plain objects, and primitives.
    if (ignoreUnknown === true) {
    // ignore the unknown type instead of throwing an error
        return target;
    }
    let targetType = typeof target;
    if (targetType === 'object' && !isPlainObject(target)) {
        targetType += ' (not plain)';
    }
    throw new Error(`Unsupported value type for redaction: ${targetType}`);
}

export = redact;
