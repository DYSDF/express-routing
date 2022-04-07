import { Action } from "../action";
import { ActionMetadata } from "./action";

export type ParamType =
  | 'body'
  | 'body-param'
  | 'query'
  | 'queries'
  | 'header'
  | 'headers'
  | 'file'
  | 'files'
  | 'param'
  | 'params'
  | 'session'
  | 'session-param'
  | 'state'
  | 'cookie'
  | 'cookies'
  | 'request'
  | 'response'
  | 'context'
  | 'current-user'
  | 'custom-converter';

export interface IParamMetadataArgs {
  /**
   * Parameter object.
   */
  object: any;

  /**
   * Method on which's parameter is attached.
   */
  method: string;

  /**
   * Index (# number) of the parameter in the method signature.
   */
  index: number;

  /**
   * Parameter type.
   */
  type: ParamType;

  /**
   * Parameter name.
   */
  name?: string;

  /**
   * Parameter options.
   */
  options?: any;

  /**
   * Explicitly set type which should be used for Body to perform transformation.
   */
  explicit_type?: any;

  /**
   * Explicitly tell that the QueryParam is an array to force routing-controller to cast it
   */
  is_array?: boolean;
}

export class ParamMetadata {
  /**
   * Parameter's action.
   */
  action_metadata: ActionMetadata;

  /**
   * Object on which's method's parameter this parameter is attached.
   */
  object: any;

  /**
   * Method on which's parameter is attached.
   */
  method: string;

  /**
   * Index (# number) of the parameter in the method signature.
   */
  index: number;

  /**
   * Parameter type.
   */
  type: ParamType;

  /**
   * Parameter name.
   */
  name: string;

  /**
   * Parameter target type.
   */
  target_type?: any;

  /**
   * Parameter target type's name in lowercase.
   */
  target_name: string = '';

  /**
   * Indicates if target type is an object.
   */
  is_target_object: boolean = false;

  /**
   * Parameter target.
   */
  target: any;

  /**
   * If true, string values are cast to arrays
   */
  is_array?: boolean;

  /**
   * Additional parameter options.
   * For example it can be uploader middleware options or body-parser middleware options.
   */
  options: any;

  constructor(action_metadata: ActionMetadata, args: IParamMetadataArgs) {
    this.action_metadata = action_metadata;
    this.target = args.object.constructor;
    this.method = args.method;
    this.options = args.options;
    this.index = args.index;
    this.type = args.type;
    this.name = args.name || '__undefined__';
    this.is_array = args.is_array;

    if (args.explicit_type) {
      this.target_type = args.explicit_type;
    } else {
      const ParamTypes = (Reflect as any).getMetadata('design:paramtypes', args.object, args.method);
      if (typeof ParamTypes !== 'undefined') {
        this.target_type = ParamTypes[args.index];
      }
    }

    if (this.target_type) {
      if (this.target_type instanceof Function && this.target_type.name) {
        this.target_name = this.target_type.name.toLowerCase();
      } else if (typeof this.target_type === 'string') {
        this.target_name = this.target_type.toLowerCase();
      }
      this.is_target_object = this.target_type instanceof Function || this.target_type.toLowerCase() === 'object';
    }
  }
}
