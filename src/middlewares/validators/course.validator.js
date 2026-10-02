// src/middlewares/validators/course.validator.js
"use strict";

const Joi = require("joi");

// ---------------------------------------------------------------------------
// CREATE — name required. is_default/is_active optional, default false/true.
// ---------------------------------------------------------------------------
const createCourseSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  is_default: Joi.boolean().optional().default(false),
  is_active: Joi.boolean().optional().default(true),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE — every field truly optional, NO Joi .default() (the model only
// touches keys actually present on req.validatedBody).
// ---------------------------------------------------------------------------
const updateCourseSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  is_default: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
})
  .min(1)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query filters for GET /courses
// ---------------------------------------------------------------------------
const getCoursesQuerySchema = Joi.object({
  is_active: Joi.number().valid(0, 1).optional(),
  is_default: Joi.number().valid(0, 1).optional(),
  q: Joi.string().trim().max(150).allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

module.exports = {
  createCourseSchema,
  updateCourseSchema,
  getCoursesQuerySchema,
};