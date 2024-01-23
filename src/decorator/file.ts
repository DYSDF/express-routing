import { getMetadataArgsStorage } from "../metadata/builder";

export function File(): Function {
  return function (object: Object, method_name: string, index: number) {
    getMetadataArgsStorage().params.push({
      type: 'file',
      object: object,
      method: method_name,
      index: index,
    });
  };
}
