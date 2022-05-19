import { HttpError } from './http'

export class ServerError extends HttpError {
  code: number = 500
}
