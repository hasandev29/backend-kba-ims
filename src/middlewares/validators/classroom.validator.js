// src/middlewares/validators/classroom.validator.js

"use strict";

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable helpers (same convention as staff.validator.js)
// ---------------------------------------------------------------------------

/** Positive integer or null — used for lookup ID columns */
const nullableInt = () =>
  Joi.number().integer().positive().allow(null).optional().default(null);

// ---------------------------------------------------------------------------
// CREATE — name/course required. Optional fields default so a create
// payload always has a predictable shape.
// ---------------------------------------------------------------------------
const createClassroomSchema = Joi.object({
  name       : Joi.string().trim().required(),
  room_no    : Joi.string().trim().allow("", null).optional().default(null),
  semester   : Joi.number().integer().min(1).max(12).allow(null).optional().default(null),
  advisor_id : nullableInt(),
  leader_id  : nullableInt(),
  batch_id   : nullableInt(),
  course     : Joi.number().integer().positive().required(),
  is_active  : Joi.number().integer().valid(0, 1).optional().default(1),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE — every field truly optional, NO Joi .default() anywhere. This is
// deliberate (see staff.validator.js note): the model only touches keys
// actually present on req.validatedBody, so a Joi default here would cause
// an unrelated field update to silently null out / reset every other column.
// ---------------------------------------------------------------------------
const updateClassroomSchema = Joi.object({
  name       : Joi.string().trim().optional(),
  room_no    : Joi.string().trim().allow("", null).optional(),
  semester   : Joi.number().integer().min(1).max(12).allow(null).optional(),
  advisor_id : Joi.number().integer().positive().allow(null).optional(),
  leader_id  : Joi.number().integer().positive().allow(null).optional(),
  batch_id   : Joi.number().integer().positive().allow(null).optional(),
  course     : Joi.number().integer().positive().optional(),
  is_active  : Joi.number().integer().valid(0, 1).optional(),
})
  .min(1)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query filters for GET /classrooms
// q -> search across name & room_no
// ---------------------------------------------------------------------------
const getClassroomsQuerySchema = Joi.object({
  semester   : Joi.number().integer().min(1).max(12).optional(),
  advisor_id : Joi.number().integer().positive().optional(),
  leader_id  : Joi.number().integer().positive().optional(),
  batch_id   : Joi.number().integer().positive().optional(),
  course     : Joi.number().integer().positive().optional(),
  is_active  : Joi.number().integer().valid(0, 1).optional(),
  q          : Joi.string().trim().max(100).allow("").optional(),
  page       : Joi.number().integer().min(1).optional(),
  limit      : Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

const bulkUpdateClassroomSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required(),

  is_active: Joi.number().integer().valid(0, 1).required(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query filters for GET /classrooms/list (no pagination — returns all rows)
// ---------------------------------------------------------------------------
const getClassroomsListQuerySchema = Joi.object({

  course    : Joi.number().integer().positive().optional(),
  is_active : Joi.number().integer().valid(0, 1).optional(),
  q         : Joi.string().trim().max(100).allow("").optional(),
}).options({ allowUnknown: false });

module.exports = {
  createClassroomSchema,
  updateClassroomSchema,
  getClassroomsQuerySchema,
  getClassroomsListQuerySchema,
  bulkUpdateClassroomSchema,
};