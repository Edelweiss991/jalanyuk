import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

type ValidateSource = 'body' | 'query' | 'params';

export const validate = (schema: ZodTypeAny, source: ValidateSource = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      req[source] = await schema.parseAsync(data);
      next();
    } catch (error) {
      next(error);
    }
  };
};
