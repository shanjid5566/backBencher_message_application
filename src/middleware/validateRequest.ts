import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import AppError from '../utils/AppError';

type ValidationSource = 'body' | 'query' | 'params';

export const validateRequest = (schema: Joi.ObjectSchema, source: ValidationSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join(', ');
      return next(new AppError(400, messages));
    }

    // Replace the original data with validated data
    req[source] = value;
    next();
  };
};
