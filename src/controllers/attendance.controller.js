// src/controllers/attendance.controller.js

// =============================================================================
// attendance.controller.js
//
// Responsibilities:
//   1. Check that a session doesn't already exist for this
//      (timetable_slot_id, attendance_date) pair — a session is created
//      only once — and return a clean 409 instead of a raw duplicate-key error.
//   2. Run FK existence checks for classroom_id, subject_id, staff_id,
//      period_id, timetable_slot_id.
//   3. Run student-level checks: every student_id must exist AND belong to
//      the classroom_id being marked (keeps attendance consistent with the
//      class the period was taken for).
//   4. Stamp created_by / updated_by from the authenticated user.
//   5. Hand off DB writes/reads to attendance.model.js.
//
// Exports: create | getById | getAll
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { pool } = require("../config/db");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createAttendanceSession,
  findAttendanceSessionById,
  getAllAttendanceSessions,
  countAllAttendanceSessions,
  findSessionByDateAndSlot,
  findSessionByAdditionalClassId,
} = require("../models/attendance.model");

// -----------------------------------------------------------------------------
// Session-level FK pre-flight — classroom_id, subject_id, staff_id, period_id,
// timetable_slot_id must all exist.
// -----------------------------------------------------------------------------
const checkSessionFKs = async (data) => {
  const [[term]] = await pool.query(`SELECT id FROM academic_terms WHERE id = ? LIMIT 1`, [data.academic_term_id]);
  if (!term) {
    throw new ApiError(422, "Invalid reference.", {
      academic_term_id: `academic_term_id ${data.academic_term_id} does not exist in academic_terms.`,
    });
  }

  const [[classroom]] = await pool.query(`SELECT id FROM classrooms WHERE id = ? LIMIT 1`, [data.classroom_id]);
  if (!classroom) {
    throw new ApiError(422, "Invalid reference.", {
      classroom_id: `classroom_id ${data.classroom_id} does not exist in classrooms.`,
    });
  }

  const [[subject]] = await pool.query(`SELECT id FROM subjects WHERE id = ? LIMIT 1`, [data.subject_id]);
  if (!subject) {
    throw new ApiError(422, "Invalid reference.", {
      subject_id: `subject_id ${data.subject_id} does not exist in subjects.`,
    });
  }

  const [[staff]] = await pool.query(`SELECT id FROM staff WHERE id = ? LIMIT 1`, [data.staff_id]);
  if (!staff) {
    throw new ApiError(422, "Invalid reference.", {
      staff_id: `staff_id ${data.staff_id} does not exist in staff.`,
    });
  }

  if (data.session_type === "regular") {
    const [[slot]] = await pool.query(`SELECT id FROM timetable_slots WHERE id = ? LIMIT 1`, [data.timetable_slot_id]);
    if (!slot) {
      throw new ApiError(422, "Invalid reference.", {
        timetable_slot_id: `timetable_slot_id ${data.timetable_slot_id} does not exist in timetable_slots.`,
      });
    }
  } else {
    const [[addl]] = await pool.query(`SELECT id FROM additional_classes WHERE id = ? LIMIT 1`, [data.additional_class_id]);
    if (!addl) {
      throw new ApiError(422, "Invalid reference.", {
        additional_class_id: `additional_class_id ${data.additional_class_id} does not exist in additional_classes.`,
      });
    }
  }
};

// -----------------------------------------------------------------------------
// Student-level pre-flight — every student_id must exist AND belong to the
// classroom_id the session is being taken for.
// -----------------------------------------------------------------------------
const checkStudentFKs = async (students, classroomId) => {
  const studentIds = [...new Set(students.map((s) => s.student_id))];

  const [rows] = await pool.query(
    `SELECT id, classroom_id FROM students WHERE id IN (?)`,
    [studentIds]
  );
  const foundIds = new Set(rows.map((r) => r.id));

  const missing = studentIds.filter((id) => !foundIds.has(id));
  if (missing.length) {
    throw new ApiError(422, "Invalid reference.", {
      student_id: `student_id(s) ${missing.join(", ")} do not exist in students.`,
    });
  }

  const wrongClassroom = rows.filter((r) => r.classroom_id !== classroomId).map((r) => r.id);
  if (wrongClassroom.length) {
    throw new ApiError(422, "Invalid reference.", {
      student_id: `student_id(s) ${wrongClassroom.join(", ")} do not belong to classroom ${classroomId}.`,
    });
  }
};

// -----------------------------------------------------------------------------
// POST /api/attendance-sessions
// Body includes the session header fields and the full `students` array for
// that period — see attendance.validator.js.
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  // session_type decides the source:
  //   regular       -> timetable_slot_id
  //   makeup/extra  -> additional_class_id
  // The validator guarantees exactly one of them is present.
  const sessionData = {
    ...req.validatedBody,
    timetable_slot_id: req.validatedBody.timetable_slot_id ?? null,
    additional_class_id: req.validatedBody.additional_class_id ?? null,
    created_by: req.user?.id ?? null,
  };

  if (sessionData.session_type === "regular") {
    const existing = await findSessionByDateAndSlot(sessionData.attendance_date, sessionData.timetable_slot_id);
    if (existing) {
      throw new ApiError(409, "Attendance session already exists.", {
        timetable_slot_id: `Attendance for slot ${sessionData.timetable_slot_id} on ${sessionData.attendance_date} has already been taken (session id ${existing.id}).`,
      });
    }
  } else {
    const existing = await findSessionByAdditionalClassId(sessionData.additional_class_id);
    if (existing) {
      throw new ApiError(409, "Attendance session already exists.", {
        additional_class_id: `Attendance for additional class ${sessionData.additional_class_id} has already been taken (session id ${existing.id}).`,
      });
    }
  }

  await checkSessionFKs(sessionData);
  await checkStudentFKs(sessionData.students, sessionData.classroom_id);

  let sessionId;
  try {
    sessionId = await createAttendanceSession(sessionData);
  } catch (err) {
    // Race-condition backstop: the DB unique keys caught a duplicate that
    // slipped past the pre-check.
    if (err.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Attendance session already exists.");
    }
    throw err;
  }
  const created = await findAttendanceSessionById(sessionId);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Attendance session created successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/attendance-sessions/:id
// Returns header + every student's attendance record.
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await findAttendanceSessionById(id);
  if (!session) throw ApiError.notFound("Attendance session not found.");

  return res.status(200).json(new ApiResponse(200, session, "Attendance session fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/attendance-sessions?page=&limit=&classroom_id=&subject_id=&staff_id=
//     &period_id=&timetable_slot_id=&session_status=&attendance_date=&date_from=&date_to=
// -----------------------------------------------------------------------------
const getAll = asyncHandler(async (req, res) => {
  const {
    academic_term_id, classroom_id, subject_id, staff_id, timetable_slot_id,
    session_type, session_status, attendance_date, date_from, date_to,
  } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = {
    classroom_id: classroom_id !== undefined ? Number(classroom_id) : undefined,
    subject_id: subject_id !== undefined ? Number(subject_id) : undefined,
    staff_id: staff_id !== undefined ? Number(staff_id) : undefined,
    timetable_slot_id: timetable_slot_id !== undefined ? Number(timetable_slot_id) : undefined,
    session_type,
    session_status,
    attendance_date,
    date_from,
    date_to,
  };

  const [sessions, total] = await Promise.all([
    getAllAttendanceSessions({ ...filters, limit, offset }),
    countAllAttendanceSessions(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, sessions, "Attendance sessions fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});

module.exports = { create, getById, getAll };