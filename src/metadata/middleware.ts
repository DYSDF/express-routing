import { getFromContainer } from "../container";

export interface IMiddlewareMetadataArgs {
  /**
   * Object class of the middleware class.
   */
  target: Function;

  /**
   * Indicates if this middleware is global, thous applied to all routes.
   */
  global: boolean;

  /**
   * Execution priority of the middleware.
   */
  priority: number;

  /**
   * Indicates if middleware must be executed after routing action is executed.
   */
  type: 'before' | 'after';
}

export interface IExpressMiddleware {
  /**
   * Called before controller action is being executed.
   * This signature is used for Express Middlewares.
   */
  use(request: any, response: any, next: (err?: any) => any): any;
}

export interface IExpressErrorMiddleware {
  /**
   * Called before response.send is being called. The data passed to method is the data passed to .send method.
   * Note that you must return same (or changed) data and it will be passed to .send method.
   */
  error(error: any, request: any, response: any, next: (err?: any) => any): void;
}

export class MiddlewareMetadata {
  /**
   * Indicates if this middleware is global, thous applied to all routes.
   */
  global: boolean;

  /**
   * Object class of the middleware class.
   */
  target: Function;

  /**
   * Execution priority of the middleware.
   */
  priority: number;

  /**
   * Indicates if middleware must be executed after routing action is executed.
   */
  type: 'before' | 'after';

  constructor(args: IMiddlewareMetadataArgs) {
    this.global = args.global;
    this.target = args.target;
    this.priority = args.priority;
    this.type = args.type;
  }

  /**
   * Gets middleware instance from the container.
   */
  get instance(): IExpressMiddleware | IExpressErrorMiddleware {
    return getFromContainer<IExpressMiddleware | IExpressErrorMiddleware>(this.target);
  }
}
