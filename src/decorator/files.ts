import { getMetadataArgsStorage } from "../metadata/builder";

export function Files(): Function {
  return function (object: Object, method_name: string, index: number) {
    getMetadataArgsStorage().params.push({
      type: 'files',
      object: object,
      method: method_name,
      index: index,
    });
  };
}
