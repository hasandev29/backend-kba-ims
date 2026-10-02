// src/middlewares/validators/academicYear.validator.js
"use strict";

const Joi = require("joi");

// ---------------------------------------------------------------------------
// CREATE — name/start_date/end_date required. is_current optional, default
// false. end_date must fall after start_date.
// ---------------------------------------------------------------------------
const createAcademicYearSchema = Joi.object({
  name: Joi.string().trim().max(20).required(), // e.g. "2025-2026"
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref("start_date")).required()
    .messages({ "date.greater": '"end_date" must be after "start_date"' }),
  is_current: Joi.boolean().optional().default(false),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE — every field truly optional, NO Joi .default() (the model only
// touches keys actually present on req.validatedBody).
// ---------------------------------------------------------------------------
const updateAcademicYearSchema = Joi.object({
  name: Joi.string().trim().max(20).optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  is_current: Joi.boolean().optional(),
})
  .min(1)
  .options({ allowUnknown: false })
  .custom((value, helpers) => {
    if (value.start_date && value.end_date && value.end_date <= value.start_date) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({ "any.invalid": '"end_date" must be after "start_date"' });

// ---------------------------------------------------------------------------
// Query filters for GET /academic-years
// ---------------------------------------------------------------------------
const getAcademicYearsQuerySchema = Joi.object({
  is_current: Joi.number().valid(0, 1).optional(),
  q: Joi.string().trim().max(20).allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

module.exports = {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  getAcademicYearsQuerySchema,
};