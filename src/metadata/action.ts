import { RoutingOptions } from "..";
import { Action } from "../action";
import { ControllerMetadata } from "./controller";
import { ParamMetadata } from "./param";
import { ResponseHandlerMetadata } from "./response";
import { UseMetadata } from "./use";

export type ActionType =
  | 'all'
  | 'checkout'
  | 'connect'
  | 'copy'
  | 'delete'
  | 'get'
  | 'head'
  | 'lock'
  | 'merge'
  | 'mkactivity'
  | 'mkcol'
  | 'move'
  | 'm-search'
  | 'notify'
  | 'options'
  | 'patch'
  | 'post'
  | 'propfind'
  | 'proppatch'
  | 'purge'
  | 'put'
  | 'report'
  | 'search'
  | 'subscribe'
  | 'trace'
  | 'unlock'
  | 'unsubscribe';

export interface IActionMetadataArgs {
  /**
   * Route to be registered for the action.
   */
  route: string | RegExp;

  /**
   * Class on which's method this action is attached.
   */
  target: Function;

  /**
   * Object's method that will be executed on this action.
   */
  method: string;

  /**
   * Action type represents http method used for the registered route. Can be one of the value defined in ActionTypes
   * class.
   */
  type: ActionType;

  /**
   * Params to be appended to the method call.
   */
  appendParams?: (action: Action) => any[];

  /**
   * Special function that will be called instead of orignal method of the target.
   */
  methodOverride?: (action_metadata: ActionMetadata, action: Action, params: any[]) => Promise<any> | any;

  /**
   * is not http response
   */
  no_result?: boolean
}

export class ActionMetadata {
  /**
   * Action's controller.
   */
  controller_metadata: ControllerMetadata;

  /**
   * Action's parameters.
   */
  params: ParamMetadata[] = [];

  /**
   * Action's use metadatas.
   */
  uses: UseMetadata[] = [];

  /**
   * Class on which's method this action is attached.
   */
  target: Function;

  /**
   * Object's method that will be executed on this action.
   */
  method: string;

  /**
   * Action type represents http method used for the registered route. Can be one of the value defined in ActionTypes
   * class.
   */
  type: ActionType;

  /**
   * Route to be registered for the action.
   */
  route: string | RegExp;

  /**
   * Full route to this action (includes controller base route).
   */
  full_route?: string | RegExp;

  /**
   * Indicates if this action uses Body.
   */
  is_body_used?: boolean;

  /**
   * Indicates if this action uses Uploaded File.
   */
  is_file_used?: boolean;

  /**
   * Indicates if this action uses Uploaded Files.
   */
  is_files_used?: boolean;

  /**
   * Indicates if controller of this action is json-typed.
   */
  is_json_typed?: boolean;

  /**
   * Indicates if this action return http result.
   */
  no_result?: boolean;

  /**
   * Http code to be used on undefined action returned content.
   */
  undefined_http_code?: number | Function;

  /**
   * Http code to be used on null action returned content.
   */
  null_http_code?: number | Function;

  /**
   * Http code to be set on successful response.
   */
  success_http_code?: number;

  /**
   * Specifies redirection url for this action.
   */
  redirect?: string;

  /**
   * Rendered template to be used for this controller action.
   */
  rendered_template?: string;

  /**
   * Response headers to be set.
   */
  headers?: { [name: string]: any };

  /**
   * Extra options used by @Body decorator.
   */
  body_parser_options: any;

  /**
   * Params to be appended to the method call.
   */
  appendParams?: (action: Action) => any[];

  /**
   * Special function that will be called instead of orignal method of the target.
   */
  methodOverride?: (action_metadata: ActionMetadata, action: Action, params: any[]) => Promise<any> | any;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(
    controller_metadata: ControllerMetadata,
    args: IActionMetadataArgs,
    private global_options: RoutingOptions
  ) {
    this.controller_metadata = controller_metadata;
    this.route = args.route;
    this.target = args.target;
    this.method = args.method;
    this.type = args.type;
    this.no_result = args.no_result;
    this.appendParams = args.appendParams;
    this.methodOverride = args.methodOverride;
  }

  /**
   * Appends base route to a given regexp route.
   */
  static appendBaseRoute(base_route: string, route: RegExp | string) {
    const prefix = `${base_route.length > 0 && base_route.indexOf('/') < 0 ? '/' : ''}${base_route}`;

    if (typeof route === 'string') return `${prefix}${route}`;

    if (!base_route || base_route === '') return route;

    const full_path = `^${prefix}${route.toString().substr(1)}?$`;

    return new RegExp(full_path, route.flags);
  }

  /**
   * Builds everything action metadata needs.
   * Action metadata can be used only after its build.
   */
  build(responseHandlers: ResponseHandlerMetadata[]) {
    const undefinedResultHandler = responseHandlers.find(handler => handler.type === 'on-undefined');
    const nullResultHandler = responseHandlers.find(handler => handler.type === 'on-null');
    const successCodeHandler = responseHandlers.find(handler => handler.type === 'success-code');
    const redirectHandler = responseHandlers.find(handler => handler.type === 'redirect');
    const renderedTemplateHandler = responseHandlers.find(handler => handler.type === 'rendered-template');
    const contentTypeHandler = responseHandlers.find(handler => handler.type === 'content-type');
    const bodyParam = this.params.find(param => param.type === 'body');

    this.undefined_http_code = undefinedResultHandler
      ? undefinedResultHandler.value
      : this.global_options.defaults && this.global_options.defaults.undefined_http_code;

    this.null_http_code = nullResultHandler
      ? nullResultHandler.value
      : this.global_options.defaults && this.global_options.defaults.null_http_code;

    if (successCodeHandler) this.success_http_code = successCodeHandler.value;
    if (redirectHandler) this.redirect = redirectHandler.value;
    if (renderedTemplateHandler) this.rendered_template = renderedTemplateHandler.value;

    this.body_parser_options = bodyParam ? bodyParam.options : undefined;
    this.is_body_used = !!this.params.find(param => param.type === 'body' || param.type === 'body-param');
    this.is_files_used = !!this.params.find(param => param.type === 'files');
    this.is_file_used = !!this.params.find(param => param.type === 'file');
    this.is_json_typed = contentTypeHandler !== undefined
      ? /json/.test(contentTypeHandler.value)
      : this.controller_metadata.type === 'json';
    this.full_route = this.buildFullRoute();
    this.headers = this.buildHeaders(responseHandlers);
  }

  /**
   * Calls action method.
   * Action method is an action defined in a user controller.
   */
  callMethod(params: any[], action: Action) {
    const controllerInstance = this.controller_metadata.getInstance(action);
    return controllerInstance[this.method].apply(controllerInstance, params);
  }

  /**
   * Builds full action route.
   */
  private buildFullRoute(): string | RegExp {
    if (this.route instanceof RegExp) {
      if (this.controller_metadata.route) {
        return ActionMetadata.appendBaseRoute(this.controller_metadata.route, this.route);
      }
      return this.route;
    }

    let path: string = '';
    if (this.controller_metadata.route) path += this.controller_metadata.route;
    if (this.route && typeof this.route === 'string') path += this.route;
    return path;
  }

  /**
   * Builds action response headers.
   */
  private buildHeaders(responseHandlers: ResponseHandlerMetadata[]) {
    const content_type_handler = responseHandlers.find(handler => handler.type === 'content-type');
    const location_handler = responseHandlers.find(handler => handler.type === 'location');

    const headers: { [name: string]: string } = {};
    if (location_handler) headers['Location'] = location_handler.value;

    if (content_type_handler) headers['Content-type'] = content_type_handler.value;

    const headerHandlers = responseHandlers.filter(handler => handler.type === 'header');
    if (headerHandlers) headerHandlers.map(handler => (headers[handler.value] = handler.secondary_value));

    return headers;
  }
}
