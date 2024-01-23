import { getMetadataArgsStorage } from "../metadata/builder";

export function Params(): Function {
  return function (object: Object, methodName: string, index: number) {
    getMetadataArgsStorage().params.push({
      type: 'params',
      object: object,
      method: methodName,
      index: index,
    });
  };
}
