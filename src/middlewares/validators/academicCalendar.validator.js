// src/middlewares/validators/academicCalendar.validator.js
"use strict";

const Joi = require("joi");

const EVENT_TYPES = ["HOLIDAY", "EVENT", "EXAM"];

const makeClassroomConsistencyCheck = (requireBothTogether) => (value, helpers) => {
  const hasAppliesFlag = Object.prototype.hasOwnProperty.call(value, "applies_to_all_classrooms");
  const hasClassroomIds = Object.prototype.hasOwnProperty.call(value, "classroom_ids");

  if (requireBothTogether && (hasAppliesFlag !== hasClassroomIds)) {
    return helpers.message(
      "applies_to_all_classrooms and classroom_ids must be provided together when updating classroom scope."
    );
  }

  const { applies_to_all_classrooms, classroom_ids } = value;

  if (applies_to_all_classrooms === false) {
    if (!Array.isArray(classroom_ids) || classroom_ids.length === 0) {
      return helpers.message("classroom_ids must contain at least one classroom when applies_to_all_classrooms is false.");
    }
  }

  if (applies_to_all_classrooms === true && Array.isArray(classroom_ids) && classroom_ids.length > 0) {
    return helpers.message("classroom_ids must be empty when applies_to_all_classrooms is true.");
  }

  return value;
};

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------
const createAcademicCalendarSchema = Joi.object({
  calendar_date: Joi.date().iso().required(),
  event_type: Joi.string().valid(...EVENT_TYPES).required(),
  affects_attendance: Joi.boolean().optional().default(false),
  applies_to_all_classrooms: Joi.boolean().optional().default(true),
  classroom_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .unique()
    .optional()
    .default([]),
  color_id: Joi.number().integer().positive().allow(null).optional().default(null),
  title: Joi.string().trim().max(150).required(),
  description: Joi.string().trim().allow("", null).optional(),
})
  .options({ allowUnknown: false })
  .custom(makeClassroomConsistencyCheck(false), "classroom scope consistency");

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------
const updateAcademicCalendarSchema = Joi.object({
  calendar_date: Joi.date().iso().optional(),
  event_type: Joi.string().valid(...EVENT_TYPES).optional(),
  affects_attendance: Joi.boolean().optional(),
  applies_to_all_classrooms: Joi.boolean().optional(),
  classroom_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .unique()
    .optional(),
  color_id: Joi.number().integer().positive().allow(null).optional(),
  title: Joi.string().trim().max(150).optional(),
  description: Joi.string().trim().allow("", null).optional(),
})
  .min(1)
  .options({ allowUnknown: false })
  .custom(makeClassroomConsistencyCheck(true), "classroom scope consistency");

// ---------------------------------------------------------------------------
// Query filters for GET /academic-calendar
// ---------------------------------------------------------------------------
const getAcademicCalendarQuerySchema = Joi.object({
  classroom_id: Joi.number().integer().positive().optional(),
  applies_to_all_classrooms: Joi.number().valid(0, 1).optional(),
  event_type: Joi.string().valid(...EVENT_TYPES).optional(),
  affects_attendance: Joi.boolean().optional(),
  color_id: Joi.number().integer().positive().allow(null).optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().min(Joi.ref("date_from")).optional(),
  q: Joi.string().trim().max(150).allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

module.exports = {
  createAcademicCalendarSchema,
  updateAcademicCalendarSchema,
  getAcademicCalendarQuerySchema,
};