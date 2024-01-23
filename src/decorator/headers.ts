import { getMetadataArgsStorage } from "../metadata/builder";

export function Headers(): Function {
  return function (object: Object, method_name: string) {
    getMetadataArgsStorage().response_handlers.push({
      type: 'header',
      target: object.constructor,
      method: method_name,
    });
  };
}
