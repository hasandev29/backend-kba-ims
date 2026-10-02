// src/controllers/additionalClass.controller.js

// =============================================================================
// additionalClass.controller.js
//
// Responsibilities:
//   1. FK existence checks (academic_term, classroom, subject, staff).
//   2. Clash check — no overlapping (non-cancelled) additional class for the
//      same classroom or the same staff member on the same date -> 409.
//   3. For "with attendance": every student_id must exist AND belong to the
//      classroom_id of the class.
//   4. Stamp created_by / updated_by from the authenticated user.
//   5. PATCH: once attendance exists for the class, only `reason` and `status`
//      may be edited; otherwise any field (validated against the merged row).
//   6. DELETE: blocked (409) if an attendance session references the class.
//   7. Hand off DB work to additionalClass.model.js.
//
// Exports: create | createWithAttendance | getAll | getById | update | remove
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { pool } = require("../config/db");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createAdditionalClass,
  createAdditionalClassWithAttendance,
  findAdditionalClassById,
  findAdditionalClassRawById,
  findAttendanceSessionByClassId,
  getAllAdditionalClasses,
  countAllAdditionalClasses,
  findConflictingAdditionalClasses,
  updateAdditionalClass,
  deleteAdditionalClassIfNoAttendance,
} = require("../models/additionalClass.model");

// Fields that stay editable after attendance has been taken.
const EDITABLE_AFTER_ATTENDANCE = ["reason", "status"];

// -----------------------------------------------------------------------------
// FK pre-flight
// -----------------------------------------------------------------------------
const FK_CHECKS = [
  { field: "academic_term_id", table: "academic_terms" },
  { field: "classroom_id", table: "classrooms" },
  { field: "subject_id", table: "subjects" },
  { field: "staff_id", table: "staff" },
];

// `only` (optional array of field names) limits the check to those fields —
// used by PATCH so untouched FKs aren't re-queried.
const checkFKs = async (data, only) => {
  for (const { field, table } of FK_CHECKS) {
    if (only && !only.includes(field)) continue;
    const [[row]] = await pool.query(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`, [data[field]]);
    if (!row) {
      throw new ApiError(422, "Invalid reference.", {
        [field]: `${field} ${data[field]} does not exist in ${table}.`,
      });
    }
  }
};

// -----------------------------------------------------------------------------
// Clash check — same classroom or same staff, overlapping time, same date.
// `excludeId` skips the class being edited.
// -----------------------------------------------------------------------------
const checkClashes = async (data, excludeId) => {
  const conflicts = await findConflictingAdditionalClasses({ ...data, excludeId });
  if (!conflicts.length) return;

  const errors = {};
  if (conflicts.some((c) => c.classroom_id === data.classroom_id)) {
    errors.classroom_id = `Classroom ${data.classroom_id} already has an additional class overlapping ${data.start_time}-${data.end_time} on ${data.class_date}.`;
  }
  if (conflicts.some((c) => c.staff_id === data.staff_id)) {
    errors.staff_id = `Staff ${data.staff_id} already has an additional class overlapping ${data.start_time}-${data.end_time} on ${data.class_date}.`;
  }
  throw new ApiError(409, "Additional class time conflict.", errors);
};

// -----------------------------------------------------------------------------
// Student-level pre-flight — exists AND belongs to the classroom.
// -----------------------------------------------------------------------------
const checkStudentFKs = async (students, classroomId) => {
  const studentIds = [...new Set(students.map((s) => s.student_id))];

  const [rows] = await pool.query(`SELECT id, classroom_id FROM students WHERE id IN (?)`, [studentIds]);
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
// POST /api/additional-classes
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const data = {
    ...req.validatedBody,
    status: "scheduled",
    created_by: req.user?.id ?? null,
  };

  await checkFKs(data);
  await checkClashes(data);

  const id = await createAdditionalClass(data);
  const created = await findAdditionalClassById(id);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Additional class created successfully."));
});

// -----------------------------------------------------------------------------
// POST /api/additional-classes/with-attendance
// -----------------------------------------------------------------------------
const createWithAttendance = asyncHandler(async (req, res) => {
  const data = {
    ...req.validatedBody,
    created_by: req.user?.id ?? null,
  };

  await checkFKs(data);
  await checkClashes(data);
  await checkStudentFKs(data.students, data.classroom_id);

  const { additionalClassId } = await createAdditionalClassWithAttendance(data);
  const created = await findAdditionalClassById(additionalClassId);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Additional class and attendance created successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/additional-classes
// Filters: academic_term_id, classroom_id, subject_id, staff_id,
//          class_type, status, class_date, date_from/date_to (inclusive), q
// -----------------------------------------------------------------------------

const getAll = asyncHandler(async (req, res) => {
  const {
    academic_term_id, classroom_id, subject_id, staff_id,
    class_type, status, class_date, date_from, date_to, q,
  } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const num = (v) => (v !== undefined && v !== "" ? Number(v) : undefined);
  const str = (v) => (v !== undefined && v !== "" ? v : undefined);

  const filters = {
    academic_term_id: num(academic_term_id),
    classroom_id: num(classroom_id),
    subject_id: num(subject_id),
    staff_id: num(staff_id),
    class_type: str(class_type),
    status: str(status),
    class_date: str(class_date),
    date_from: str(date_from),
    date_to: str(date_to),
    q: str(q),
  };

  const [rows, total] = await Promise.all([
    getAllAdditionalClasses({ ...filters, limit, offset }),
    countAllAdditionalClasses(filters),
  ]);

  return res.status(200).json({
    success: true,
    message: "Additional classes fetched successfully.",
    pagination: buildPaginationMeta({ paginate, total, page, limit }),
    data: rows,
  });
});

// -----------------------------------------------------------------------------
// GET /api/additional-classes/:id
// Includes attendance_status / attendance_taken / attendance_session.
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const additionalClass = await findAdditionalClassById(Number(req.params.id));
  if (!additionalClass) throw ApiError.notFound("Additional class not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, additionalClass, "Additional class fetched successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/additional-classes/:id
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const patch = req.validatedBody;

  const existing = await findAdditionalClassRawById(id);
  if (!existing) throw ApiError.notFound("Additional class not found.");

  const session = await findAttendanceSessionByClassId(id);
  const updatedBy = req.user?.id ?? null;

  // ---- Attendance already taken: only reason + status may change ----------
  if (session) {
    const blocked = Object.keys(patch).filter((k) => !EDITABLE_AFTER_ATTENDANCE.includes(k));
    if (blocked.length) {
      const errors = {};
      blocked.forEach((k) => {
        errors[k] = `${k} cannot be edited because attendance has already been recorded for this class.`;
      });
      throw new ApiError(
        409,
        `Attendance already exists for this class. Only ${EDITABLE_AFTER_ATTENDANCE.join(" and ")} can be edited.`,
        errors
      );
    }

    const fields = {};
    if (patch.reason !== undefined) fields.reason = patch.reason || null;
    if (patch.status !== undefined) fields.status = patch.status;

    await updateAdditionalClass(id, fields, updatedBy);
    const updated = await findAdditionalClassById(id);
    return res.status(200).json(new ApiResponse(200, updated, "Additional class updated successfully."));
  }

  // ---- No attendance yet: full edit, validated against the merged row -----
  const merged = { ...existing, ...patch };
  const fields = { ...patch };

  if (patch.reason !== undefined) fields.reason = patch.reason || null;

  // Time range
  if (merged.end_time <= merged.start_time) {
    throw new ApiError(422, "Validation failed.", {
      end_time: "end_time must be later than start_time.",
    });
  }

  // makeup / extra rules
  if (merged.class_type === "makeup") {
    const errors = {};
    if (!merged.original_class_date) errors.original_class_date = "original_class_date is required for makeup classes.";
    if (!merged.original_period_no) errors.original_period_no = "original_period_no is required for makeup classes.";
    if (Object.keys(errors).length) throw new ApiError(422, "Validation failed.", errors);
  } else {
    // extra: original_* must be null
    if (patch.original_class_date || patch.original_period_no) {
      const errors = {};
      if (patch.original_class_date) errors.original_class_date = "original_class_date must be empty for extra classes.";
      if (patch.original_period_no) errors.original_period_no = "original_period_no must be empty for extra classes.";
      throw new ApiError(422, "Validation failed.", errors);
    }
    fields.original_class_date = null;
    fields.original_period_no = null;
    merged.original_class_date = null;
    merged.original_period_no = null;
  }

  // FK existence — only for FK fields actually being changed
  const changedFKs = FK_CHECKS.map((f) => f.field).filter((f) => patch[f] !== undefined);
  if (changedFKs.length) await checkFKs(merged, changedFKs);

  // Clash check (skip if the class ends up cancelled), excluding itself
  if (merged.status !== "cancelled") await checkClashes(merged, id);

  await updateAdditionalClass(id, fields, updatedBy);
  const updated = await findAdditionalClassById(id);

  return res.status(200).json(new ApiResponse(200, updated, "Additional class updated successfully."));
});

// -----------------------------------------------------------------------------
// DELETE /api/additional-classes/:id
// -----------------------------------------------------------------------------
const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await findAdditionalClassRawById(id);
  if (!existing) throw ApiError.notFound("Additional class not found.");

  const session = await findAttendanceSessionByClassId(id);
  if (session) {
    throw new ApiError(409, "Cannot delete this additional class because attendance has already been recorded for it.", {
      id: `Additional class ${id} is linked to attendance session ${session.id}.`,
    });
  }

  // Atomic guard against an attendance session being created in between.
  const affected = await deleteAdditionalClassIfNoAttendance(id);
  if (!affected) {
    throw new ApiError(409, "Cannot delete this additional class because attendance has already been recorded for it.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { id }, "Additional class deleted successfully."));
});

module.exports = { create, createWithAttendance, getAll, getById, update, remove };