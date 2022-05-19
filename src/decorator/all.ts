import { getMetadataArgsStorage } from "../metadata/builder";

export function All(route: string | RegExp = ''): Function {
  return function (object: Object, method_name: string) {
    getMetadataArgsStorage().actions.push({
      type: 'all',
      target: object.constructor,
      method: method_name,
      route: route,
    });
  };
}
