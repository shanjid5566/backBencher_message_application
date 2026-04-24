import Joi from 'joi';

export const sendFileMessageSchema = Joi.object({
  body: Joi.string().max(5000).allow(''),
  senderId: Joi.string().required().messages({
    'any.required': 'senderId is required',
    'string.empty': 'senderId cannot be empty',
  }),
  conversationId: Joi.string().required().messages({
    'any.required': 'conversationId is required',
    'string.empty': 'conversationId cannot be empty',
  }),
});

export const messageQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  conversationId: Joi.string().optional(),
});
