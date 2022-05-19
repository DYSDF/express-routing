import { getMetadataArgsStorage } from '../metadata/builder';

/**
 * Used to set specific HTTP status code when result returned by a controller action is equal to undefined.
 * Must be applied on a controller action.
 */
export function OnUndefined(code: number): Function;
export function OnUndefined(error: Function): Function;
export function OnUndefined(code_or_error: number | Function): Function {
  return function (object: Object, methodName: string) {
    getMetadataArgsStorage().response_handlers.push({
      type: 'on-undefined',
      target: object.constructor,
      method: methodName,
      value: code_or_error,
    });
  };
}
