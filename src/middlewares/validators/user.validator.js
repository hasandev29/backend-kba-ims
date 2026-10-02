// src/middlewares/validators/user.validator.js

"use strict";

const Joi = require("joi");

const fields = {
  user_id  : Joi.string().trim().min(1).max(50),
  email    : Joi.string().trim().email({ tlds: { allow: false } }).allow("", null),
  role     : Joi.string().valid("superadmin", "admin", "staff", 'parent', "student", 'dev','accountant'),
  status   : Joi.string().valid("active", "inactive"),
  password : Joi.string().min(6).max(128),
};

// Create — all required except status
const createUserSchema = Joi.object({
  user_id  : fields.user_id.required(),
  email    : fields.email.optional(),
  role     : fields.role.required(),
  password : fields.password.required(),
  status   : fields.status.optional().default("active"),
}).options({ allowUnknown: false });

// Update — user_id, name, email, role, status only (no password)
const updateUserSchema = Joi.object({
  user_id  : fields.user_id.optional(),
  email    : fields.email.optional(),
  role     : fields.role.optional(),
  status   : fields.status.optional(),
})
  .min(1)
  .options({ allowUnknown: false });

// Password update — password only
const updatePasswordSchema = Joi.object({
  password : fields.password.required(),
}).options({ allowUnknown: false });

const bulkUpdateUserSchema = Joi.object({
  user_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required(),

  status: Joi.string().valid("active", "inactive").required(),
}).options({ allowUnknown: false });

module.exports = { createUserSchema, updateUserSchema, updatePasswordSchema, bulkUpdateUserSchema };