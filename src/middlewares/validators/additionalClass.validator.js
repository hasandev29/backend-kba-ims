// src/middlewares/validators/additionalClass.validator.js
"use strict";

const Joi = require("joi");

const CLASS_TYPES = ["makeup", "extra"];
const CLASS_STATUSES = ["scheduled", "completed", "cancelled"];
const SESSION_STATUSES = ["draft", "completed", "cancelled"];
const ATTENDANCE_STATUSES = ["present", "absent", "od"];

const timeOnly = () => Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/);

// .raw() keeps the original "YYYY-MM-DD" string instead of converting to a JS
// Date, which avoids timezone shifts when the value is passed to MySQL.
const dateOnly = () => Joi.date().iso().raw();

// ---------------------------------------------------------------------------
// Shared header fields for an additional class (CREATE).
// - makeup: original_class_date + original_period_no are required
// - extra : original_* must be omitted / null
// ---------------------------------------------------------------------------
const additionalClassFields = {
  academic_term_id: Joi.number().integer().positive().required(),
  classroom_id: Joi.number().integer().positive().required(),
  subject_id: Joi.number().integer().positive().required(),
  staff_id: Joi.number().integer().positive().required(),
  class_date: dateOnly().required(),
  start_time: timeOnly().required(),
  end_time: timeOnly().required(),
  class_type: Joi.string().valid(...CLASS_TYPES).required(),
  original_class_date: Joi.when("class_type", {
    is: "makeup",
    then: dateOnly().required(),
    otherwise: Joi.valid(null).optional().default(null),
  }),
  original_period_no: Joi.when("class_type", {
    is: "makeup",
    then: Joi.number().integer().min(1).max(20).required(),
    otherwise: Joi.valid(null).optional().default(null),
  }),
  reason: Joi.string().trim().max(255).allow("", null).optional().default(null),
};

// end_time must be later than start_time (HH:MM:SS strings compare correctly).
const checkTimeRange = (value, helpers) => {
  if (value.end_time <= value.start_time) {
    return helpers.message("end_time must be later than start_time.");
  }
  return value;
};

// ---------------------------------------------------------------------------
// One student's attendance row.
// ---------------------------------------------------------------------------
const recordSchema = Joi.object({
  student_id: Joi.number().integer().positive().required(),
  attendance_status: Joi.string().valid(...ATTENDANCE_STATUSES).required(),
  check_in_time: timeOnly().allow(null).optional().default(null),
  remarks: Joi.string().trim().max(255).allow("", null).optional().default(null),
});

// ---------------------------------------------------------------------------
// POST /additional-classes  — class only, status is always "scheduled"
// ---------------------------------------------------------------------------
const createAdditionalClassSchema = Joi.object({
  ...additionalClassFields,
})
  .custom(checkTimeRange)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// POST /additional-classes/with-attendance — class + attendance in one call
// ---------------------------------------------------------------------------
const createAdditionalClassWithAttendanceSchema = Joi.object({
  ...additionalClassFields,
  session_status: Joi.string().valid(...SESSION_STATUSES).optional().default("completed"),
  attendance_remarks: Joi.string().trim().allow("", null).optional().default(null),
  students: Joi.array().items(recordSchema).min(1).unique("student_id").required(),
})
  .custom(checkTimeRange)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// PATCH /additional-classes/:id
// Every field is optional and NO defaults are applied (a default would silently
// overwrite existing values). Cross-field rules (makeup needs original_*, time
// range) and the "attendance already taken" restriction are enforced in the
// controller against the merged (existing + patch) record.
// ---------------------------------------------------------------------------
const updateAdditionalClassSchema = Joi.object({
  academic_term_id: Joi.number().integer().positive(),
  classroom_id: Joi.number().integer().positive(),
  subject_id: Joi.number().integer().positive(),
  staff_id: Joi.number().integer().positive(),
  class_date: dateOnly(),
  start_time: timeOnly(),
  end_time: timeOnly(),
  class_type: Joi.string().valid(...CLASS_TYPES),
  original_class_date: dateOnly().allow(null),
  original_period_no: Joi.number().integer().min(1).max(20).allow(null),
  reason: Joi.string().trim().max(255).allow("", null),
  status: Joi.string().valid(...CLASS_STATUSES),
})
  .min(1)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// GET /additional-classes  — filters + search + pagination
// ---------------------------------------------------------------------------
const getAdditionalClassesQuerySchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().optional(),
  classroom_id: Joi.number().integer().positive().optional(),
  subject_id: Joi.number().integer().positive().optional(),
  staff_id: Joi.number().integer().positive().optional(),
  class_type: Joi.string().valid(...CLASS_TYPES).optional(),
  status: Joi.string().valid(...CLASS_STATUSES).optional(),
  class_date: dateOnly().optional(),
  date_from: dateOnly().optional(),
  date_to: dateOnly().optional(),
  q: Joi.string().trim().max(100).allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
})
  .custom((value, helpers) => {
    if (value.date_from && value.date_to && String(value.date_from) > String(value.date_to)) {
      return helpers.message("date_from must be on or before date_to.");
    }
    return value;
  })
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// :id params (GET / PATCH / DELETE)
// ---------------------------------------------------------------------------
const additionalClassIdParamsSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = {
  createAdditionalClassSchema,
  createAdditionalClassWithAttendanceSchema,
  updateAdditionalClassSchema,
  getAdditionalClassesQuerySchema,
  additionalClassIdParamsSchema,
  CLASS_TYPES,
  CLASS_STATUSES,
};