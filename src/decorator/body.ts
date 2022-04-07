import { getMetadataArgsStorage } from "../metadata/builder";

export interface IBodyOptions {
  /**
   * Extra options to be passed to body-parser middleware.
   */
  options?: any;

  /**
   * Explicitly set type which should be used for Body to perform transformation.
   */
  type?: any;
}

/**
 * Allows to inject a request body value to the controller action parameter.
 * Must be applied on a controller action parameter.
 */
export function Body(options?: IBodyOptions): Function {
  return function (object: Object, method_name: string, index: number) {
    getMetadataArgsStorage().params.push({
      type: 'body',
      object: object,
      method: method_name,
      index: index,
      explicit_type: options ? options.type : undefined,
      options: options ? options.options : undefined,
    });
  };
}
