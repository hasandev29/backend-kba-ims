// src/middlewares/validators/semester.validator.js
"use strict";

const Joi = require("joi");

// ---------------------------------------------------------------------------
// CREATE — name/course_id required. is_active optional, defaults true.
// ---------------------------------------------------------------------------
const createSemesterSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  course_id: Joi.number().integer().positive().required(),
  is_active: Joi.boolean().optional().default(true),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE — every field truly optional, NO Joi .default() (the model only
// touches keys actually present on req.validatedBody).
// ---------------------------------------------------------------------------
const updateSemesterSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  course_id: Joi.number().integer().positive().optional(),
  is_active: Joi.boolean().optional(),
})
  .min(1)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query filters for GET /semesters
// ---------------------------------------------------------------------------
const getSemestersQuerySchema = Joi.object({
  course_id: Joi.number().integer().positive().optional(),
  is_active: Joi.number().valid(0, 1).optional(),
  q: Joi.string().trim().max(150).allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

module.exports = {
  createSemesterSchema,
  updateSemesterSchema,
  getSemestersQuerySchema,
};