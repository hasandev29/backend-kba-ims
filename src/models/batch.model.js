// src/models/batch.model.js

const { pool } = require("../config/db");

// Create Batch
const createBatch = async (batchData) => {
  const sql = `
    INSERT INTO batches
    (course_id, batch_name, start_year, end_year)
    VALUES (?, ?, ?, ?)
  `;

  const values = [
    batchData.course_id,
    batchData.batch_name,
    batchData.start_year,
    batchData.end_year,
  ];

  const [result] = await pool.query(sql, values);

  return result;
};

// Get Batch By ID
const findBatchById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM batches WHERE id = ? LIMIT 1",
    [id]
  );

  return rows[0];
};

// Check for duplicate (same course + batch_name), optionally excluding an id (for edit)
const findBatchByCourseAndName = async (course_id, batch_name, excludeId = null) => {
  let sql = "SELECT * FROM batches WHERE course_id = ? AND batch_name = ?";
  const values = [course_id, batch_name];

  if (excludeId) {
    sql += " AND id != ?";
    values.push(excludeId);
  }

  sql += " LIMIT 1";

  const [rows] = await pool.query(sql, values);
  return rows[0];
};

// Get All / Filtered Batches (paginated, or unpaginated when limit is null)
const getAllBatches = async ({ course_id, start_year, end_year, search, limit, offset }) => {
  let sql      = "SELECT * FROM batches WHERE 1=1";
  const values = [];

  if (course_id)  { sql += " AND course_id = ?";  values.push(course_id);  }
  if (start_year) { sql += " AND start_year = ?"; values.push(start_year); }
  if (end_year)   { sql += " AND end_year = ?";   values.push(end_year);   }
  if (search) {
    sql += " AND (batch_name LIKE ? OR CAST(start_year AS CHAR) LIKE ? OR CAST(end_year AS CHAR) LIKE ?)";
    const term = `%${search}%`;
    values.push(term, term, term);
  }

  sql += " ORDER BY start_year DESC";

  if (limit != null) {
    sql += " LIMIT ? OFFSET ?";
    values.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, values);
  return rows;
};

// Count All / Filtered Batches (for pagination meta)
const countAllBatches = async ({ course_id, start_year, end_year, search }) => {
  let sql      = "SELECT COUNT(*) AS total FROM batches WHERE 1=1";
  const values = [];

  if (course_id)  { sql += " AND course_id = ?";  values.push(course_id);  }
  if (start_year) { sql += " AND start_year = ?"; values.push(start_year); }
  if (end_year)   { sql += " AND end_year = ?";   values.push(end_year);   }
  if (search) {
    sql += " AND (batch_name LIKE ? OR CAST(start_year AS CHAR) LIKE ? OR CAST(end_year AS CHAR) LIKE ?)";
    const term = `%${search}%`;
    values.push(term, term, term);
  }

  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// Edit Batch
const UPDATABLE_FIELDS = ["course_id", "batch_name", "start_year", "end_year"];

const updateBatch = async (id, data) => {
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
    `UPDATE batches SET ${setClauses.join(", ")} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

module.exports = {
  createBatch,
  findBatchById,
  findBatchByCourseAndName,
  getAllBatches,
  countAllBatches,
  updateBatch,
};