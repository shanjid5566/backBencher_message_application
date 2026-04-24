import Joi from 'joi';

export const createConversationSchema = Joi.object({
  participantId: Joi.string().required().messages({
    'any.required': 'participantId is required to start a chat',
    'string.empty': 'participantId cannot be empty',
  }),
});