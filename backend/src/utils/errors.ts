export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const badRequest = (code: string, message: string) => {
  return new AppError(400, code, message);
};

export const unauthorized = (code: string = 'UNAUTHORIZED', message: string = 'Unauthorized') => {
  return new AppError(401, code, message);
};

export const forbidden = (code: string = 'FORBIDDEN', message: string = 'Forbidden') => {
  return new AppError(403, code, message);
};

export const notFound = (code: string, message: string) => {
  return new AppError(404, code, message);
};

export const conflict = (code: string, message: string) => {
  return new AppError(409, code, message);
};
