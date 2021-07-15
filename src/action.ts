/**
 * Controller action properties.
 */
export interface Action {
  /**
   * Action Request object.
   */
  request: any;

  /**
   * Action Response object.
   */
  response: any;

  /**
   * "Next" function used to call next middleware.
   */
  next: Function;
}
