// src/controllers/batch.controller.js

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError      = require("../utils/ApiError");
const ApiResponse   = require("../utils/ApiResponse");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createBatch,
  findBatchById,
  findBatchByCourseAndName,
  getAllBatches,
  countAllBatches,
  updateBatch,
} = require("../models/batch.model");

// -----------------------------------------------------------------------------
// POST /api/batches
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const batchData = req.validatedBody;

  const existing = await findBatchByCourseAndName(batchData.course_id, batchData.batch_name);
  if (existing) {
    throw ApiError.conflict("Batch already exists.", {
      batch_name: "A batch with this course and batch name already exists.",
    });
  }

  await createBatch(batchData);

  return res.status(201).json(new ApiResponse(201, null, "Batch created successfully."));
});
// -----------------------------------------------------------------------------
// PUT /api/batches/:id
// -----------------------------------------------------------------------------
const edit = asyncHandler(async (req, res) => {
  const { id }     = req.params;
  const updateData = req.validatedBody;

  const existing = await findBatchById(id);
  if (!existing) throw ApiError.notFound("Batch not found.");

  // Merge only for validation purposes (year range, duplicate check) —
  // the actual DB write uses updateData as-is via UPDATABLE_FIELDS.
  const merged = {
    course_id  : updateData.course_id  ?? existing.course_id,
    batch_name : updateData.batch_name ?? existing.batch_name,
    start_year : updateData.start_year ?? existing.start_year,
    end_year   : updateData.end_year   ?? existing.end_year,
  };

  if (merged.end_year < merged.start_year) {
    throw ApiError.badRequest("Invalid year range.", {
      end_year: "end_year must be greater than or equal to start_year.",
    });
  }

  if (merged.course_id !== existing.course_id || merged.batch_name !== existing.batch_name) {
    const clash = await findBatchByCourseAndName(merged.course_id, merged.batch_name, id);
    if (clash) {
      throw ApiError.conflict("Batch already exists.", {
        batch_name: "A batch with this course and batch name already exists.",
      });
    }
  }

  await updateBatch(id, updateData);

  const updated = await findBatchById(id);

  return res.status(200).json(new ApiResponse(200, updated, "Batch updated successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/batches/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const batch = await findBatchById(id);
  if (!batch) throw ApiError.notFound("Batch not found.");

  return res.status(200).json(new ApiResponse(200, batch, "Batch fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/batches?page=1&limit=10&course=BCA&start_year=2023&end_year=2026&q=morning
// -----------------------------------------------------------------------------
const getAll = asyncHandler(async (req, res) => {
  const { course_id, start_year, end_year, q: search } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = {
    course_id: course_id ? Number(course_id) : undefined,
    start_year: start_year ? Number(start_year) : undefined,
    end_year  : end_year   ? Number(end_year)   : undefined,
    search,
  };

  const [batches, total] = await Promise.all([
    getAllBatches({ ...filters, limit, offset }),
    countAllBatches(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, batches, "Batches fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});

module.exports = { create, edit, getById, getAll };