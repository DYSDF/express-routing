import { Route } from "./route";

/**
 * Registers an action to be executed when DELETE request comes on a given route.
 * Must be applied on a controller action.
 */
export const Delete = (route: string | RegExp = ''): Function => Route(route, 'delete')
