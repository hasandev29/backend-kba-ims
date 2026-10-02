// src/controllers/classroom.controller.js

// =============================================================================
// classroom.controller.js
//
// Responsibilities:
//   1. Run FK existence checks for advisor_id, leader_id, and batch_id
//      BEFORE any INSERT / UPDATE (body validation itself now happens in
//      the routes file via the `validate` middleware, same as batches).
//   2. Hand off DB writes/reads to classroom.model.js.
//
// Exports: create | getById | getAll | update
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError      = require("../utils/ApiError");
const ApiResponse   = require("../utils/ApiResponse");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const { pool }      = require("../config/db");
const {
  createClassroom,
  findClassroomById,
  getAllClassrooms,
  countAllClassrooms,
  getClassroomsList,
  updateClassroom,
  bulkUpdateClassroomStatus,
} = require("../models/classroom.model");

// -----------------------------------------------------------------------------
// Shared FK pre-flight helper
// Checks advisor_id, leader_id, batch_id only when present in data.
// -----------------------------------------------------------------------------
const checkFKs = async (data) => {
  if (data.advisor_id !== null && data.advisor_id !== undefined) {
    const [[row]] = await pool.query(`SELECT id FROM staff WHERE id = ? LIMIT 1`, [data.advisor_id]);
    if (!row) {
      throw new ApiError(422, "Invalid reference.", {
        advisor_id: `advisor_id ${data.advisor_id} does not exist in staff.`,
      });
    }
  }

  if (data.leader_id !== null && data.leader_id !== undefined) {
    const [[row]] = await pool.query(`SELECT id FROM students WHERE id = ? LIMIT 1`, [data.leader_id]);
    if (!row) {
      throw new ApiError(422, "Invalid reference.", {
        leader_id: `leader_id ${data.leader_id} does not exist in students.`,
      });
    }
  }

  if (data.batch_id !== null && data.batch_id !== undefined) {
    const [[row]] = await pool.query(`SELECT id FROM batches WHERE id = ? LIMIT 1`, [data.batch_id]);
    if (!row) {
      throw new ApiError(422, "Invalid reference.", {
        batch_id: `batch_id ${data.batch_id} does not exist in batches.`,
      });
    }
  }
};

// -----------------------------------------------------------------------------
// POST /api/classrooms
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const classroomData = req.validatedBody;

  await checkFKs(classroomData);

  const classroomId = await createClassroom(classroomData);

  return res
    .status(201)
    .json(new ApiResponse(201, { classroom_id: classroomId }, "Classroom created successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/classrooms/:id
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id }      = req.params;
  const updateData  = req.validatedBody;

  const existing = await findClassroomById(id);
  if (!existing) throw ApiError.notFound("Classroom not found.");

  await checkFKs(updateData);

  await updateClassroom(id, updateData);

  const updated = await findClassroomById(id);

  return res.status(200).json(new ApiResponse(200, updated, "Classroom updated successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/classrooms/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const classroom = await findClassroomById(id);
  if (!classroom) throw ApiError.notFound("Classroom not found.");

  return res.status(200).json(new ApiResponse(200, classroom, "Classroom fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/classrooms?page=&limit=&semester=&advisor_id=&leader_id=&batch_id=&course=&is_active=&q=
// -----------------------------------------------------------------------------

const getAll = asyncHandler(async (req, res) => {
  const {
    semester, advisor_id, leader_id, batch_id, course, is_active,
    q: search,
  } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = {

    semester   : semester   !== undefined ? Number(semester)   : undefined,
    advisor_id : advisor_id !== undefined ? Number(advisor_id) : undefined,
    leader_id  : leader_id  !== undefined ? Number(leader_id)  : undefined,
    batch_id   : batch_id   !== undefined ? Number(batch_id)   : undefined,
    course     : course     !== undefined ? Number(course)     : undefined,
    is_active  : is_active  !== undefined ? Number(is_active)  : undefined,
    search,
  };

  const [classrooms, total] = await Promise.all([
    getAllClassrooms({ ...filters, limit, offset }),
    countAllClassrooms(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, classrooms, "Classrooms fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});

// -----------------------------------------------------------------------------
// GET /api/classrooms/list?course=&is_active=&q=
// No pagination — returns all matching rows with a trimmed field set.
// -----------------------------------------------------------------------------
const getAllList = asyncHandler(async (req, res) => {
  const { course, is_active, q: search } = req.query;

  const filters = {

    course    : course    !== undefined ? Number(course)    : undefined,
    is_active : is_active !== undefined ? Number(is_active) : undefined,
    search,
  };

  const classrooms = await getClassroomsList(filters);

  return res
    .status(200)
    .json(new ApiResponse(200, classrooms, "Classrooms fetched successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/classrooms/bulk
// -----------------------------------------------------------------------------
const bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, is_active } = req.validatedBody;

  let result;
  try {
    result = await bulkUpdateClassroomStatus(ids, is_active);
  } catch (err) {
    if (err.code === "ER_NOT_FOUND") {
      throw ApiError.notFound(err.message);
    }
    throw err;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, `${result.updated_count} classroom(s) updated successfully.`));
});

module.exports = { create, getById, getAll, getAllList, update, bulkUpdate };