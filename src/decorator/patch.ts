import { Route } from "./route";

export const Patch = (route: string | RegExp = ''): Function => Route(route, 'patch')
