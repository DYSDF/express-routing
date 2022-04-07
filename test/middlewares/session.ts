import { NextFunction, Request, Response } from "express";
import { Middleware } from '../../src'

@Middleware()
export default class {
  use(req: Request, res: Response, next: NextFunction) {
    // @ts-ignore
    req['test_key'] = 'hello world'
    next()
  }
}
