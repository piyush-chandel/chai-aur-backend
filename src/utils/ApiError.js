class ApiError extends Error {
  constructor(
    message = "Something wwent wrong",
    statusCode,
    errors = [],
    stack = ""
  ) {
    super();
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;

    if (stack) this.stack = stack;
    else Error.captureStackTrace(this, this.constructor);
  }
}

export {ApiError};
