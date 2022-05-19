import { merge } from 'lodash'
import { Action } from '../action';
import { HttpError } from '../exception/http';
import { ActionMetadata } from '../metadata/action';
import { MiddlewareMetadata } from '../metadata/middleware'
import { ParamMetadata } from '../metadata/param';

export abstract class BaseDriver {
  /**
   * Indicates if routing-controllers should operate in development mode.
   */
  development?: boolean;

  /**
   * Reference to the underlying framework app object.
   */
  app: any;

  /**
   * global app prefix
   */
  prefix: string = '';

  /**
   * Indicates if cors are enabled.
   * This requires installation of additional module (cors for express and kcors for koa).
   */
  cors?: boolean | Object;

  /**
   * Indicates if default routing-controllers error handler should be used or not.
   */
  enable_default_error_handler: boolean = true;

  /**
   * Map of error overrides.
   */
  error_overriding_map: { [key: string]: any } = {};

  /**
   * Initializes the things driver needs before routes and middleware registration.
   */
  abstract initialize(): void;

  /**
   * Registers given middleware.
   */
  abstract registerMiddleware(middleware: MiddlewareMetadata): void;

  /**
   * Registers action in the driver.
   */
  abstract registerAction(action: ActionMetadata, executeCallback: (options: Action) => any): void;

  /**
   * Gets param from the request.
   */
  abstract getParamFromRequest(actionOptions: Action, param: ParamMetadata): any;

  /**
   * handle json typed error
   * @param error
   * @returns
   */
  protected processJsonError(error: any) {
    if (!this.enable_default_error_handler) return error;

    if (typeof error.toJSON === 'function') return error.toJSON();

    let processed_error: any = {};
    if (error instanceof Error) {
      const name = error.name && error.name !== 'Error' ? error.name : error.constructor.name;
      processed_error.name = name;

      if (error.message) processed_error.message = error.message;
      if (error.stack && this.development) processed_error.stack = error.stack;

      Object.keys(error).filter(key =>
        key !== 'stack' &&
        key !== 'name' &&
        key !== 'message' &&
        (!(error instanceof HttpError) || key !== 'code')
      ).forEach(key => (processed_error[key] = (error as any)[key]));

      if (this.error_overriding_map)
        Object.keys(this.error_overriding_map)
          .filter(key => name === key)
          .forEach(key => (processed_error = merge(processed_error, this.error_overriding_map[key])));

      return Object.keys(processed_error).length > 0 ? processed_error : undefined;
    }

    return error;
  }

  /**
   * handle text typed error
   * @param error
   * @returns
   */
  protected processTextError(error: any) {
    if (!this.enable_default_error_handler) return error;

    if (error instanceof Error) {
      if (this.development && error.stack) {
        return error.stack;
      } else if (error.message) {
        return error.message;
      }
    }
    return error;
  }

  /**
   * Defines an algorithm of how to handle error during executing controller action.
   */
  abstract handleError(error: any, action: ActionMetadata, options: Action): any;

  /**
   * Defines an algorithm of how to handle success result of executing controller action.
   */
  abstract handleSuccess(result: any, action: ActionMetadata, options: Action): void;
}
