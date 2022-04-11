import { getMetadataArgsStorage } from "../metadata/builder";

/**
 * Injects a Request object to the controller action parameter.
 * Must be applied on a controller action parameter.
 */
export function Next(): Function {
  return function (object: Object, method_name: string, index: number) {
    getMetadataArgsStorage().params.push({
      type: 'next-function',
      object: object,
      method: method_name,
      index: index
    });
  };
}
