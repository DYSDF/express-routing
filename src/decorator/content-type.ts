import { getMetadataArgsStorage } from "../metadata/builder";

/**
 * Sets response Content-Type.
 * Must be applied on a controller action.
 */
export function ContentType(content_type: string): Function {
  return function (object: Object, method_name: string) {
    getMetadataArgsStorage().response_handlers.push({
      type: 'content-type',
      target: object.constructor,
      method: method_name,
      value: content_type,
    });
  };
}
