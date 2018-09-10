export interface ConfigOptions {
  // do partial matches, default false
  partial?: boolean;

  // do strict key matching, default true
  strict?: boolean;

  // ignore unknown types instead of error, default false
  ignoreUnknown?: boolean;
}

export type ReplaceFunction = (value: any, key: string) => string;

/**
 * Parses an object and redacts any keys listed in keywords
 *
 * @param  {*}                        target     The target object to scan for redactable items
 * @param  {string[]}                 keywords   A list of members to redact
 * @param  {string|ReplaceFunction}   replaceVal Optional custom replace value or function replacer
 * @param  {ConfigOptions}            config     Optional config
 * @return {object}                              the new redacted object
 */
function redact(
  target: any,
  keywords: string[],
  replaceVal?: string | ReplaceFunction,
  config?: ConfigOptions
): any;

export = redact;