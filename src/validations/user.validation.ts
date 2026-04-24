import Joi from 'joi';

export const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('ADMIN', 'USER').required().messages({
    'any.only': 'Role must be either ADMIN or USER',
  }),
});