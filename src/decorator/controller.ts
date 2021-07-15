import { getMetadataArgsStorage } from "../metadata/builder";

export function Controller(base_route: string = ''): Function {
  return function (object: Function) {
    getMetadataArgsStorage().controllers.push({
      type: 'default',
      target: object,
      route: base_route
    });
  };
}
