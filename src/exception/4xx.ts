import HttpError from './http'

export class BadRequest extends HttpError {
  code: number = 400
}

export class NotFound extends HttpError {
  code: number = 404
}

export class NotAcceptable extends HttpError {
  code: number = 406;
}

export class Conflict extends HttpError {
  code: number = 409
}

export class Unauthorized extends HttpError {
  code: number = 401
  message: string = 'request is unauthorized'
}

export class Forbidden extends HttpError {
  code: number = 403
}

export class PayloadTooLarge extends HttpError {
  code: number = 413
}


export class InvalidParam extends BadRequest {
  constructor(value: any, parameter_name: string, parameter_type: string) {
    super(
      `Given parameter ${parameter_name} is invalid. Value (${JSON.stringify(
        value
      )}) cannot be parsed into ${parameter_type}.`
    );

    Object.setPrototypeOf(this, InvalidParam.prototype);
  }
}

export class ParameterParseJSON extends BadRequest {
  constructor(parameter_name: string, value: any) {
    super(`Given parameter ${parameter_name} is invalid. Value (${JSON.stringify(value)}) cannot be parsed into JSON.`);
    Object.setPrototypeOf(this, ParameterParseJSON.prototype);
  }
}
