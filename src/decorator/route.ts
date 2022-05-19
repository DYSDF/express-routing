import { ActionType } from "../metadata/action";
import { getMetadataArgsStorage } from "../metadata/builder";

/**
 * Registers an action to be executed when request comes on a given route with method.
 * Must be applied on a controller action.
 */
export function Route(route: string | RegExp, method?: ActionType): Function;
export function Route(route: string | RegExp, options?: { method: string }): Function;
export function Route(route: string | RegExp, method_or_options?: ActionType | { method: string }): Function {
  return function(object: Object, property_name: string) {
    if (method_or_options === undefined) {
      method_or_options = property_name as ActionType
    }

    if (typeof method_or_options === 'string') {
      method_or_options = {
        method: method_or_options
      }
    }

    getMetadataArgsStorage().actions.push({
      type: method_or_options.method as ActionType,
      target: object.constructor,
      method: property_name,
      route
    });
  };
}
