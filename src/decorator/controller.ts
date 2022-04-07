import { getMetadataArgsStorage } from "../metadata/builder";

export function Controller(base_route: string = '', options?: { json: boolean }): Function {
  return function (object: Function) {
    getMetadataArgsStorage().controllers.push({
      type: options?.json ? 'json' : 'default',
      target: object,
      route: base_route
    });
  };
}
