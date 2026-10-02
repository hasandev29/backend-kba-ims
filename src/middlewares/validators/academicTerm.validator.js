// src/middlewares/validators/academicTerm.validator.js
"use strict";

const Joi = require("joi");

const TERM_TYPES = ["ODD", "EVEN"];

// ---------------------------------------------------------------------------
// CREATE — course_id, name, term_type, start_date, end_date required.
// is_current/is_active optional, default false/true.
// end_date must fall after start_date.
// ---------------------------------------------------------------------------
const createAcademicTermSchema = Joi.object({
  course_id: Joi.number().integer().positive().required(),
  name: Joi.string().trim().max(150).required(),
  term_type: Joi.string().valid(...TERM_TYPES).required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref("start_date")).required().messages({
    "date.greater": "end_date must be after start_date.",
  }),
  is_current: Joi.boolean().optional().default(false),
  is_active: Joi.boolean().optional().default(true),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE — every field truly optional, NO Joi .default() (the model only
// touches keys actually present on req.validatedBody).
//
// end_date > start_date is only enforced here when BOTH are supplied in the
// same request; a partial update of just one date is validated against the
// existing row inside the controller/model layer if needed.
// ---------------------------------------------------------------------------
const updateAcademicTermSchema = Joi.object({
  course_id: Joi.number().integer().positive().optional(),
  name: Joi.string().trim().max(150).optional(),
  term_type: Joi.string().valid(...TERM_TYPES).optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional().when("start_date", {
    is: Joi.exist(),
    then: Joi.date().greater(Joi.ref("start_date")).messages({
      "date.greater": "end_date must be after start_date.",
    }),
  }),
  is_current: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
})
  .min(1)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query filters for GET /academic-terms
// ---------------------------------------------------------------------------
const getAcademicTermsQuerySchema = Joi.object({
  course_id: Joi.number().integer().positive().optional(),
  term_type: Joi.string().valid(...TERM_TYPES).optional(),
  is_current: Joi.number().valid(0, 1).optional(),
  is_active: Joi.number().valid(0, 1).optional(),
  q: Joi.string().trim().max(150).allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

module.exports = {
  createAcademicTermSchema,
  updateAcademicTermSchema,
  getAcademicTermsQuerySchema,
};