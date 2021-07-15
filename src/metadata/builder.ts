import { RoutingOptions } from "..";
import { ActionMetadata, IActionMetadataArgs } from "./action";
import { ControllerMetadata, IControllerMetadataArgs } from "./controller";
import { IMiddlewareMetadataArgs, MiddlewareMetadata } from "./middleware";
import { IParamMetadataArgs, ParamMetadata } from "./param";
import { IResponseHandlerMetadataArgs, ResponseHandlerMetadata } from "./response";
import { IUseMetadataArgs, UseMetadata } from "./use";

const METADATA_ARGS_STORAGE = Symbol('global routing metadata args storage')

export function getMetadataArgsStorage(): MetadataArgsStorage {
  if (!(global as any)[METADATA_ARGS_STORAGE])
    (global as any)[METADATA_ARGS_STORAGE] = new MetadataArgsStorage();

  return (global as any)[METADATA_ARGS_STORAGE];
}

export class MetadataArgsStorage {
  /**
   * Registered controller metadata args.
   */
  controllers: IControllerMetadataArgs[] = [];

  /**
   * Registered middleware metadata args.
   */
  middlewares: IMiddlewareMetadataArgs[] = [];

  /**
   * Registered "use middleware" metadata args.
   */
  uses: IUseMetadataArgs[] = [];

  /**
   * Registered action metadata args.
   */
  actions: IActionMetadataArgs[] = [];

  /**
   * Registered param metadata args.
   */
  params: IParamMetadataArgs[] = [];

  /**
   * Registered response handler metadata args.
   */
  response_handlers: IResponseHandlerMetadataArgs[] = [];

  /**
   * Filters registered middlewares by a given classes.
   */
  filterMiddlewareMetadatasForClasses(classes: Function[]): IMiddlewareMetadataArgs[] {
    return this.middlewares.filter(mid => classes.find(cls => cls === mid.target))
  }

  /**
   * Filters registered controllers by a given classes.
   */
  filterControllerMetadatasForClasses(classes: Function[]): IControllerMetadataArgs[] {
    return this.controllers.filter(ctrl => classes.find(cls => ctrl.target === cls));
  }

  /**
   * Filters registered actions by a given classes.
   */
  filterActionsWithTarget(target: Function): IActionMetadataArgs[] {
    return this.actions.filter(action => action.target === target);
  }

  /**
   * Filters registered "use middlewares" by a given target class and method name.
   */
  filterUsesWithTargetAndMethod(target: Function, method_name: string | undefined): IUseMetadataArgs[] {
    return this.uses.filter(use => use.target === target && use.method === method_name);
  }

  /**
   * Filters parameters by a given classes.
   */
  filterParamsWithTargetAndMethod(target: Function, methodName: string): IParamMetadataArgs[] {
    return this.params.filter(param => {
      return param.object.constructor === target && param.method === methodName;
    });
  }

  /**
   * Filters response handlers by a given class.
   */
  filterResponseHandlersWithTarget(target: Function): IResponseHandlerMetadataArgs[] {
    return this.response_handlers.filter(property => {
      return property.target === target;
    });
  }

  /**
   * Filters response handlers by a given classes.
   */
  filterResponseHandlersWithTargetAndMethod(target: Function, methodName: string): IResponseHandlerMetadataArgs[] {
    return this.response_handlers.filter(property => {
      return property.target === target && property.method === methodName;
    });
  }

  /**
   * Removes all saved metadata.
   */
  reset() {
    this.controllers = [];
    this.middlewares = [];
    this.uses = [];
    this.actions = [];
    this.params = [];
    this.response_handlers = [];
  }
}

export class MetadataBuilder {
  constructor(private options: RoutingOptions) {}

  /**
   * Builds controller metadata from a registered controller metadata args.
   */
  buildControllerMetadata(classes?: Function[]): ControllerMetadata[] {
    return this.createControllers(classes);
  }

  /**
   * Builds middleware metadata from a registered middleware metadata args.
   */
  buildMiddlewareMetadata(classes?: Function[]): MiddlewareMetadata[] {
    return this.createMiddlewares(classes);
  }

  /**
   * Creates middleware metadatas.
   */
  protected createMiddlewares(classes?: Function[]): MiddlewareMetadata[] {
    const middlewares = !classes
      ? getMetadataArgsStorage().middlewares
      : getMetadataArgsStorage().filterMiddlewareMetadatasForClasses(classes);
    return middlewares.map(middlewareArgs => new MiddlewareMetadata(middlewareArgs));
  }

  /**
   * Creates controller metadatas.
   */
  protected createControllers(classes?: Function[]): ControllerMetadata[] {
    const controllers = !classes
      ? getMetadataArgsStorage().controllers
      : getMetadataArgsStorage().filterControllerMetadatasForClasses(classes);
    return controllers.map(controllerArgs => {
      const controller = new ControllerMetadata(controllerArgs);
      controller.actions = this.createActions(controller);
      controller.uses = this.createControllerUses(controller);
      return controller;
    });
  }

  /**
   * Creates action metadatas.
   */
  protected createActions(controller: ControllerMetadata): ActionMetadata[] {
    let target = controller.target;
    const actions_with_target: IActionMetadataArgs[] = [];
    while (target) {
      const actions = getMetadataArgsStorage()
        .filterActionsWithTarget(target)
        .filter(action => actions_with_target.map(a => a.method).indexOf(action.method) === -1);

      actions.forEach(a => {
        a.target = controller.target;
        actions_with_target.push(a);
      });

      target = Object.getPrototypeOf(target);
    }

    return actions_with_target.map(actionArgs => {
      const action = new ActionMetadata(controller, actionArgs, this.options);
      action.params = this.createParams(action);
      action.uses = this.createActionUses(action);
      action.build(this.createActionResponseHandlers(action));
      return action;
    });
  }

  /**
   * Creates param metadatas.
   */
  protected createParams(action: ActionMetadata): ParamMetadata[] {
    return getMetadataArgsStorage()
      .filterParamsWithTargetAndMethod(action.target, action.method)
      .map(paramArgs => new ParamMetadata(action, this.decorateDefaultParamOptions(paramArgs)));
  }

  /**
   * Creates response handler metadatas for action.
   */
  protected createActionResponseHandlers(action: ActionMetadata): ResponseHandlerMetadata[] {
    return getMetadataArgsStorage()
      .filterResponseHandlersWithTargetAndMethod(action.target, action.method)
      .map(handlerArgs => new ResponseHandlerMetadata(handlerArgs));
  }

  /**
   * Creates response handler metadatas for controller.
   */
  protected createControllerResponseHandlers(controller: ControllerMetadata): ResponseHandlerMetadata[] {
    return getMetadataArgsStorage()
      .filterResponseHandlersWithTarget(controller.target)
      .map(handlerArgs => new ResponseHandlerMetadata(handlerArgs));
  }

  /**
   * Creates use metadatas for actions.
   */
  protected createActionUses(action: ActionMetadata): UseMetadata[] {
    return getMetadataArgsStorage()
      .filterUsesWithTargetAndMethod(action.target, action.method)
      .map(useArgs => new UseMetadata(useArgs));
  }

  /**
   * Creates use metadatas for controllers.
   */
  protected createControllerUses(controller: ControllerMetadata): UseMetadata[] {
    return getMetadataArgsStorage()
      .filterUsesWithTargetAndMethod(controller.target, undefined)
      .map(useArgs => new UseMetadata(useArgs));
  }

  /**
   * Decorate paramArgs with default settings
   */
  private decorateDefaultParamOptions(param_args: IParamMetadataArgs) {
    const options = this.options.defaults && this.options.defaults.param_options;
    if (!options) return param_args;
    return param_args;
  }
}
