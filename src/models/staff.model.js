// =============================================================================
// staff.model.js
//
// Executes every INSERT for a new staff member inside a single MySQL
// transaction. If any step fails the entire transaction is rolled back,
// leaving the database in a clean state.
//
// sanitize() — converts "null" / "" to actual SQL NULL.
// toBool()   — safely maps truthy-like values to 1 or 0 for TINYINT(1).
//
// SCHEMA NOTE — `name` now lives on `staff`, not `users` (users no longer
// has a name column at all). `users.email` continues to mirror
// personal_details.personal_email, same as before.
//
// SECTION-EDIT FUNCTIONS (added)
//   One function/branch per editable section, matching the one-table-per-
//   section split used by the PATCH route:
//     account            → users
//     personal_details   → staff
//     employment_details → staff_employment_details
//     qualifications     → staff_qualifications   (single row, see note below)
//     address            → staff_addresses         (delete + re-insert)
//     other_details      → staff_other_details
//
//   All of them (except qualifications) only touch the columns actually
//   present in the payload — buildSetClause() below builds
//   "col = ?, col2 = ?" purely from Object.keys(data), so an omitted field is
//   left untouched in the DB rather than being reset to NULL/0. Because the
//   section schemas in staff.validator.js use allowUnknown:false and no
//   unexpected keys can slip through, it's safe to use those keys directly
//   as column names.
//
//   qualifications is the one exception: the payload key is `text`, but the
//   DB column is `staff_qualifications.qualifications` (single 1:1 row, not
//   an array like student's qualifications). That column-name mismatch
//   means it gets its own explicit UPDATE instead of buildSetClause().
// =============================================================================

"use strict";

const bcrypt   = require("bcryptjs");
const { pool } = require("../config/db");

// -----------------------------------------------------------------------------
// sanitize
// Returns null for: null, undefined, the string "null", or empty string.
// Returns the original value for everything else.
// -----------------------------------------------------------------------------
const sanitize = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "string" && (val.trim().toLowerCase() === "null" || val.trim() === "")) {
    return null;
  }
  return val;
};

// -----------------------------------------------------------------------------
// toBool
// Safe TINYINT(1) coercion.
//   truthy  → 1 : true, 1, "true", "1"
//   falsy   → 0 : false, 0, "false", "0", null, undefined, anything else
// -----------------------------------------------------------------------------
const toBool = (val) =>
  val === true || val === 1 || val === "true" || val === "1" ? 1 : 0;

// -----------------------------------------------------------------------------
// filterNonNull (private)
// Strips keys whose value is null/undefined so buildSetClause() never
// receives them — used by bulk-update, where a null value means
// "leave this field alone", not "clear it to NULL".
// -----------------------------------------------------------------------------
const filterNonNull = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
  );

// -----------------------------------------------------------------------------
// buildSetClause (private)// Builds a dynamic "col = ?, col2 = ?" SET clause + matching values array
// from ONLY the keys present on `data`. Used by every section PATCH so an
// omitted field is left untouched instead of being overwritten with NULL/0.
//
// @param  {Object}   data       — validated req.validatedBody (or a slice of it)
// @param  {string[]} boolFields — keys that must go through toBool() instead
//                                 of sanitize() (TINYINT(1) columns)
// -----------------------------------------------------------------------------
const buildSetClause = (data, boolFields = []) => {
  const keys = Object.keys(data);
  const setClause = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) =>
    boolFields.includes(key) ? toBool(data[key]) : sanitize(data[key])
  );
  return { keys, setClause, values };
};

// =============================================================================
// createStaff
//
// @param  {Object} staffData — validated + sanitized payload (req.validatedBody)
// @returns {number}          — auto-increment PK of the new staff row
// =============================================================================
const createStaff = async (staffData) => {

  const {
    account,
    personal_details,
    employment_details,
    qualifications,
    address,
    other_details,
  } = staffData;

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();

    // -------------------------------------------------------------------------
    // STEP 1 — Hash password
    // -------------------------------------------------------------------------
    const hashedPassword = await bcrypt.hash(account.password, 10);

    // -------------------------------------------------------------------------
    // STEP 2 — Insert into `users` (no `name` column — it lives on `staff`)
    // -------------------------------------------------------------------------
    const [userResult] = await connection.query(
      `INSERT INTO users (user_id, email, role, status, password)
       VALUES (?, ?, ?, ?, ?)`,
      [
        account.user_id,
        personal_details.personal_email ?? null,
        account.role,
        account.status ?? "active",
        hashedPassword,
      ]
    );

    const userId = userResult.insertId;

    // -------------------------------------------------------------------------
    // STEP 3 — Insert master row into `staff`
    // -------------------------------------------------------------------------
    const [staffResult] = await connection.query(
      `INSERT INTO staff
         (user_id, name, staff_uid, short_name, salutation, gender,
          dob, blood_group, mobile_number, emergency_contact,
          personal_email, religion_id, marital_status,
          medical_remarks, photo_url, date_of_joining)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        personal_details.name,
        personal_details.staff_uid,
        sanitize(personal_details.short_name),
        personal_details.salutation          ?? null,
        personal_details.gender              ?? 1,
        personal_details.dob                 ?? null,
        personal_details.blood_group         ?? null,
        sanitize(personal_details.mobile_number),
        sanitize(personal_details.emergency_contact),
        sanitize(personal_details.personal_email),
        personal_details.religion_id         ?? null,
        personal_details.marital_status      ?? null,
        sanitize(personal_details.medical_remarks),
        sanitize(personal_details.photo_url),
        personal_details.date_of_joining     ?? null,
      ]
    );

    const staffId = staffResult.insertId;

    // -------------------------------------------------------------------------
    // STEP 4 — staff_employment_details  (1:1)
    // -------------------------------------------------------------------------
    await connection.query(
      `INSERT INTO staff_employment_details
         (staff_id, staff_type, designation, experience_years,
          employment_nature, employment_place, university_id,
          university_designation, university_experience,
          work_email, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staffId,
        employment_details.staff_type               ?? null,
        employment_details.designation               ?? null,
        employment_details.experience_years         ?? null,
        employment_details.employment_nature        ?? null,
        employment_details.employment_place         ?? null,
        sanitize(employment_details.university_id),
        employment_details.university_designation    ?? null,
        employment_details.university_experience    ?? null,
        sanitize(employment_details.work_email),
        sanitize(employment_details.notes),
      ]
    );

    // -------------------------------------------------------------------------
    // STEP 5 — staff_qualifications  (1:1)
    // -------------------------------------------------------------------------
    await connection.query(
      `INSERT INTO staff_qualifications (staff_id, qualifications)
       VALUES (?, ?)`,
      [
        staffId,
        sanitize(qualifications?.text ?? null),
      ]
    );

    // -------------------------------------------------------------------------
    // STEP 6 — staff_addresses  (1:N)
    // -------------------------------------------------------------------------
    if (Array.isArray(address) && address.length > 0) {
      for (const addr of address) {
        await connection.query(
          `INSERT INTO staff_addresses
             (staff_id, address_type, door_no, street, area,
              city, district, state, pin_code, country)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            staffId,
            addr.address_type,
            sanitize(addr.door_no),
            sanitize(addr.street),
            sanitize(addr.area),
            sanitize(addr.city),
            sanitize(addr.district),
            sanitize(addr.state),
            sanitize(addr.pin_code),
            sanitize(addr.country),
          ]
        );
      }
    }

    // -------------------------------------------------------------------------
    // STEP 7 — staff_other_details  (1:1)
    // -------------------------------------------------------------------------
    await connection.query(
      `INSERT INTO staff_other_details
         (staff_id, aadhar_no, aadhar_doc_url, pan_no, pan_doc_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        staffId,
        sanitize(other_details.aadhar_no),
        sanitize(other_details.aadhar_doc_url),
        sanitize(other_details.pan_no),
        sanitize(other_details.pan_doc_url),
      ]
    );

    await connection.commit();

    return staffId;

  } catch (error) {

    await connection.rollback();
    throw error;

  } finally {

    connection.release();
  }
};

// =============================================================================
// updateStaff
//
// SINGLE PATCH entry point — PATCH /api/staff/:id
//
// Updates only the section(s)/key(s) actually present on `data`. Everything
// runs inside one transaction (spans up to 5 tables), so a failure on any
// section rolls back the whole request rather than leaving a half-applied
// edit across tables.
//
//   data.account            → users
//   data.personal_details   → staff
//   data.employment_details → staff_employment_details
//   data.qualifications     → staff_qualifications (single row — column
//                              name `qualifications`, payload key `text`)
//   data.address             (array, full replace) → staff_addresses
//   data.other_details       → staff_other_details
//
// A key that is `undefined` (omitted by the client) is left completely
// untouched — including the address array, since `Array.isArray(undefined)`
// is false. Sending an empty array [] for address clears it.
//
// @param  {number} staffId
// @param  {Object} data — req.validatedBody from patchStaffSchema
// @throws {Error}  code "ER_NOT_FOUND" if the staff member doesn't exist
// =============================================================================
const updateStaff = async (staffId, data) => {
  const {
    account,
    personal_details,
    employment_details,
    qualifications,
    address,
    other_details,
  } = data;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock the row so we can safely resolve user_id and know the staff member exists.
    const [[staff]] = await connection.query(
      `SELECT id, user_id FROM staff WHERE id = ? LIMIT 1 FOR UPDATE`,
      [staffId]
    );
    if (!staff) {
      const err = new Error("Staff member not found.");
      err.code = "ER_NOT_FOUND";
      throw err;
    }

    // ---- users table (account — password excluded, has its own dedicated
    // endpoint) ------------------------------------------------------------
    if (account && Object.keys(account).length > 0) {
      const { setClause, values } = buildSetClause(account);
      await connection.query(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        [...values, staff.user_id]
      );
    }

    // ---- staff table (personal_details) -----------------------------------
    if (personal_details && Object.keys(personal_details).length > 0) {
      const { setClause, values } = buildSetClause(personal_details);
      await connection.query(
        `UPDATE staff SET ${setClause} WHERE id = ?`,
        [...values, staffId]
      );
    }

    // ---- staff_employment_details -------------------------------------------
    if (employment_details && Object.keys(employment_details).length > 0) {
      const { setClause, values } = buildSetClause(employment_details);
      await connection.query(
        `UPDATE staff_employment_details SET ${setClause} WHERE staff_id = ?`,
        [...values, staffId]
      );
    }

    // ---- staff_qualifications — single row, column name ("qualifications")
    // differs from the payload key ("text"), so buildSetClause() can't be
    // used generically here. -------------------------------------------------
    if (qualifications && Object.prototype.hasOwnProperty.call(qualifications, "text")) {
      await connection.query(
        `UPDATE staff_qualifications SET qualifications = ? WHERE staff_id = ?`,
        [sanitize(qualifications.text), staffId]
      );
    }

    // ---- staff_addresses (full replace) --------------------------------------
    if (Array.isArray(address)) {
      await connection.query(`DELETE FROM staff_addresses WHERE staff_id = ?`, [staffId]);
      for (const addr of address) {
        await connection.query(
          `INSERT INTO staff_addresses
             (staff_id, address_type, door_no, street, area,
              city, district, state, pin_code, country)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            staffId,
            addr.address_type,
            sanitize(addr.door_no),
            sanitize(addr.street),
            sanitize(addr.area),
            sanitize(addr.city),
            sanitize(addr.district),
            sanitize(addr.state),
            sanitize(addr.pin_code),
            sanitize(addr.country),
          ]
        );
      }
    }

    // ---- staff_other_details --------------------------------------------------
    if (other_details && Object.keys(other_details).length > 0) {
      const { setClause, values } = buildSetClause(other_details);
      await connection.query(
        `UPDATE staff_other_details SET ${setClause} WHERE staff_id = ?`,
        [...values, staffId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =============================================================================
// bulkUpdateStaffFields
//
// PATCH /api/staff/bulk — applies the SAME field values to MANY staff
// members at once (e.g. bulk-marking a set of staff inactive, or moving a
// group to a different employment_place in one shot).
//
// Any field left null/omitted is skipped entirely for ALL staff — it is
// never written as NULL, only ever left untouched, matching the semantics
// of the single-staff PATCH.
//
// @param  {number[]} staffIds
// @param  {Object}   data — req.validatedBody, flat shape:
//                           status, employment_place
// @returns {{updated_count:number, staff_ids:number[]}}
// @throws  {Error} code "ER_NOT_FOUND"  if any id doesn't exist
// @throws  {Error} code "ER_NO_FIELDS"  if every value provided was null
// =============================================================================
const bulkUpdateStaffFields = async (staffIds, data) => {
  const { status, employment_place } = data;

  // ---- users table fields -------------------------------------------------------
  const userFields = filterNonNull({ status });

  // ---- staff_employment_details table fields --------------------------------
  const employmentFields = filterNonNull({ employment_place });

  if (
    Object.keys(userFields).length === 0 &&
    Object.keys(employmentFields).length === 0
  ) {
    const err = new Error("No fields to update — every value provided was null.");
    err.code = "ER_NO_FIELDS";
    throw err;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify every id exists (and lock the rows) before writing anything —
    // a partial bulk update across a wrong id would be silently confusing.
    // Also grab user_id here since userFields (status) writes to the
    // `users` table, keyed by users.id, not staff.id.
    const [existingRows] = await connection.query(
      `SELECT id, user_id FROM staff WHERE id IN (?) FOR UPDATE`,
      [staffIds]
    );
    if (existingRows.length !== staffIds.length) {
      const foundIds = new Set(existingRows.map((r) => r.id));
      const missing  = staffIds.filter((id) => !foundIds.has(id));
      const err = new Error(`Staff id(s) not found: ${missing.join(", ")}`);
      err.code = "ER_NOT_FOUND";
      throw err;
    }

    if (Object.keys(userFields).length > 0) {
      const userIds = existingRows.map((r) => r.user_id);
      const { setClause, values } = buildSetClause(userFields);
      await connection.query(
        `UPDATE users SET ${setClause} WHERE id IN (?)`,
        [...values, userIds]
      );
    }

    if (Object.keys(employmentFields).length > 0) {
      const { setClause, values } = buildSetClause(employmentFields);
      await connection.query(
        `UPDATE staff_employment_details SET ${setClause} WHERE staff_id IN (?)`,
        [...values, staffIds]
      );
    }

    await connection.commit();
    return { updated_count: staffIds.length, staff_ids: staffIds };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =============================================================================
// findStaffById
//
// Returns the full staff record joined across all child tables.
// @param  {number} id — staff.id (PK)
// @returns {Object|undefined}
// =============================================================================
const findStaffById = async (id) => {

  const [[staff]] = await pool.query(
    `SELECT
       s.name, s.staff_uid, s.short_name, s.salutation, s.gender,
       s.dob, s.blood_group, s.mobile_number, s.emergency_contact,
       s.personal_email, s.religion_id, s.marital_status,
       s.medical_remarks, s.photo_url, s.date_of_joining,
       u.user_id, u.email, u.role, u.status,
       ed.staff_type, ed.designation, ed.experience_years,
       ed.employment_nature, ed.employment_place, ed.university_id,
       ed.university_designation, ed.university_experience,
       ed.work_email, ed.notes,
       sq.qualifications,
       od.aadhar_no, od.aadhar_doc_url, od.pan_no, od.pan_doc_url
     FROM staff s
     JOIN  users                      u  ON u.id       = s.user_id
     LEFT JOIN staff_employment_details ed ON ed.staff_id = s.id
     LEFT JOIN staff_qualifications     sq ON sq.staff_id = s.id
     LEFT JOIN staff_other_details      od ON od.staff_id = s.id
     WHERE s.id = ?
     LIMIT 1`,
    [id]
  );

  if (!staff) return undefined;

  const [[addresses]] = await Promise.all([
    pool.query(
      `SELECT address_type, door_no, street, area, city, district, state, pin_code, country
       FROM staff_addresses WHERE staff_id = ?`,
      [id]
    ),
  ]);

  return {
    account : {
      user_id : staff.user_id,
      email   : staff.email,
      role    : staff.role,
      status  : staff.status,
    },

    personal_details : {
      name              : staff.name,
      staff_uid         : staff.staff_uid,
      short_name        : staff.short_name,
      salutation        : staff.salutation,
      gender            : staff.gender,
      dob               : staff.dob,
      blood_group       : staff.blood_group,
      mobile_number     : staff.mobile_number,
      emergency_contact : staff.emergency_contact,
      personal_email    : staff.personal_email,
      religion_id       : staff.religion_id,
      marital_status    : staff.marital_status,
      medical_remarks   : staff.medical_remarks,
      photo_url         : staff.photo_url,
      date_of_joining   : staff.date_of_joining,
    },

    employment_details : {
      staff_type              : staff.staff_type,
      designation              : staff.designation,
      experience_years         : staff.experience_years !== null ? parseFloat(staff.experience_years) : null,
      employment_nature        : staff.employment_nature,
      employment_place         : staff.employment_place,
      university_id            : staff.university_id,
      university_designation   : staff.university_designation,
      university_experience    : staff.university_experience !== null ? parseFloat(staff.university_experience) : null,
      work_email                : staff.work_email,
      notes                     : staff.notes,
    },

    qualifications : {
      text : staff.qualifications,
    },

    address : addresses,

    other_details : {
      aadhar_no      : staff.aadhar_no,
      aadhar_doc_url : staff.aadhar_doc_url,
      pan_no         : staff.pan_no,
      pan_doc_url    : staff.pan_doc_url,
    },
  };
};

// =============================================================================
// getAllStaff
//
// Lightweight listing — only master row + user role/status, no child tables.
// @returns {Array}
// =============================================================================
const getAllStaff = async () => {
  const [rows] = await pool.query(
    `SELECT s.id, s.staff_uid, s.short_name, s.name, s.date_of_joining,
            u.user_id, u.email, u.role, u.status
     FROM staff s
     JOIN users u ON u.id = s.user_id
     ORDER BY s.id DESC`
  );
  return rows;
};

// =============================================================================
// getStaffByFilters
// Supports ?staff_type=&employment_place=&status= query params.
// =============================================================================
const ALLOWED_FILTERS = new Set(["staff_type", "employment_place", "designation", "status"]);

const getStaffByFilters = async (filters) => {
  let sql = `
    SELECT s.id, s.staff_uid, s.short_name, s.name, s.date_of_joining,
           u.user_id, u.email, u.role, u.status
    FROM staff s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN staff_employment_details ed ON ed.staff_id = s.id
    WHERE 1=1
  `;
  const values = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (ALLOWED_FILTERS.has(key) && value !== undefined && value !== null && value !== "") {
      if (key === "status") {
        sql += ` AND u.status = ?`;
      } else {
        sql += ` AND ed.${key} = ?`;
      }
      values.push(value);
    }
  });

  sql += " ORDER BY s.id DESC";
  const [rows] = await pool.query(sql, values);
  return rows;
};

// =============================================================================
// buildStaffListQuery (private)
//
// Shared WHERE-clause builder for getStaffList / countStaffList so the two
// always stay in sync (same filters ⇒ same denominator for pagination).
//
// Joins:
//   users                      u  — email, status
//   staff_employment_details   ed — staff_type, employment_place, designation
//
// Filters:
//   staff_type       → ed.staff_type
//   employment_place → ed.employment_place
//   designation      → ed.designation
//   status           → u.status
//
// Search (q) — matches ANY of: s.name, s.staff_uid, ed.work_email
// =============================================================================
const buildStaffListQuery = ({ staff_type, employment_place, designation, status, q }) => {
  let joinAndWhere = `
    FROM staff s
    JOIN users u                            ON u.id = s.user_id
    LEFT JOIN staff_employment_details ed   ON ed.staff_id = s.id
    WHERE 1=1
  `;
  const values = [];

  if (staff_type)       { joinAndWhere += " AND ed.staff_type = ?";       values.push(staff_type);       }
  if (employment_place)  { joinAndWhere += " AND ed.employment_place = ?"; values.push(employment_place); }
  if (designation)       { joinAndWhere += " AND ed.designation = ?";     values.push(designation);      }
  if (status)            { joinAndWhere += " AND u.status = ?";           values.push(status);           }

  if (q) {
    joinAndWhere += " AND (s.name LIKE ? OR s.staff_uid LIKE ? OR ed.work_email LIKE ?)";
    const term = `%${q}%`;
    values.push(term, term, term);
  }

  return { joinAndWhere, values };
};

// =============================================================================
// getStaffList
//
// Paginated staff directory for listing/search screens.
// Returns: id, photo_url, name, staff_uid, staff_type, designation,
//          employment_place, email, status
// =============================================================================
const getStaffList = async (filters) => {
  const { joinAndWhere, values } = buildStaffListQuery(filters);

  const sql = `
    SELECT s.id, s.photo_url, s.name, s.staff_uid,
           ed.staff_type, ed.designation, ed.employment_place,
           u.email, u.status
    ${joinAndWhere}
    ORDER BY s.id DESC
    LIMIT ? OFFSET ?
  `;
  values.push(Number(filters.limit), Number(filters.offset));

  const [rows] = await pool.query(sql, values);
  return rows;
};

// =============================================================================
// countStaffList
//
// Row count for the same filter set as getStaffList, used for pagination
// meta (total / totalPages).
// =============================================================================
const countStaffList = async (filters) => {
  const { joinAndWhere, values } = buildStaffListQuery(filters);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(DISTINCT s.id) AS total ${joinAndWhere}`,
    values
  );
  return total;
};

module.exports = {
  createStaff,
  findStaffById,
  getAllStaff,
  getStaffByFilters,
  getStaffList,
  countStaffList,

  // single PATCH function
  updateStaff,

    // bulk update
    bulkUpdateStaffFields,
};