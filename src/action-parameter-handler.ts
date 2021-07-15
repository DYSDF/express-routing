import { Action } from "./action";
import { BaseDriver } from "./driver/base";
import { InvalidParam, ParameterParseJSON } from "./exception/4xx";
import { ParamMetadata } from "./metadata/param";
import { isPromiseLike } from "./utils/promise";

export class ActionParameterHandler<T extends BaseDriver> {
  constructor(private driver: T) {}

  /**
   * Handles action parameter.
   */
  handle(action: Action, param: ParamMetadata): Promise<any> | any {
    if (param.type === 'request') return action.request;

    if (param.type === 'response') return action.response;

    // get parameter value from request and normalize it
    const value = this.normalizeParamValue(this.driver.getParamFromRequest(action, param), param);

    if (isPromiseLike(value)) return value.then(value => this.handleValue(value, action, param));

    return this.handleValue(value, action, param);
  }

  /**
   * Handles non-promise value.
   */
  protected handleValue(value: any, action: Action, param: ParamMetadata): Promise<any> | any {
    return value;
  }

  /**
   * Normalizes parameter value.
   */
  protected async normalizeParamValue(value: any, param_metadata: ParamMetadata): Promise<any> {
    if (value === null || value === undefined) return value;

    const need_normalize =
      typeof value === 'object' && ['queries', 'headers', 'params', 'cookies'].includes(param_metadata.type);
    const is_target_primitive = ['number', 'string', 'boolean'].includes(param_metadata.target_name);
    const is_transformation_needed = param_metadata.is_target_object && param_metadata.type !== 'param';

    // if param value is an object and param type match, normalize its string properties
    if (need_normalize) {
      await Promise.all(Object.keys(value).map(async key => {
        const key_value = value[key];
        if (typeof key_value === 'string') {
          const param_type: Function | undefined = (Reflect as any).getMetadata(
            'design:type',
            param_metadata.target_type.prototype,
            key
          );
          if (param_type) {
            const type_string = param_type.name.toLowerCase();
            value[key] = await this.normalizeParamValue(key_value, {
              ...param_metadata,
              name: key,
              target_type: param_type,
              target_name: type_string,
            });
          }
        }
      }));
    }

    // if value is a string, normalize it to demanded type
    else if (typeof value === 'string') {
      switch (param_metadata.target_name) {
        case 'number':
        case 'string':
        case 'boolean':
        case 'date':
          const normalized_value = this.normalizeStringValue(value, param_metadata.name, param_metadata.target_name);
          return param_metadata.is_array ? [normalized_value] : normalized_value;
        case 'array':
          return [value];
      }
    } else if (Array.isArray(value)) {
      return value.map(v => this.normalizeStringValue(v, param_metadata.name, param_metadata.target_name));
    }

    // if target type is not primitive, transform and validate it
    if (!is_target_primitive && is_transformation_needed) {
      value = this.parseValue(value, param_metadata);
    }

    return value;
  }

  /**
   * Normalizes string value to number or boolean.
   */
  protected normalizeStringValue(value: string, parameter_name: string, parameterType: string) {
    switch (parameterType) {
      case 'number':
        if (value === '') {
          throw new InvalidParam(value, parameter_name, parameterType);
        }

        const valueNumber = +value;
        if (Number.isNaN(valueNumber)) {
          throw new InvalidParam(value, parameter_name, parameterType);
        }

        return valueNumber;

      case 'boolean':
        if (value === 'true' || value === '1' || value === '') {
          return true;
        } else if (value === 'false' || value === '0') {
          return false;
        } else {
          throw new InvalidParam(value, parameter_name, parameterType);
        }

      case 'date':
        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) {
          throw new InvalidParam(value, parameter_name, parameterType);
        }
        return parsedDate;

      case 'string':
      default:
        return value;
    }
  }

  /**
   * Parses string value into a JSON object.
   */
  protected parseValue(value: any, param_metadata: ParamMetadata): any {
    if (typeof value === 'string') {
      if (['queries', 'query'].includes(param_metadata.type) && param_metadata.target_name === 'array') {
        return [value];
      } else {
        try {
          return JSON.parse(value);
        } catch (error) {
          throw new ParameterParseJSON(param_metadata.name, value);
        }
      }
    }
    return value;
  }
}
