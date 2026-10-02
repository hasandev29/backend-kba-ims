// src/middlewares/validators/studentAcademicEnrollment.validator.js
"use strict";

const Joi = require("joi");

const ENROLLMENT_STATUSES = ["active", "completed", "transferred", "withdrawn"];

// ---------------------------------------------------------------------------
// CREATE — academic_year_id/student_id/classroom_id required.
// enrollment_status optional, default 'active'.
// ---------------------------------------------------------------------------
const createEnrollmentSchema = Joi.object({
  academic_year_id: Joi.number().integer().positive().required(),
  student_id: Joi.number().integer().positive().required(),
  classroom_id: Joi.number().integer().positive().required(),
  enrollment_status: Joi.string().valid(...ENROLLMENT_STATUSES).optional().default("active"),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE — every field truly optional, NO Joi .default() (the model only
// touches keys actually present on req.validatedBody).
// ---------------------------------------------------------------------------
const updateEnrollmentSchema = Joi.object({
  academic_year_id: Joi.number().integer().positive().optional(),
  student_id: Joi.number().integer().positive().optional(),
  classroom_id: Joi.number().integer().positive().optional(),
  enrollment_status: Joi.string().valid(...ENROLLMENT_STATUSES).optional(),
})
  .min(1)
  .options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query filters for GET /student-academic-enrollments
// ---------------------------------------------------------------------------
const getEnrollmentsQuerySchema = Joi.object({
  academic_year_id: Joi.number().integer().positive().optional(),
  student_id: Joi.number().integer().positive().optional(),
  classroom_id: Joi.number().integer().positive().optional(),
  enrollment_status: Joi.string().valid(...ENROLLMENT_STATUSES).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// BULK PROMOTE — PATCH /api/students/promote
//
// Moves a set of students into a given classroom for a given academic year
// in one shot. Writes to student_academic_enrollments only — never touches
// students / users. promoteStudents() in student.model.js upserts against
// the (academic_year_id, student_id) unique key, so calling this again for
// a student already enrolled that year just updates their classroom_id
// instead of erroring.
// ---------------------------------------------------------------------------
const bulkPromoteStudentsSchema = Joi.object({
  academic_year_id : Joi.number().integer().positive().required(),
  classroom_id     : Joi.number().integer().positive().required(),
  student_ids      : Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required(),
}).options({ allowUnknown: false });

module.exports = {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  getEnrollmentsQuerySchema,
  bulkPromoteStudentsSchema
};