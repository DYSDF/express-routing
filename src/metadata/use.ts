export interface IUseMetadataArgs {
  /**
   * Object class of this "use".
   */
  target: Function;

  /**
   * Method to which this "use" is applied.
   * If method is not given it means "use" is used on the controller. Then "use" applied to all controller's actions.
   */
  method?: string;

  /**
   * Middleware to be executed for this "use".
   */
  middleware: Function;

  /**
   * Indicates if middleware must be executed after routing action is executed.
   */
  after_action: boolean;
}

export class UseMetadata {
  /**
   * Object class of the middleware class.
   */
  target: Function;

  /**
   * Method used by this "use".
   */
  method: string;

  /**
   * Middleware to be executed by this "use".
   */
  middleware: Function;

  /**
   * Indicates if middleware must be executed after routing action is executed.
   */
  after_action: boolean;

  constructor(args: IUseMetadataArgs) {
    this.target = args.target;
    this.method = args.method || 'get';
    this.middleware = args.middleware;
    this.after_action = args.after_action;
  }
}
