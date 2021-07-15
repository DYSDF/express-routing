import { Action } from "../action";
import { getFromContainer } from "../container";
import { ActionMetadata } from "./action";
import { UseMetadata } from "./use";

export interface IControllerMetadataArgs {
  /**
   * Indicates object which is used by this controller.
   */
  target: Function;

  /**
   * Base route for all actions registered in this controller.
   */
  route: string;

  /**
   * Controller type. Can be default or json-typed. Json-typed controllers operate with json requests and responses.
   */
  type: 'default' | 'json';
}

export class ControllerMetadata {
  /**
   * Controller actions.
   */
  actions: ActionMetadata[] = [];

  /**
   * Indicates object which is used by this controller.
   */
  target: Function;

  /**
   * Base route for all actions registered in this controller.
   */
  route: string;

  /**
   * Controller type. Can be default or json-typed. Json-typed controllers operate with json requests and responses.
   */
  type: 'default' | 'json';

  /**
   * Middleware "use"-s applied to a whole controller.
   */
  uses: UseMetadata[] = [];

  constructor(args: IControllerMetadataArgs) {
    this.target = args.target;
    this.route = args.route;
    this.type = args.type;
  }

  /**
   * Gets instance of the controller.
   * @param action Details around the request session
   */
  getInstance(action: Action): any {
    return getFromContainer(this.target, action);
  }
}
