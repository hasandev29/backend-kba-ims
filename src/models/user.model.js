// src/models/user.model.js

const { pool } = require("../config/db");

const createUser = async (userData) => {
  const sql = `
    INSERT INTO users
    (user_id, email, role, password)
    VALUES (?, ?, ?, ?)
  `;

  const values = [
    userData.user_id,
    userData.email,
    userData.role,
    userData.password,
  ];

  const [result] = await pool.query(sql, values);

  return result;
};

const getAllUsers = async ({ role, excludeRole, status, search, limit, offset }) => {
  let sql      = "SELECT * FROM users WHERE 1=1";
  const values = [];

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    sql += ` AND role IN (${roles.map(() => "?").join(", ")})`;
    values.push(...roles);
  } else if (excludeRole) {
    const roles = Array.isArray(excludeRole) ? excludeRole : [excludeRole];
    sql += ` AND role NOT IN (${roles.map(() => "?").join(", ")})`;
    values.push(...roles);
  }

  if (status) { sql += " AND status = ?"; values.push(status); }
  if (search) {
    sql += " AND (user_id LIKE ? OR email LIKE ?)";
    const term = `%${search}%`;
    values.push(term, term); // was values.push(term, term, term) — 3rd value had no placeholder
  }

  if (limit != null) {
    sql += " LIMIT ? OFFSET ?";
    values.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, values);
  return rows;
};

const countAllUsers = async ({ role, excludeRole, status, search }) => {
  let sql      = "SELECT COUNT(*) AS total FROM users WHERE 1=1";
  const values = [];

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    sql += ` AND role IN (${roles.map(() => "?").join(", ")})`;
    values.push(...roles);
  } else if (excludeRole) {
    const roles = Array.isArray(excludeRole) ? excludeRole : [excludeRole];
    sql += ` AND role NOT IN (${roles.map(() => "?").join(", ")})`;
    values.push(...roles);
  }

  if (status) { sql += " AND status = ?"; values.push(status); }
  if (search) {
    sql += " AND (user_id LIKE ? OR email LIKE ?)";
    const term = `%${search}%`;
    values.push(term, term, term);
  }

  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

const findUserByUserId = async (user_id) => {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE user_id = ? LIMIT 1",
    [user_id]
  );
  return rows[0];
};

const findUserById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0];
};

const UPDATABLE_FIELDS = ["user_id", "email", "role", "status", "password"];

const updateUser = async (id, data) => {
  const setClauses = [];
  const values     = [];

  UPDATABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      setClauses.push(`${field} = ?`);
      values.push(data[field] ?? null);
    }
  });

  if (setClauses.length === 0) return false;

  values.push(id);

  const [result] = await pool.query(
    `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

// =============================================================================
// bulkUpdateUserStatus
//
// PATCH /api/users/bulk — sets the SAME status on MANY users at once.
//
// @param  {number[]} userIds
// @param  {string}   status — "active" | "inactive"
// @returns {{updated_count:number, user_ids:number[]}}
// @throws  {Error} code "ER_NOT_FOUND" if any id doesn't exist
// =============================================================================
const bulkUpdateUserStatus = async (userIds, status) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify every id exists (and lock the rows) before writing anything —
    // a partial bulk update against a wrong id would be silently confusing.
    const [existingRows] = await connection.query(
      `SELECT id FROM users WHERE id IN (?) FOR UPDATE`,
      [userIds]
    );
    if (existingRows.length !== userIds.length) {
      const foundIds = new Set(existingRows.map((r) => r.id));
      const missing  = userIds.filter((id) => !foundIds.has(id));
      const err = new Error(`User id(s) not found: ${missing.join(", ")}`);
      err.code = "ER_NOT_FOUND";
      throw err;
    }

    await connection.query(
      `UPDATE users SET status = ? WHERE id IN (?)`,
      [status, userIds]
    );

    await connection.commit();
    return { updated_count: userIds.length, user_ids: userIds };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createUser,
  getAllUsers,
  countAllUsers,
  findUserByUserId,
  findUserById,
  updateUser,
  bulkUpdateUserStatus
};