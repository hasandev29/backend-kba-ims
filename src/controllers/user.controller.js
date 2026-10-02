// src/controllers/user.controller.js

"use strict";

const bcrypt       = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const ApiError     = require("../utils/ApiError");
const ApiResponse  = require("../utils/ApiResponse");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createUser,
  getAllUsers,
  countAllUsers,
  findUserById,
  findUserByUserId,
  updateUser,
  bulkUpdateUserStatus
} = require("../models/user.model");

// -----------------------------------------------------------------------------
// POST /api/users
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const userData = req.validatedBody;

  // Duplicate user_id pre-flight (friendly error before DB throws)
  const existingUserId = await findUserByUserId(userData.user_id);
  if (existingUserId) {
    throw ApiError.conflict("User ID already exists.", {
      user_id: "This User ID is already in use.",
    });
  }

  userData.password = await bcrypt.hash(userData.password, 10);

  await createUser(userData);

  return res.status(201).json(new ApiResponse(201, null, "User created successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/users?page=1&limit=10&role=student&status=active&q=john
// -----------------------------------------------------------------------------

const parseRoles = (role) =>
  role ? role.split(",").map((r) => r.trim()).filter(Boolean) : undefined;

const getAll = asyncHandler(async (req, res) => {
  const { role, status, q: search } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = { role: parseRoles(role), status, search };

  const [users, total] = await Promise.all([
    getAllUsers({ ...filters, limit, offset }),
    countAllUsers(filters),
  ]);

  const safeUsers = users.map(({ password: _, ...u }) => u);

  return res.status(200).json(
    new ApiResponse(200, safeUsers, "Users fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});

// -----------------------------------------------------------------------------
// PUT /api/users/:id  —  user_id, name, email, role, status
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id }     = req.params;
  const updateData = req.validatedBody;

  const existing = await findUserById(id);
  if (!existing) throw ApiError.notFound("User not found.");

  // If user_id is being changed, check it's not taken by another user
  if (updateData.user_id && updateData.user_id !== existing.user_id) {
    const taken = await findUserByUserId(updateData.user_id);
    if (taken) {
      throw ApiError.conflict("User ID already exists.", {
        user_id: "This User ID is already in use.",
      });
    }
  }

  await updateUser(id, updateData);

  const updated           = await findUserById(id);
  const { password: _, ...safeUser } = updated;

  return res.status(200).json(new ApiResponse(200, safeUser, "User updated successfully."));
});

// -----------------------------------------------------------------------------
// PUT /api/users/:id/password
// -----------------------------------------------------------------------------
const updatePassword = asyncHandler(async (req, res) => {
  const { id }     = req.params;
  const updateData = req.validatedBody;

  const existing = await findUserById(id);
  if (!existing) throw ApiError.notFound("User not found.");

  updateData.password = await bcrypt.hash(updateData.password, 10);

  await updateUser(id, updateData);

  return res.status(200).json(new ApiResponse(200, null, "Password updated successfully."));
});

// =============================================================================
const bulkUpdate = asyncHandler(async (req, res) => {
  const { user_ids, status } = req.validatedBody;

  let result;
  try {
    result = await bulkUpdateUserStatus(user_ids, status);
  } catch (err) {
    if (err.code === "ER_NOT_FOUND") {
      throw ApiError.notFound(err.message);
    }
    throw err;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, `${result.updated_count} user(s) updated successfully.`));
});


module.exports = { create, getAll, update, updatePassword, bulkUpdate };