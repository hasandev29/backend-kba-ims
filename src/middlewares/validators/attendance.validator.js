// src/middlewares/validators/attendance.validator.js
"use strict";

const Joi = require("joi");

const SESSION_STATUSES = ["draft", "completed", "cancelled"];
const ATTENDANCE_STATUSES = ["present", "absent", "od"];

const timeOnly = () => Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/);

// ---------------------------------------------------------------------------
// One student's attendance row within a session's `students` array.
// ---------------------------------------------------------------------------
const recordSchema = Joi.object({
  student_id: Joi.number().integer().positive().required(),
  attendance_status: Joi.string().valid(...ATTENDANCE_STATUSES).required(),
  check_in_time: timeOnly().allow(null).optional().default(null),
  remarks: Joi.string().trim().max(255).allow("", null).optional().default(null),
});

// ---------------------------------------------------------------------------
// CREATE — a session is created once per (timetable_slot_id, attendance_date)
// along with the full list of student records for that period, in one call.
// created_by/updated_by are stamped server-side, never accepted from client.
// ---------------------------------------------------------------------------
const createAttendanceSessionSchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().required(),
  session_type: Joi.string().valid("regular", "makeup", "extra").required(),
  // regular  -> timetable_slot_id required, additional_class_id forbidden
  // makeup/extra -> additional_class_id required, timetable_slot_id forbidden
  timetable_slot_id: Joi.number().integer().positive().when("session_type", {
    is: "regular",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  additional_class_id: Joi.number().integer().positive().when("session_type", {
    is: Joi.valid("makeup", "extra"),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  attendance_date: Joi.date().iso().raw().required(),
  classroom_id: Joi.number().integer().positive().required(),
  subject_id: Joi.number().integer().positive().required(),
  staff_id: Joi.number().integer().positive().required(),
  session_status: Joi.string().valid(...SESSION_STATUSES).optional().default("completed"),
  remarks: Joi.string().trim().allow("", null).optional().default(null),
  students: Joi.array()
    .items(recordSchema)
    .min(1)
    .unique("student_id")
    .required(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query filters for GET /attendance-sessions
// ---------------------------------------------------------------------------
const getAttendanceSessionsQuerySchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().optional(),
  classroom_id: Joi.number().integer().positive().optional(),
  subject_id: Joi.number().integer().positive().optional(),
  staff_id: Joi.number().integer().positive().optional(),
  timetable_slot_id: Joi.number().integer().positive().optional(),
  session_type: Joi.string().valid("regular", "makeup", "extra").optional(),
  session_status: Joi.string().valid(...SESSION_STATUSES).optional(),
  attendance_date: Joi.date().iso().raw().optional(),
  date_from: Joi.date().iso().raw().optional(),
  date_to: Joi.date().iso().raw().min(Joi.ref("date_from")).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

module.exports = {
  createAttendanceSessionSchema,
  getAttendanceSessionsQuerySchema,
  SESSION_STATUSES,
  ATTENDANCE_STATUSES,
};