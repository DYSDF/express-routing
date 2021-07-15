import { Route } from "./route";

/**
 * Registers an action to be executed when GET request comes on a given route.
 * Must be applied on a controller action.
 */
export const Get = (route: string | RegExp = ''): Function => Route(route, 'get')
