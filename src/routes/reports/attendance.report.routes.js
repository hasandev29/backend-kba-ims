// src/routes/reports/attendance.report.routes.js

"use strict";

const express = require("express");
const router  = express.Router();

const auth = require("../../middlewares/auth");
const {
  studentWiseAttendanceQuerySchema,
  subjectWiseAttendanceQuerySchema,
  validateQuery,
} = require("../../middlewares/validators/reports/attendance.report.validator");
const {
  studentWiseAttendance,
  subjectWiseAttendance,
} = require("../../controllers/reports/attendance.report.controller");

// GET /api/reports/attendance/student-wise?academic_term_id=&classroom_id=&student_id=
router.get(
  "/student-wise",
  auth("dev", "superadmin", "admin", "staff"),
  validateQuery(studentWiseAttendanceQuerySchema),
  studentWiseAttendance
);

// GET /api/reports/attendance/subject-wise?academic_term_id=&classroom_id=&subject_id=
router.get(
  "/subject-wise",
  auth("dev", "superadmin", "admin", "staff"),
  validateQuery(subjectWiseAttendanceQuerySchema),
  subjectWiseAttendance
);

module.exports = router;

// Mount in your main app / routes index:
//   app.use("/api/reports/attendance", require("./routes/reports/attendance.report.routes"));