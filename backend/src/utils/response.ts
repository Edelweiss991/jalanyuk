import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const ok = <T>(res: Response, data: T, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  } as ApiResponse<T>);
};

export const created = <T>(res: Response, data: T) => {
  return ok(res, data, 201);
};
