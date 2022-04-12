import { Action } from "../action";
import { ActionType } from "../metadata/action";
import { getMetadataArgsStorage } from "../metadata/builder";

/**
 * Registers an action to be executed when request comes on a given route with method.
 * Must be applied on a controller action.
 */
export function Route(route: string): Function
export function Route(route: RegExp): Function
export function Route(route: string | RegExp, method_name?: ActionType): Function
export function Route(route: string | RegExp = '', options?: ActionType | {
  method_name?: string,
  no_result?: boolean,
  appendParams?: (action: Action) => any
}): Function {
  return function(object: Object, property_name: string) {
    if (typeof options === 'string') {
      options = {
        method_name: options
      }
    }
    if (options === undefined) {
      options = {}
    }
    if (!options.method_name) options.method_name = property_name as ActionType
    getMetadataArgsStorage().actions.push({
      type: options.method_name as ActionType,
      target: object.constructor,
      method: property_name,
      route,
      no_result: options.no_result,
      appendParams: options.appendParams
    });
  };
}
