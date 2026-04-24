import Joi from 'joi';

// Schema for sending a text message
export const sendTextMessageSchema = Joi.object({
  body: Joi.string().trim().min(1).max(5000).required().messages({
    'string.empty': 'Message body cannot be empty',
    'any.required': 'Message body is required',
  }),
  conversationId: Joi.string().required().messages({
    'any.required': 'conversationId is required',
  }),
});

// Schema for sending a file message
export const sendFileMessageSchema = Joi.object({
  body: Joi.string().max(5000).allow('').optional(),
  conversationId: Joi.string().required().messages({
    'any.required': 'conversationId is required',
  }),
  // Note: senderId is removed from here as we will get it from req.user
});

// Schema for fetching messages with pagination
export const messageQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  conversationId: Joi.string().required().messages({
    'any.required': 'conversationId is required to fetch messages',
  }),
});