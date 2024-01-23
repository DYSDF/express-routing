import { Route } from "./route";

export const Put = (route: string | RegExp = ''): Function => Route(route, 'put')
