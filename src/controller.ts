import { RoutingOptions } from '.';
import { Action } from './action';
import { ActionParameterHandler } from './action-parameter-handler';
import { BaseDriver } from './driver/base';
import { ActionMetadata } from './metadata/action';
import { MetadataBuilder } from './metadata/builder';
import { isPromiseLike } from './utils/promise';

export class Controller<T extends BaseDriver> {
  /**
   * Used to check and handle controller action parameters.
   */
  private parameter_handler: ActionParameterHandler<T>;

  /**
   * Used to build metadata objects for controllers and middlewares.
   */
  private metadata_builder: MetadataBuilder;

  constructor(private driver: T, private options: RoutingOptions) {
    this.parameter_handler = new ActionParameterHandler(driver);
    this.metadata_builder = new MetadataBuilder(options);
  }

  /**
   * Initializes the things driver needs before routes and middleware registration.
   */
  initialize(): this {
    this.driver.initialize();
    return this;
  }

  /**
   * Registers all given controllers and actions from those controllers.
   */
  registerControllers(classes?: Function[]): this {
    const controllers = this.metadata_builder.buildControllerMetadata(classes);
    controllers.forEach(controller => {
      controller.actions.forEach(action_metadata => {
        this.driver.registerAction(action_metadata, (action: Action) => {
          return this.executeAction(action_metadata, action);
        });
      });
    });
    return this;
  }

  /**
   * Registers post-execution middlewares in the driver.
   */
  registerMiddlewares(type: 'before' | 'after', classes?: Function[]): this {
    this.metadata_builder
      .buildMiddlewareMetadata(classes)
      .filter(middleware => middleware.global && middleware.type === type)
      .sort((mid1, mid2) => mid2.priority - mid1.priority)
      .forEach(middleware => this.driver.registerMiddleware(middleware));

    return this;
  }

  /**
   * Executes given controller action.
   */
  protected async executeAction(action_metadata: ActionMetadata, action: Action) {
    // compute all parameters
    const params_promises = action_metadata.params
      .sort((p1, p2) => p1.index - p2.index)
      .map(param => this.parameter_handler.handle(action, param));

    // after all parameters are computed
    try {
      const params = await Promise.all(params_promises);
      // execute action and handle result
      const all_params = action_metadata.appendParams
        ? action_metadata.appendParams(action).concat(params)
        : params;
      const result = action_metadata.methodOverride
        ? action_metadata.methodOverride(action_metadata, action, all_params)
        : action_metadata.callMethod(all_params, action);
      return this.handleCallMethodResult(result, action_metadata, action);
    } catch (error) {
      return this.driver.handleError(error, action_metadata, action);
    }
  }

  /**
   * Handles result of the action method execution.
   */
  protected handleCallMethodResult(result: any, action: ActionMetadata, options: Action): any {
    if (isPromiseLike(result)) {
      return result.then((data: any) => {
        return this.handleCallMethodResult(data, action, options);
      }).catch((error: any) => {
        return this.driver.handleError(error, action, options);
      });
    } else {
      return this.driver.handleSuccess(result, action, options);
    }
  }
}
