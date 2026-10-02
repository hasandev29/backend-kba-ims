// src/middlewares/validators/timetableFormat.validator.js

"use strict";

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable pieces
// ---------------------------------------------------------------------------

const DAY_NAMES = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const daySchema = Joi.object({
  day_order: Joi.number().integer().min(1).max(7).required(),
  day_name: Joi.string()
    .valid(...DAY_NAMES)
    .required(),
}).options({ allowUnknown: false });

const periodSchema = Joi.object({
  period_order: Joi.number().integer().min(1).required(),
  period_key: Joi.string().trim().max(20).required(),
  period_label: Joi.string().trim().max(50).required(),
  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .allow(null)
    .optional()
    .default(null),
  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .allow(null)
    .optional()
    .default(null),
  is_break: Joi.number().integer().valid(0, 1).optional().default(0),
  is_lunch: Joi.number().integer().valid(0, 1).optional().default(0),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// CREATE — format_name required; days & periods define the template, so at
// least one of each is required for the format to be usable.
// ---------------------------------------------------------------------------
const createTimetableFormatSchema = Joi.object({
  format_name: Joi.string().trim().required(),
  description: Joi.string().trim().allow("", null).optional().default(null),
  course: Joi.number().integer().min(1).required(),
  is_active: Joi.number().integer().valid(0, 1).optional().default(1),
  days: Joi.array().items(daySchema).min(1).required(),
  periods: Joi.array().items(periodSchema).min(1).required(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE — every field truly optional, NO Joi .default() on header fields
// (see classroom.validator.js note: the model only touches keys actually
// present on req.validatedBody). `days`/`periods`, if supplied, fully
// replace the existing set — so unlike header fields they DO carry
// per-item defaults, since a partial day/period object would be ambiguous.
// ---------------------------------------------------------------------------
const updateTimetableFormatSchema = Joi.object({
  format_name: Joi.string().trim().optional(),
  description: Joi.string().trim().allow("", null).optional(),
  course: Joi.number().integer().min(1).optional(),
  is_active: Joi.number().integer().valid(0, 1).optional(),
  days: Joi.array().items(daySchema).min(1).optional(),
  periods: Joi.array().items(periodSchema).min(1).optional(),
})
  .min(1)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query filters for GET /timetable-formats
// q -> search across format_name & description
// ---------------------------------------------------------------------------
const getTimetableFormatsQuerySchema = Joi.object({
  is_active: Joi.number().integer().valid(0, 1).optional(),
  q: Joi.string().trim().max(100).allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

const bulkUpdateTimetableFormatSchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),

  is_active: Joi.number().integer().valid(0, 1).required(),
}).options({ allowUnknown: false });

module.exports = {
  createTimetableFormatSchema,
  updateTimetableFormatSchema,
  getTimetableFormatsQuerySchema,
  bulkUpdateTimetableFormatSchema,
};