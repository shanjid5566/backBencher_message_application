import Joi from 'joi';

// Validation for sending a plain text message
export const sendTextMessageSchema = Joi.object({
  body: Joi.string().trim().min(1).max(5000).required().messages({
    'string.empty': 'Message body cannot be empty',
    'any.required': 'Message body is required',
  }),
  conversationId: Joi.string().required().messages({
    'any.required': 'conversationId is required',
  }),
});

// Validation for sending a message with a file attachment
export const sendFileMessageSchema = Joi.object({
  body: Joi.string().max(5000).allow('').optional(),
  conversationId: Joi.string().required().messages({
    'any.required': 'conversationId is required',
  }),
});

// Validation for fetching messages with pagination parameters
export const messageQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  conversationId: Joi.string().required().messages({
    'any.required': 'conversationId is required to fetch history',
  }),
});