// src/controllers/reports/attendance.report.controller.js

"use strict";

const asyncHandler = require("../../utils/asyncHandler");
const ApiError     = require("../../utils/ApiError");
const ApiResponse  = require("../../utils/ApiResponse");
const {
  findStudentForReport,
  getStudentSubjectWiseAttendance,
  findSubjectForReport,
  getSubjectStudentWiseAttendance,
} = require("../../models/reports/attendance.report.model");

// Set to false if OD should NOT be counted towards the attendance percentage.
const OD_COUNTS_AS_PRESENT = true;

// Percentage rounded off to a whole number (e.g. 86.5 -> 87, 86.4 -> 86).
const calcPercentage = (present, od, total) => {
  if (!total) return 0;
  const attended = OD_COUNTS_AS_PRESENT ? present + od : present;
  return Math.round((attended / total) * 100);
};

const toNumberOrNull = (v) => (v !== null && v !== undefined ? Number(v) : null);

// Sums present / OD / absent across a list of attendance records
// and builds the overall totals block.
const buildTotals = (records) => {
  const sum = records.reduce(
    (acc, r) => {
      acc.present += r.present_days;
      acc.od      += r.od_days;
      acc.absent  += r.absent_days;
      return acc;
    },
    { present: 0, od: 0, absent: 0 }
  );
  const total = sum.present + sum.od + sum.absent;

  return {
    total_present_days         : sum.present,
    total_od_days              : sum.od,
    total_absent_days          : sum.absent,
    total_days                 : total,
    total_attendance_percentage: calcPercentage(sum.present, sum.od, total),
  };
};

// -----------------------------------------------------------------------------
// GET /api/reports/attendance/student-wise
//     ?academic_term_id=1&classroom_id=2&student_id=3
// -----------------------------------------------------------------------------
const studentWiseAttendance = asyncHandler(async (req, res) => {
  const { academic_term_id, classroom_id, student_id } = req.validatedQuery;

  const student = await findStudentForReport(student_id, classroom_id);
  if (!student) {
    throw ApiError.notFound("Student not found in the given classroom.");
  }

  const rows = await getStudentSubjectWiseAttendance({
    academic_term_id,
    classroom_id,
    student_id,
  });

  // Per-subject attendance records
  const subjectAttendance = rows.map((r) => {
    const present = Number(r.present_days);
    const od      = Number(r.od_days);
    const absent  = Number(r.absent_days);
    const total   = present + od + absent;

    return {
      subject: {
        id           : r.id,
        code         : r.code,
        name         : r.name,
        short_name   : r.short_name,
        display_name : r.display_name,
        semester     : r.semester,
        term         : r.term,
        credits      : toNumberOrNull(r.credits),
        univ_credits : toNumberOrNull(r.univ_credits),
        is_active    : r.is_active,
      },
      present_days : present,
      od_days      : od,
      absent_days  : absent,
      total_days   : total,
      attendance_percentage: calcPercentage(present, od, total),
    };
  });

  const data = {
    student: {
      student_id   : student.student_id,
      student_name : student.student_name,
      roll_no      : student.roll_no,
      rrn          : student.rrn,
    },
    academic_term_id,
    classroom_id,
    ...buildTotals(subjectAttendance),
    subject_attendance: subjectAttendance,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Student attendance report fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/reports/attendance/subject-wise
//     ?academic_term_id=1&classroom_id=2&subject_id=3
// -----------------------------------------------------------------------------
const subjectWiseAttendance = asyncHandler(async (req, res) => {
  const { academic_term_id, classroom_id, subject_id } = req.validatedQuery;

  const subject = await findSubjectForReport(subject_id, classroom_id);
  if (!subject) {
    throw ApiError.notFound("Subject not found in the given classroom.");
  }

  const rows = await getSubjectStudentWiseAttendance({
    academic_term_id,
    classroom_id,
    subject_id,
  });

  // Per-student attendance records
  const studentAttendance = rows.map((r) => {
    const present = Number(r.present_days);
    const od      = Number(r.od_days);
    const absent  = Number(r.absent_days);
    const total   = present + od + absent;

    return {
      student: {
        student_id   : r.student_id,
        student_name : r.student_name,
        roll_no      : r.roll_no,
        rrn          : r.rrn,
      },
      present_days : present,
      od_days      : od,
      absent_days  : absent,
      total_days   : total,
      attendance_percentage: calcPercentage(present, od, total),
    };
  });

  const data = {
    academic_term_id,
    classroom_id,
    subject: {
      id           : subject.id,
      code         : subject.code,
      name         : subject.name,
      short_name   : subject.short_name,
      display_name : subject.display_name,
      semester     : subject.semester,
      term         : subject.term,
      credits      : toNumberOrNull(subject.credits),
      univ_credits : toNumberOrNull(subject.univ_credits),
      is_active    : subject.is_active,
    },
    total_students: studentAttendance.length,
    ...buildTotals(studentAttendance),
    student_attendance: studentAttendance,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Subject attendance report fetched successfully."));
});

module.exports = { studentWiseAttendance, subjectWiseAttendance };