// src/middlewares/validators/subject.validator.js

"use strict";

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable helpers — CREATE only (these carry .default(), see note below)
// ---------------------------------------------------------------------------
const nullableStr = () => Joi.string().allow("", null).optional().default(null);
const nullableInt = () => Joi.number().integer().positive().allow(null).optional().default(null);
const nullableSemester = () => Joi.number().integer().min(1).max(12).allow(null).optional().default(null);
const nullableDec = () => Joi.number().min(0).allow(null).optional().default(null);

// ---------------------------------------------------------------------------
// CREATE — code, name, course, term required. Optional fields default so a
// create payload always has a predictable shape.
// ---------------------------------------------------------------------------
const createSubjectSchema = Joi.object({
code              : Joi.string().trim().required(),
name              : Joi.string().trim().required(),
display_name      : nullableStr(),
book_name         : nullableStr(),
description       : Joi.string().allow("", null).optional().default(null),
course            : Joi.number().integer().positive().required(),
semester          : nullableSemester(),
term              : Joi.number().integer().valid(1, 2).required(),
credits           : nullableDec(),
univ_credits      : nullableDec(),
classroom_id      : nullableInt(),
course_staff_id   : nullableInt(),
handling_staff_id : nullableInt(),
is_active         : Joi.number().integer().valid(0, 1).optional().default(1),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE — every field truly optional, NO Joi .default() anywhere. This is
// deliberate (see staff.validator.js / classroom.validator.js note): the
// model only touches keys actually present on req.validatedBody, so a Joi
// default here would cause an unrelated field update to silently null out /
// reset every other column.
// ---------------------------------------------------------------------------
const updateSubjectSchema = Joi.object({
code              : Joi.string().trim().optional(),
name              : Joi.string().trim().optional(),
display_name      : Joi.string().allow("", null).optional(),
book_name         : Joi.string().allow("", null).optional(),
description       : Joi.string().allow("", null).optional(),
course            : Joi.number().integer().positive().optional(),
semester          : Joi.number().integer().min(1).max(12).allow(null).optional(),
term              : Joi.number().integer().valid(1, 2).optional(),
credits           : Joi.number().min(0).allow(null).optional(),
univ_credits      : Joi.number().min(0).allow(null).optional(),
classroom_id      : Joi.number().integer().positive().allow(null).optional(),
course_staff_id   : Joi.number().integer().positive().allow(null).optional(),
handling_staff_id : Joi.number().integer().positive().allow(null).optional(),
is_active         : Joi.number().integer().valid(0, 1).optional(),
})
  .min(1)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// BULK UPDATE STATUS — ids[] + is_active only
// ---------------------------------------------------------------------------
const bulkUpdateSubjectSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required(),

  is_active: Joi.number().integer().valid(0, 1).required(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// GET /api/subjects query params — mirrors getClassroomsQuerySchema.
// All optional; `q` is the free-text search across name & code.
// ---------------------------------------------------------------------------
const getSubjectsQuerySchema = Joi.object({
  course             : Joi.number().integer().positive().optional(),
  semester           : Joi.number().integer().min(1).max(12).optional(),
  term               : Joi.number().integer().valid(1, 2).optional(),
  classroom_id       : Joi.number().integer().positive().optional(),
  course_staff_id    : Joi.number().integer().positive().optional(),
  handling_staff_id  : Joi.number().integer().positive().optional(),
  is_active          : Joi.number().integer().valid(0, 1).optional(),
  q                  : Joi.string().trim().allow("").optional(),
  page               : Joi.number().integer().positive().optional(),
  limit              : Joi.number().integer().positive().optional(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Exports — raw schemas, consumed by the `validate(schema)` route middleware
// (same convention as classroom.validator.js). Controllers read the parsed
// result off req.validatedBody, so no per-schema validate*() wrapper fns
// are needed anymore.
// ---------------------------------------------------------------------------
module.exports = {
  createSubjectSchema,
  updateSubjectSchema,
  bulkUpdateSubjectSchema,
  getSubjectsQuerySchema,
};