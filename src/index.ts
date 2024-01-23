import { Express } from 'express'
import { Controller } from "./controller"
import { BaseDriver } from "./driver/base"
import { ExpressDriver } from "./driver/express"
import { importFromDirectories } from "./utils/module"

export interface RoutingOptions {
  /**
   * Indicates if development mode is enabled.
   * By default its enabled if your NODE_ENV is not equal to "production".
   */
  development?: boolean

   /**
   * Indicates if default routing-controller's error handler is enabled or not.
   * Enabled by default.
   */
  default_error_handler?: boolean;

  /**
   * global route prefix, eg: "/api"
   */
  prefix?: string

  /**
   * List of controllers to register in the framework or directories from where to import all your controllers.
   */
  controllers?: Function[] | string[]

  /**
   * List of middlewares to register in the framework or directories from where to import all your middlewares.
   */
  middlewares?: Function[] | string[]

  /**
   * Indicates if cors are enabled.
   * This requires installation of additional module (cors for express and kcors for koa).
   */
  cors?: boolean | Object;

  /**
   * Default settings
   */
  defaults?: {
    /**
     * If set, all null responses will return specified status code by default
     */
    null_http_code?: number;

    /**
     * If set, all undefined responses will return specified status code by default
     */
    undefined_http_code?: number;

    /**
     * Default param options
     */
    param_options?: {
      /**
       * If true, all non-set parameters will be required by default
       */
      required?: boolean;
    };
  };
}

function createExecutor<T extends BaseDriver>(driver: T, options: RoutingOptions = {}): void {
  // import all controllers
  let controller_classes: Function[] = [];
  if (options && options.controllers && options.controllers.length) {
    controller_classes = (options.controllers as any[]).filter(controller => controller instanceof Function);
    const controller_dirs = (options.controllers as any[]).filter(controller => typeof controller === 'string');
    controller_classes.push(...importFromDirectories(controller_dirs));
  }

  // import all middlewares
  let middleware_classes: Function[] = [];
  if (options && options.middlewares && options.middlewares.length) {
    middleware_classes = (options.middlewares as any[]).filter(controller => controller instanceof Function);
    const middleware_dirs = (options.middlewares as any[]).filter(controller => typeof controller === 'string');
    middleware_classes.push(...importFromDirectories(middleware_dirs));
  }

  if (options && options.development !== undefined) {
    driver.development = options.development;
  } else {
    driver.development = process.env.NODE_ENV !== 'production';
  }

  // default error handler
  if (options.default_error_handler !== undefined) {
    driver.enable_default_error_handler = options.default_error_handler;
  } else {
    driver.enable_default_error_handler = true;
  }

  if (options.prefix !== undefined) driver.prefix = options.prefix;

  driver.cors = options.cors;

  new Controller(driver, options)
    .initialize()
    .registerMiddlewares('before', middleware_classes)
    .registerControllers(controller_classes)
    .registerMiddlewares('after', middleware_classes);
}

export function createServer(options?: RoutingOptions): any
export function createServer(app: Express, options?: RoutingOptions): any
export function createServer(app?: Express | RoutingOptions, options?: RoutingOptions): any {
  if (typeof app !== 'function') {
    options = app
    app = undefined as any
  }
  const driver = new ExpressDriver(app as Express)
  createExecutor(driver, options)
  return driver.app
}

/**
 * decorators
 */
export * from './decorator/all'
export * from './decorator/body-param'
export * from './decorator/body'
export * from './decorator/content-type'
export * from './decorator/controller'
export * from './decorator/delete'
export * from './decorator/get'
export * from './decorator/header'
export * from './decorator/headers'
export * from './decorator/middleware'
export * from './decorator/next'
export * from './decorator/non-http'
export * from './decorator/on-null'
export * from './decorator/on-undefined'
export * from './decorator/param'
export * from './decorator/params'
export * from './decorator/patch'
export * from './decorator/post'
export * from './decorator/put'
export * from './decorator/queries'
export * from './decorator/query'
export * from './decorator/req'
export * from './decorator/res'
export * from './decorator/route'
export * from './decorator/use-after'
export * from './decorator/use-before'

/**
 * HttpError
 */
export * from './exception/http'
export * from './exception/4xx'
export * from './exception/5xx'
