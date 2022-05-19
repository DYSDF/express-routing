import { ActionType } from "../metadata/action";
import { getMetadataArgsStorage } from "../metadata/builder";

/**
 * Registers an action to be executed when request comes on a given route with method.
 * Must be applied on a controller action.
 */
export function Route(route: string | RegExp, method_name?: ActionType): Function {
  return function(object: Object, property_name: string) {
    if (!method_name) method_name = property_name as ActionType
    getMetadataArgsStorage().actions.push({
      type: method_name as ActionType,
      target: object.constructor,
      method: property_name,
      route
    });
  };
}
