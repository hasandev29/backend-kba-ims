// src/middlewares/validators/reports/attendance.report.validator.js

"use strict";

const Joi      = require("joi");
const ApiError = require("../../../utils/ApiError");

const id = Joi.number().integer().positive();

// GET /api/reports/attendance/student-wise?academic_term_id=1&classroom_id=2&student_id=3
const studentWiseAttendanceQuerySchema = Joi.object({
  academic_term_id : id.required(),
  classroom_id     : id.required(),
  student_id       : id.required(),
}).options({ allowUnknown: false });

// GET /api/reports/attendance/subject-wise?academic_term_id=1&classroom_id=2&subject_id=3
const subjectWiseAttendanceQuerySchema = Joi.object({
  academic_term_id : id.required(),
  classroom_id     : id.required(),
  subject_id       : id.required(),
}).options({ allowUnknown: false });

// Query-string validator middleware (the existing `validate` middleware works on req.body,
// so this one validates req.query and exposes the cleaned values as req.validatedQuery).
const validateQuery = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly : false,
    convert    : true,
  });

  if (error) {
    const errors = {};
    error.details.forEach((d) => {
      const key = d.path.join(".") || "query";
      if (!errors[key]) errors[key] = d.message.replace(/"/g, "");
    });
    return next(ApiError.badRequest("Validation failed.", errors));
  }

  req.validatedQuery = value;
  next();
};

module.exports = {
  studentWiseAttendanceQuerySchema,
  subjectWiseAttendanceQuerySchema,
  validateQuery,
};