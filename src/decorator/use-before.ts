import { getMetadataArgsStorage } from "../metadata/builder";

export function UseBefore(...middlewares: Array<Function>): Function;
export function UseBefore(...middlewares: Array<(request: any, response: any, next: Function) => any>): Function;
export function UseBefore(...middlewares: Array<Function | ((request: any, response: any, next: Function) => any)>): Function {
  return function (obj_or_func: Object | Function, method_name?: string) {
    middlewares.forEach(middleware => {
      getMetadataArgsStorage().uses.push({
        target: method_name ? obj_or_func.constructor : (obj_or_func as Function),
        method: method_name,
        middleware: middleware,
        after_action: false,
      });
    });
  };
}
