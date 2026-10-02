// src/middlewares/validators/attendanceList.validator.js

// =============================================================================
// Query validation for the attendance LIST endpoints.
//
//   GET /api/attendances/sessions   -> dateViewQuerySchema
//     group_by = classroom | staff | status
// =============================================================================

"use strict";

const Joi = require("joi");

const GROUP_BY_OPTIONS = ["classroom", "staff", "status"];
const SESSION_TYPES = ["regular", "makeup", "extra"];
const LIST_STATUSES = ["pending", "completed", "cancelled"]; // derived, not the DB enum
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// "YYYY-MM-DD" that is also a real calendar date (rejects 2026-02-31 etc.)
const isoDateOnly = () =>
  Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => {
      const d = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "real calendar date")
    .messages({
      "string.pattern.base": '"date" must be in YYYY-MM-DD format',
      "any.invalid": '"date" is not a valid calendar date',
    });

// ---------------------------------------------------------------------------
// GET /api/attendances/sessions
// ---------------------------------------------------------------------------
const dateViewQuerySchema = Joi.object({
  group_by: Joi.string().valid(...GROUP_BY_OPTIONS).required(),

  // The frontend sends both the date and its weekday name; the timetable is
  // looked up by day name, attendance by date.
  date: isoDateOnly().required(),
  day: Joi.string().valid(...WEEKDAYS).required(),

  academic_term_id: Joi.number().integer().positive().required(),

  // optional filters
  classroom_id: Joi.number().integer().positive().optional(),
  staff_id: Joi.number().integer().positive().optional(),
  session_type: Joi.string().valid(...SESSION_TYPES).optional(),
  session_status: Joi.string().valid(...LIST_STATUSES).optional(),
  search: Joi.string().trim().max(100).allow("").optional(),

  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(25),
})
  .options({ allowUnknown: false })
  // Guard against a mismatched date/day pair, which would silently return the
  // wrong day's timetable.
  .custom((value, helpers) => {
    const d = new Date(`${value.date}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return value; // already reported by "date" rule
    const actual = WEEKDAYS[d.getUTCDay()];
    if (actual !== value.day) {
      return helpers.message(
        `"day" (${value.day}) does not match "date" (${value.date}), which is a ${actual}`
      );
    }
    return value;
  }, "date/day consistency");

// ---------------------------------------------------------------------------
// GET /api/attendances/slot/:slot_id?date=YYYY-MM-DD&type=regular|extra
// ---------------------------------------------------------------------------
const slotDetailParamsSchema = Joi.object({
  slot_id: Joi.number().integer().positive().required(),
});

const slotDetailQuerySchema = Joi.object({
  date: isoDateOnly().required(),
  type: Joi.string().valid("regular", "extra").required(),
}).options({ allowUnknown: false });

module.exports = {
  slotDetailParamsSchema,
  slotDetailQuerySchema,
  dateViewQuerySchema,
  GROUP_BY_OPTIONS,
  SESSION_TYPES,
  LIST_STATUSES,
};