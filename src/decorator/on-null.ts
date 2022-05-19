import { getMetadataArgsStorage } from '../metadata/builder';

/**
 * Used to set specific HTTP status code when result returned by a controller action is equal to null.
 * Must be applied on a controller action.
 */
export function OnNull(code: number): Function;
export function OnNull(error: Function): Function;
export function OnNull(code_or_error: number | Function): Function {
  return function (object: Object, methodName: string) {
    getMetadataArgsStorage().response_handlers.push({
      type: 'on-null',
      target: object.constructor,
      method: methodName,
      value: code_or_error,
    });
  };
}
