export class HttpError extends Error {
  code: number
  status: string

  constructor(message?: string, code?: number, status?: string) {
    super(message)
    this.code = code || 500
    this.status = status || 'FAILED'
    this.stack = new Error().stack;
    Object.setPrototypeOf(this, HttpError.prototype)
  }

  toJSON(res: Response) {
    throw new Error('This method must be implemented')
  }
}
