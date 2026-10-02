// src/middlewares/validators/timetable.validator.js
"use strict";

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------
const dateOnly = () => Joi.date().iso();

// A single grid cell — day_id/period_id must belong to the timetable's own
// format (checked in the controller, not here). staff_id is required per
// the timetable_slots schema (NOT NULL); subject_id is nullable.
const slotSchema = Joi.object({
  day_id: Joi.number().integer().positive().required(),
  period_id: Joi.number().integer().positive().required(),
  subject_id: Joi.number().integer().positive().allow(null).optional().default(null),
  staff_id: Joi.number().integer().positive().required(),
  remarks: Joi.string().trim().max(255).allow("", null).optional().default(null),
});

// ---------------------------------------------------------------------------
// CREATE — timetable_name/classroom_id/format_id/effective_from required.
// `slots` is optional and may be an empty array (creates an empty grid,
// filled in one cell at a time afterwards — matches the "+" creation UI).
// created_by/updated_by are never accepted from the client — they're
// stamped server-side from the authenticated user in the controller.
// ---------------------------------------------------------------------------
const createTimetableSchema = Joi.object({
  timetable_name: Joi.string().trim().required(),
  classroom_id: Joi.number().integer().positive().required(),
  academic_term_id: Joi.number().integer().positive().required(),
  format_id: Joi.number().integer().positive().required(),
  effective_from: dateOnly().required(),
  effective_to: dateOnly().allow(null).optional().default(null)
    .when("effective_from", {
      is: Joi.exist(),
      then: Joi.date().iso().min(Joi.ref("effective_from")).allow(null),
    }),
  notes: Joi.string().trim().allow("", null).optional().default(null),
  is_active: Joi.number().valid(0, 1).optional().default(1),
  slots: Joi.array().items(slotSchema).optional().default([]),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE — every field truly optional, NO Joi .default() on header fields
// (the model only touches keys actually present on req.validatedBody, so a
// Joi default here would cause an unrelated field update to silently reset
// other columns).
//
// `slots` — UPSERT keyed by (day_id, period_id): add or edit a cell.
// `remove_slot_ids` — explicit cell-clearing by timetable_slots.id.
// At least one of a header field / slots / remove_slot_ids must be present.
// ---------------------------------------------------------------------------
const updateTimetableSchema = Joi.object({
  // Required on every PATCH — the version the client last fetched, used
  // for optimistic-lock conflict detection in updateTimetable().
  version: Joi.number().integer().positive().required(),
  timetable_name: Joi.string().trim().optional(),
  classroom_id: Joi.number().integer().positive().optional(),
  academic_term_id: Joi.number().integer().positive().optional(),
  format_id: Joi.number().integer().positive().optional(),
  effective_from: dateOnly().optional(),
  effective_to: dateOnly().allow(null).optional(),
  notes: Joi.string().trim().allow("", null).optional(),
  is_active: Joi.number().valid(0, 1).optional(),
  slots: Joi.array().items(slotSchema).optional(),
  remove_slot_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
})
  .min(1)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query filters for GET /timetables
// q -> search on timetable_name
// effective_from / effective_to -> range filter on those columns
// ---------------------------------------------------------------------------
const getTimetablesQuerySchema = Joi.object({
  classroom_id: Joi.number().integer().positive().optional(),
  academic_term_id: Joi.number().integer().positive().optional(),
  format_id: Joi.number().integer().positive().optional(),
  is_active: Joi.number().valid(0, 1).optional(),
  effective_from: dateOnly().optional(),
  effective_to: dateOnly().optional(),
  // MM-YYYY — matches timetables whose effective_from OR effective_to
  // falls in that month/year (see buildFilterClause in the model).
  effective_period: Joi.string().trim().pattern(/^(0[1-9]|1[0-2])-\d{4}$/).optional(),
  q: Joi.string().trim().max(150).allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

const bulkUpdateTimetableSchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  is_active: Joi.number().valid(0, 1).required(),
}).options({ allowUnknown: false });

module.exports = {
  createTimetableSchema,
  updateTimetableSchema,
  getTimetablesQuerySchema,
  bulkUpdateTimetableSchema,
};