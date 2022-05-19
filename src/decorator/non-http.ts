import { getMetadataArgsStorage } from '../metadata/builder';

/**
 * Used to set specific HTTP status code when result returned by a controller action is equal to null.
 * Must be applied on a controller action.
 */
export function NonHttp(): Function {
  return function (object: Object, method_name: string) {
    getMetadataArgsStorage().response_handlers.push({
      type: 'non-http',
      target: object.constructor,
      method: method_name,
      value: true,
    });
  };
}
