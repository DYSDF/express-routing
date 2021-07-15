import { Route } from "./route";

/**
 * Registers an action to be executed when POST request comes on a given route.
 * Must be applied on a controller action.
 */
export const Post = (route: string | RegExp = ''): Function => Route(route, 'post')
