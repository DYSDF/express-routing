import { Express, NextFunction, Request, Response } from 'express'
import { BaseDriver } from './base'
import { MiddlewareMetadata, IExpressMiddleware, IExpressErrorMiddleware } from '../metadata/middleware'
import { ActionMetadata } from '../metadata/action'
import { isPromiseLike } from '../utils/promise'
import { Action } from '../action';
import { ParamMetadata } from '../metadata/param';
import { NotFound } from '../exception/4xx';
import { UseMetadata } from '../metadata/use';
import { getFromContainer } from '../container';

const ROUTING_STARTED = Symbol('routing controller started')

export class ExpressDriver extends BaseDriver {
  public express: Express

  constructor(express?: Express) {
    super();
    if (!express) {
      this.express = this.loadExpress()
    } else {
      this.express = express
    }
    this.app = this.express;
  }

  /**
   * Dynamically loads express module.
   */
  protected loadExpress(): Express {
    if (!require) throw new Error('Cannot load express. Try to install all required dependencies.');

    try {
      return require('express')();
    } catch (e) {
      throw new Error('express package was not found installed. Try to install it: npm install express --save');
    }
  }

  /**
   * Initializes the things driver needs before routes and middlewares registration.
   */
  initialize() {
    if (!this.cors) return
    const cors = this.loadCors();
    if (this.cors === true) {
      this.express!.use(cors());
    } else {
      this.express!.use(cors(this.cors));
    }
  }

  /**
   * Registers middleware that run before controller actions.
   */
  registerMiddleware(middleware: MiddlewareMetadata): void {
    let middleware_wrapper;

    // if its an error handler then register it with proper signature in express
    if ((middleware.instance as IExpressErrorMiddleware).error) {
      middleware_wrapper = (error: any, request: any, response: any, next: (err?: any) => any) => {
        (middleware.instance as IExpressErrorMiddleware).error(error, request, response, next);
      };
    }

    // if its a regular middleware then register it as express middleware
    else if ((middleware.instance as IExpressMiddleware).use) {
      middleware_wrapper = (request: Request, response: Response, next: NextFunction) => {
        try {
          const use_result = (middleware.instance as IExpressMiddleware).use(request, response, next);

          // handle process errors
          if (!isPromiseLike(use_result)) return
          use_result.catch((error: any) => {
            this.handleError(error, undefined, { request, response, next });
            return error;
          });
        } catch (error) {
          this.handleError(error, undefined, { request, response, next });
        }
      };
    }

    if (!middleware_wrapper) return

    // Name the function for better debugging
    Object.defineProperty(middleware_wrapper, 'name', {
      value: middleware.instance.constructor.name,
      writable: true,
    });
    this.express!.use(middleware_wrapper);
  }

  /**
   * Registers action in the driver.
   */
  registerAction(action_metadata: ActionMetadata, callback: (options: Action) => any): void {
    // middlewares required for this action
    const default_middlewares: any[] = [];

    if (action_metadata.is_body_used) {
      if (action_metadata.is_json_typed) {
        default_middlewares.push(this.loadBodyParser().json(action_metadata.body_parser_options));
      } else {
        default_middlewares.push(this.loadBodyParser().text(action_metadata.body_parser_options));
      }
    }

    if (action_metadata.is_file_used || action_metadata.is_files_used) {
      const multer = this.loadMulter();
      action_metadata.params
        .filter(param => param.type === 'file')
        .forEach(param => default_middlewares.push(multer(param.options).single(param.name)));
      action_metadata.params
        .filter(param => param.type === 'files')
        .forEach(param => default_middlewares.push(multer(param.options).array(param.name)));
    }

    // user used middlewares
    const uses = [...action_metadata.controller_metadata.uses, ...action_metadata.uses] as UseMetadata[];
    const before_middlewares = this.prepareMiddlewares(uses.filter(use => !use.after_action));
    const after_middlewares = this.prepareMiddlewares(uses.filter(use => use.after_action));

    // prepare route and route handler function
    const route_prefix = ActionMetadata.appendBaseRoute(this.prefix, action_metadata.full_route || '');
    const route_handler = (request: any, response: any, next: Function) => callback({ request, response, next });

    // This ensures that a request is only processed once to prevent unhandled rejections saying
    // "Can't set headers after they are sent"
    // Some examples of reasons a request may cause multiple route calls:
    // * Express calls the "get" route automatically when we call the "head" route:
    //   Reference: https://expressjs.com/en/4x/api.html#router.METHOD
    //   This causes a double execution on our side.
    // * Multiple routes match the request (e.g. GET /users/me matches both @All(/users/me) and @Get(/users/:id)).
    // The following middleware only starts an action processing if the request has not been processed before.
    const route_guard = (request: any, response: any, next: Function) => {
      if (request[ROUTING_STARTED]) return
      request[ROUTING_STARTED] = true;
      next();
    };

    // finally register action in express
    const action_type = action_metadata.type.toLowerCase();
    (this.express as any)[action_type](
      route_prefix,
      route_guard,
      ...default_middlewares,
      ...before_middlewares,
      route_handler,
      ...after_middlewares
    )
  }

  /**
   * Gets param from the request.
   */
  getParamFromRequest(action: Action, param_metadata: ParamMetadata): any {
    const request: any = action.request;
    switch (param_metadata.type) {
      case 'body':
        return request.body;

      case 'body-param':
        return request.body[param_metadata.name];

      case 'param':
        return request.params[param_metadata.name];

      case 'params':
        return request.params;

      case 'session-param':
        return request.session[param_metadata.name];

      case 'session':
        return request.session;

      case 'state':
        throw new Error('@State decorators are not supported by express driver.');

      case 'query':
        return request.query[param_metadata.name];

      case 'queries':
        return request.query;

      case 'header':
        return request.headers[param_metadata.name.toLowerCase()];

      case 'headers':
        return request.headers;

      case 'file':
        return request.file;

      case 'files':
        return request.files;

      case 'cookie':
        if (!request.headers.cookie) return;
        const cookies = require('cookie').parse(request.headers.cookie);
        return cookies[param_metadata.name];

      case 'cookies':
        if (!request.headers.cookie) return {};
        return require('cookie').parse(request.headers.cookie);
    }
  }

  /**
   * Handles result of successfully executed controller action.
   */
  handleSuccess(result: any, action_metadata: ActionMetadata, action: Action): void {
    // if the action returned the response object itself, short-circuits
    if (result && result === action.response) {
      action.next();
      return;
    }

    // set http status code
    if (result === undefined && action_metadata.undefined_http_code) {
      if (action_metadata.undefined_http_code instanceof Function) {
        throw new (action_metadata.undefined_http_code as any)(action);
      }
      action.response.status(action_metadata.undefined_http_code);
    } else if (result === null) {
      if (action_metadata.null_http_code) {
        if (action_metadata.null_http_code instanceof Function) {
          throw new (action_metadata.null_http_code as any)(action);
        }
        action.response.status(action_metadata.null_http_code);
      } else {
        action.response.status(204);
      }
    } else if (action_metadata.success_http_code) {
      action.response.status(action_metadata.success_http_code);
    }

    // apply http headers
    if (action_metadata.headers) {
      const headers = action_metadata.headers
      Object.keys(headers).forEach(name => {
        action.response.header(name, headers[name]);
      });
    }

    if (action_metadata.redirect) {
      // if redirect is set then do it
      if (typeof result === 'string') {
        action.response.redirect(result);
      } else if (result instanceof Object) {
        action.response.redirect(require('lodash').template(action_metadata.redirect)(result));
      } else {
        action.response.redirect(action_metadata.redirect);
      }
      action.next();

    } else if (action_metadata.rendered_template) {
      // if template is set then render it
      const render_params = result && result instanceof Object ? result : {};
      action.response.render(action_metadata.rendered_template, render_params, (err: any, html: string) => {
        if (err) return action.next(err);
        if (html) action.response.send(html)
        action.next();
      });

    } else if (result === undefined) {
      if (action_metadata.undefined_http_code) {
        if (action_metadata.is_json_typed) {
          action.response.json();
        } else {
          action.response.send();
        }
        action.next();
      }
      // throw NotFoundError on undefined response
      else {
        throw new NotFound();
      }

    } else if (result === null) {
      // send null response
      if (action_metadata.is_json_typed) {
        action.response.json(null);
      } else {
        action.response.send(null);
      }
      action.next();

    } else if (result instanceof Buffer) {
      // check if it's binary data (Buffer)
      action.response.end(result, 'binary');

    } else if (result instanceof Uint8Array) {
      // check if it's binary data (typed array)
      action.response.end(Buffer.from(result as any), 'binary');

    } else if (result.pipe instanceof Function) {
      result.pipe(action.response);

    } else {
      // send regular result
      if (action_metadata.is_json_typed) {
        action.response.json(result);
      } else {
        action.response.send(result);
      }
      action.next();
    }
  }

  /**
   * Handles result of failed executed controller action.
   */
  handleError(error: any, action_metadata: ActionMetadata | undefined, action: Action): any {
    if (this.enable_default_error_handler) {
      const response: any = action.response;

      // set http code
      // note that we can't use error instanceof HttpError properly anymore because of new typescript emit process
      if (error.code) {
        response.status(error.code);
      } else {
        response.status(500);
      }

      // apply http headers
      if (action_metadata?.headers) {
        const headers = action_metadata.headers
        Object.keys(headers).forEach(name => {
          response.header(name, headers[name]);
        });
      }

      // send error content
      if (action_metadata && action_metadata.is_json_typed) {
        response.json(this.processJsonError(error));
      } else {
        response.send(this.processTextError(error)); // todo: no need to do it because express by default does it
      }
    }
    action.next(error);
  }

  /**
   * Creates middlewares from the given "use"-s.
   */
  protected prepareMiddlewares(uses: UseMetadata[]) {
    const middlewares: Function[] = [];
    for (const use of uses) {
      // Inject with decorator
      if (use.middleware.prototype && use.middleware.prototype.use) {
        middlewares.push((request: any, response: any, next: (err: any) => any) => {
          try {
            const use_result = getFromContainer<IExpressMiddleware>(use.middleware)
              .use(request, response, next);
            if (isPromiseLike(use_result)) {
              use_result.catch((error: any) => {
                this.handleError(error, undefined, { request, response, next });
                return error;
              });
            }
            return use_result;
          } catch (error) {
            this.handleError(error, undefined, { request, response, next });
          }
        });
      } else if (use.middleware.prototype && use.middleware.prototype.error) {
        middlewares.push(function (error: any, request: any, response: any, next: (err: any) => any) {
          return getFromContainer<IExpressErrorMiddleware>(use.middleware)
            .error(error, request, response, next);
        });
      } else {
        middlewares.push(use.middleware);
      }
    }
    return middlewares;
  }

  /**
   * Dynamically loads body-parser module.
   */
  protected loadBodyParser() {
    try {
      return require('body-parser');
    } catch (e) {
      throw new Error('body-parser package was not found installed. Try to install it: npm install body-parser --save');
    }
  }

  /**
   * Dynamically loads multer module.
   */
  protected loadMulter() {
    try {
      return require('multer');
    } catch (e) {
      throw new Error('multer package was not found installed. Try to install it: npm install multer --save');
    }
  }

  /**
   * Dynamically loads cors module.
   */
  protected loadCors() {
    try {
      return require('cors')
    } catch (e) {
      throw new Error('cors package was not found installed. Try to install it: npm install cors --save')
    }
  }
}
