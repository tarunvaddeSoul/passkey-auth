import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  POSTGRES_USER: Joi.string().required().default('passkey_user'),
  POSTGRES_PASSWORD: Joi.string().required().default('passkey_password'),
  POSTGRES_DB: Joi.string().required().default('passkey_db'),

  RP_ID: Joi.string().required().default('localhost'),
  RP_NAME: Joi.string().required().default('Passkey Dev'),
  ORIGIN: Joi.string().uri().required(),
  PORT: Joi.number().default(3000),

  RATE_LIMIT_TTL: Joi.number().integer().positive().default(60),
  RATE_LIMIT_MAX: Joi.number().integer().positive().default(10),
});
