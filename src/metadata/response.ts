export type ResponseHandlerType =
  | 'success-code'
  | 'error-code'
  | 'content-type'
  | 'header'
  | 'rendered-template'
  | 'redirect'
  | 'location'
  | 'on-null'
  | 'on-undefined'
  | 'non-http';

export interface IResponseHandlerMetadataArgs {
  /**
   * Class on which's method decorator is set.
   */
  target: Function;

  /**
   * Method on which decorator is set.
   */
  method: string;

  /**
   * Property type. See ResponsePropertyMetadataType for possible values.
   */
  type: ResponseHandlerType;

  /**
   * Property value. Can be status code, content-type, header name, template name, etc.
   */
  value?: any;

  /**
   * Secondary property value. Can be header value for example.
   */
  secondary_value?: any;
}

export class ResponseHandlerMetadata {
  /**
   * Class on which's method decorator is set.
   */
  target: Function;

  /**
   * Method on which decorator is set.
   */
  method: string;

  /**
   * Property type. See ResponsePropertyMetadataType for possible values.
   */
  type: ResponseHandlerType;

  /**
   * Property value. Can be status code, content-type, header name, template name, etc.
   */
  value: any;

  /**
   * Secondary property value. Can be header value for example.
   */
  secondary_value: any;

  constructor(args: IResponseHandlerMetadataArgs) {
    this.target = args.target;
    this.method = args.method;
    this.type = args.type;
    this.value = args.value;
    this.secondary_value = args.secondary_value;
  }
}
