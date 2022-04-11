import { getMetadataArgsStorage } from "../metadata/builder";

/**
 * Injects a Response object to the controller action parameter.
 * Must be applied on a controller action parameter.
 */
export function Res(): Function {
  return function (object: Object, method_name: string, index: number) {
    getMetadataArgsStorage().params.push({
      type: 'response',
      object: object,
      method: method_name,
      index: index
    });
  };
}
