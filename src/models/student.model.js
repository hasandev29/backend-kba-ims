// src/models/student.model.js
//
// Executes every INSERT for a new student inside a single MySQL transaction.
// If any step fails the entire transaction is rolled back automatically,
// leaving the database in a clean state.
//
// Two private helpers handle the most common data quality bugs:
//
//   sanitize() — converts the string "null" / "" to actual SQL NULL so that
//                payloads like { medical_remarks: "null" } do not get stored
//                as the literal word "null" in the database.
//
//   toBool()   — strictly maps truthy-like values to 1 or 0 for TINYINT(1)
//                columns. The naive (val ? 1 : 0) is NOT safe because the
//                string "false" evaluates as truthy in JavaScript.
//
// SECTION-EDIT FUNCTIONS (added)
//   One function per editable section, matching the one-table-per-section
//   split used by the PATCH routes:
//     updateStudentInfo      — users + students        (transaction, 2 tables)
//     updateOtherDetails     — student_other_details    (single UPDATE)
//     updateAcademicDetails  — student_academic_details (single UPDATE)
//     updateFamilyDetails    — student_family_details   (single UPDATE)
//     updateAdmissionDetails — student_admission_details(single UPDATE)
//     replaceAddresses       — student_addresses        (delete + re-insert)
//     replaceQualifications  — student_qualifications   (delete + re-insert)
//     replaceRelatedLinks    — student_related_links     (delete + re-insert)
//
//   All of them only touch the columns actually present in the payload —
//   buildSetClause() below builds "col = ?, col2 = ?" purely from
//   Object.keys(data), so an omitted field is left untouched in the DB
//   rather than being reset to NULL/0. Because the section schemas in
//   student.validator.js use .unknown(false) and no unexpected keys can slip
//   through, it's safe to use those keys directly as column names.
// =============================================================================

"use strict";

const bcrypt   = require("bcryptjs");
const { pool } = require("../config/db");
const { createEnrollment } = require("./studentAcademicEnrollment.model");

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
// buildSetClause (private)
// Builds a dynamic "col = ?, col2 = ?" SET clause + matching values array
// from ONLY the keys present on `data`. Used by every section PATCH so an
// omitted field is left untouched instead of being overwritten with NULL/0.
//
// @param  {Object}   data       — validated req.validatedBody (or a slice of it)
// @param  {string[]} boolFields — keys that must go through toBool() instead
//                                 of sanitize() (TINYINT(1) columns)
// -----------------------------------------------------------------------------
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

const buildSetClause = (data, boolFields = []) => {
  const keys = Object.keys(data);
  const setClause = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) =>
    boolFields.includes(key) ? toBool(data[key]) : sanitize(data[key])
  );
  return { keys, setClause, values };
};

// =============================================================================
// createStudent
//
// @param  {Object} studentData — validated + sanitized payload (req.validatedBody)
// @returns {number}            — auto-increment PK of the new students row
// =============================================================================
const createStudent = async (studentData) => {

  const {
    classroom_id,
    account,
    personal_details,
    other_details,
    academic_details,
    family_details,
    address,
    qualifications,
    extra_qualifications,
    admission_details,
    related_links,
  } = studentData;

  // Acquire a dedicated connection so we can manage the transaction manually.
  // The connection is always released in the finally block.
  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();

    // -------------------------------------------------------------------------
    // STEP 1 — Hash the password before any DB work
    // -------------------------------------------------------------------------
    const hashedPassword = await bcrypt.hash(account.password, 10);

    // -------------------------------------------------------------------------
    // STEP 2 — Insert into `users`
    // -------------------------------------------------------------------------
    const [userResult] = await connection.query(
      `INSERT INTO users (user_id, email, role, status, password)
       VALUES (?, ?, ?, ?, ?)`,
      [
        account.user_id,
        sanitize(account.email),
        account.role,
        account.status ?? "active",
        hashedPassword,
      ]
    );

    const userId = userResult.insertId;

    // -------------------------------------------------------------------------
    // STEP 3 — Insert master row into `students`
    // -------------------------------------------------------------------------
    // classroom_id intentionally NOT part of this INSERT — students no
    // longer tracks classroom directly. It's used below only to create the
    // initial student_academic_enrollments row.
    const [studentResult] = await connection.query(
      `INSERT INTO students
         (user_id, name, roll_number, dob, gender,
          batch_id, blood_group, mother_tongue,
          is_hostel, photo_url, mobile_number, academic_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        personal_details.name,
        personal_details.roll_number,
        personal_details.dob,
        personal_details.gender      ?? 1,
        personal_details.batch_id,
        personal_details.blood_group ?? null,
        sanitize(personal_details.mother_tongue),
        toBool(personal_details.is_hostel),
        sanitize(personal_details.photo_url),
        sanitize(personal_details.mobile_number),
        personal_details.academic_status,
      ]
    );
    const studentId = studentResult.insertId;

    // -------------------------------------------------------------------------
    // STEP 3.5 — student_academic_enrollments (1 row for this academic year)
    // Resolves academic_year_id from studentData if supplied, otherwise falls
    // back to the academic_years row with is_current = 1. Reuses
    // createEnrollment() from studentAcademicEnrollment.model.js, passing
    // `connection` so the insert is part of this same transaction.
    // -------------------------------------------------------------------------
    let academicYearId = studentData.academic_year_id;

    if (!academicYearId) {
      const [[currentYear]] = await connection.query(
        `SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1`
      );
      if (!currentYear) {
        const err = new Error(
          "No current academic year is configured, and none was provided in the request."
        );
        err.code = "ER_NO_CURRENT_ACADEMIC_YEAR";
        throw err;
      }
      academicYearId = currentYear.id;
    }

    await createEnrollment(
      {
        academic_year_id  : academicYearId,
        student_id        : studentId,
        classroom_id,
        enrollment_status : "active",
      },
      connection
    );

    // -------------------------------------------------------------------------
    // STEP 4 — student_other_details  (1:1)
    // -------------------------------------------------------------------------
    await connection.query(
      `INSERT INTO student_other_details
         (student_id, religion_id, caste_id, social_category_id,
          madhab_id, is_orphan, aadhar_no, medical_remarks, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        other_details.religion_id        ?? null,
        other_details.caste_id           ?? null,
        other_details.social_category_id ?? null,
        other_details.madhab_id          ?? null,
        toBool(other_details.is_orphan),
        sanitize(other_details.aadhar_no),
        sanitize(other_details.medical_remarks),
        sanitize(other_details.notes),  
      ]
    );

    // -------------------------------------------------------------------------
    // STEP 5 — student_academic_details  (1:1)
    // -------------------------------------------------------------------------
    await connection.query(
      `INSERT INTO student_academic_details
         (student_id, rrn, univ_email, yoj, yoc,
          madras_course, madras_roll_no, madras_joining_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        sanitize(academic_details.rrn),
        sanitize(academic_details.univ_email),
        academic_details.yoj?? null,
        academic_details.yoc?? null,
        sanitize(academic_details.madras_course),
        sanitize(academic_details.madras_roll_no),
        academic_details.madras_joining_year?? null,
      ]
    );

    // -------------------------------------------------------------------------
    // STEP 6 — student_family_details  (1:1)
    // -------------------------------------------------------------------------
    await connection.query(
      `INSERT INTO student_family_details
         (student_id,
          father_name, father_mobile, father_education,
          father_occupation, father_annual_income,
          mother_name, mother_mobile, mother_education,
          mother_occupation, mother_annual_income,
          parent_email, parent_whatsapp, parent_sms,
          guardian_name, guardian_mobile,
          guardian_relationship, guardian_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        sanitize(family_details.father_name),
        sanitize(family_details.father_mobile),
        sanitize(family_details.father_education),
        sanitize(family_details.father_occupation),
        family_details.father_annual_income ?? null,
        sanitize(family_details.mother_name),
        sanitize(family_details.mother_mobile),
        sanitize(family_details.mother_education),
        sanitize(family_details.mother_occupation),
        family_details.mother_annual_income ?? null,
        sanitize(family_details.parent_email),
        sanitize(family_details.parent_whatsapp),
        sanitize(family_details.parent_sms),
        sanitize(family_details.guardian_name),
        sanitize(family_details.guardian_mobile),
        sanitize(family_details.guardian_relationship),
        sanitize(family_details.guardian_address),
      ]
    );

    // -------------------------------------------------------------------------
    // STEP 7 — addresses  (1:N)
    // -------------------------------------------------------------------------
    if (Array.isArray(address) && address.length > 0) {
      for (const addr of address) {
        await connection.query(
          `INSERT INTO student_addresses
             (student_id, address_type, door_no, street, area,
              city, district, state, country, pin_code)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            studentId,
            addr.address_type,
            sanitize(addr.door_no),
            sanitize(addr.street),
            sanitize(addr.area),
            sanitize(addr.city),
            sanitize(addr.district),
            sanitize(addr.state),
            sanitize(addr.country),
            sanitize(addr.pin_code),
          ]
        );
      }
    }

    // -------------------------------------------------------------------------
    // STEP 8 — qualifications  (1:N)
    // -------------------------------------------------------------------------
    if (Array.isArray(qualifications) && qualifications.length > 0) {
      for (const qual of qualifications) {
        await connection.query(
          `INSERT INTO student_qualifications
             (student_id, level, school_name, board, medium,
              passing_year, passing_month, school_address,
              reg_number, marks, total_marks, emis)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            studentId,
            qual.level,
            sanitize(qual.school_name),
            sanitize(qual.board),
            sanitize(qual.medium),
            qual.passing_year    ?? null,
            sanitize(qual.passing_month),
            sanitize(qual.school_address),
            sanitize(qual.reg_number),
            qual.marks           ?? null,
            qual.total_marks     ?? null,
            sanitize(qual.emis),
          ]
        );
      }
    }

    // -------------------------------------------------------------------------
    // STEP 9 — student_extra_qualifications  (1:N)
    // -------------------------------------------------------------------------
    if (Array.isArray(extra_qualifications) && extra_qualifications.length > 0) {
      for (const eq of extra_qualifications) {
        await connection.query(
          `INSERT INTO student_extra_qualifications
             (student_id, course_name, cert_url)
           VALUES (?, ?, ?)`,
          [
            studentId,
            eq.course_name,
            sanitize(eq.cert_url),
          ]
        );
      }
    }

    // -------------------------------------------------------------------------
    // STEP 10 — student_admission_details  (1:1)
    // -------------------------------------------------------------------------
    await connection.query(
      `INSERT INTO student_admission_details
         (student_id, admission_date, entrance_mark,
          entrance_rank, hafiz, recommended_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        sanitize(admission_details.admission_date),
        admission_details.entrance_mark ?? null,
        admission_details.entrance_rank ?? null,
        toBool(admission_details.hafiz),
        sanitize(admission_details.recommended_by),
      ]
    );

    // -------------------------------------------------------------------------
    // STEP 11 — student_related_links  (1:N)
    // -------------------------------------------------------------------------
    if (Array.isArray(related_links) && related_links.length > 0) {
      for (const link of related_links) {
        await connection.query(
          `INSERT INTO student_related_links
             (student_id, description, url)
           VALUES (?, ?, ?)`,
          [
            studentId,
            link.description,
            link.url,
          ]
        );
      }
    }

    // All 11 steps succeeded — make every insert permanent
    await connection.commit();

    return studentId;

  } catch (error) {

    await connection.rollback();
    throw error;

  } finally {

    connection.release();
  }
};

// =============================================================================
// bulkCreateStudents
//
// Creates `total_students` students in ONE transaction, roll numbers running
// starting_roll_number .. starting_roll_number + total_students - 1.
//
//   user_id / login = roll_number (string)
//   password         = shared BULK_DEFAULT_PASSWORD for the whole batch
//                       (students must change it on first login — enforce
//                       that at the auth layer, not here)
//   name             = roll_number (placeholder — student replaces it later)
//
// Also inserts an empty row into every 1:1 detail table (other/academic/
// family/admission) for each student. This is required because the section
// PATCH handlers run UPDATE, not INSERT ... ON DUPLICATE — without a row
// already present, a student's first PATCH after login would update 0 rows.
//
// @param  {Object} data
// @param  {number} data.classroom_id
// @param  {number} data.batch_id
// @param  {boolean} data.is_hostel
// @param  {number} data.starting_roll_number
// @param  {number} data.total_students
// @returns {Array<{student_id:number, roll_number:string, user_id:string}>}
// =============================================================================
// Shared default password for every bulk-created login. Hashed ONCE per
// batch instead of once per student (was the main per-row cost). Students
// are expected to change this on first login — enforce that at the auth
// layer (e.g. a must_reset_password flag on users), not in this function.
const BULK_DEFAULT_PASSWORD = "kba@123";

const bulkCreateStudents = async (data) => {
  const { classroom_id, batch_id, is_hostel, starting_roll_number, total_students } = data;
  const hostelFlag = toBool(is_hostel);

  const rollNumbers = Array.from(
    { length: total_students },
    (_, i) => String(starting_roll_number + i)
  );

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(BULK_DEFAULT_PASSWORD, 10);

    // ---- resolve academic_year_id up front — same rule as createStudent:
    // explicit value wins, otherwise fall back to is_current = 1 ------------
    let academicYearId = data.academic_year_id;
    if (!academicYearId) {
      const [[currentYear]] = await connection.query(
        `SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1`
      );
      if (!currentYear) {
        const err = new Error(
          "No current academic year is configured, and none was provided in the request."
        );
        err.code = "ER_NO_CURRENT_ACADEMIC_YEAR";
        throw err;
      }
      academicYearId = currentYear.id;
    }

    // ---- users: 1 multi-row INSERT instead of N single-row INSERTs -----------
    await connection.query(
      `INSERT INTO users (user_id, email, role, status, password) VALUES ?`,
      [rollNumbers.map((roll) => [roll, null, "student", "active", hashedPassword])]
    );

    // Authoritative user_id -> users.id map. Deliberately NOT using
    // insertId + offset — MySQL 8's default innodb_autoinc_lock_mode (2)
    // only guarantees increasing ids for a multi-row insert, not contiguous
    // ones, if another connection interleaves an insert into `users` at the
    // same time. This SELECT is the only way to get the real mapping.
    const [userRows] = await connection.query(
      `SELECT id, user_id FROM users WHERE user_id IN (?)`,
      [rollNumbers]
    );
    const userIdByRoll = new Map(userRows.map((r) => [r.user_id, r.id]));

    // ---- students: 1 multi-row INSERT -----------------------------------------
    // classroom_id intentionally excluded — it's written only to
    // student_academic_enrollments below, not to students anymore.
    await connection.query(
      `INSERT INTO students
         (user_id, name, roll_number, dob, gender,
          batch_id, blood_group, mother_tongue,
          is_hostel, photo_url, mobile_number, academic_status)
       VALUES ?`,
      [rollNumbers.map((roll) => [
        userIdByRoll.get(roll),
        roll, // placeholder name — student fills their real name in later
        roll,
        null,
        1,
        batch_id,
        null,
        null,
        hostelFlag,
        null,
        null,
        "studying",
      ])]
    );

    // Same reasoning as above — resolve real student ids via SELECT, not
    // insertId + offset. Scoped by classroom_id + this batch's roll numbers
    // so it can't accidentally pick up an unrelated student with the same
    // roll number in a different classroom.
    // classroom_id is no longer a column on students, so scope this lookup by
    // batch_id instead — combined with the roll numbers just inserted in
    // this same transaction, that's more than enough to isolate this batch.
    const [studentRows] = await connection.query(
      `SELECT id, roll_number FROM students WHERE roll_number IN (?) AND batch_id = ?`,
      [rollNumbers, batch_id]
    );
    const studentIdByRoll = new Map(studentRows.map((r) => [r.roll_number, r.id]));
    const studentIds = rollNumbers.map((roll) => studentIdByRoll.get(roll));

    // ---- empty 1:1 detail rows, so later section PATCH UPDATEs have a target ----
    await connection.query(
      `INSERT INTO student_other_details
         (student_id, religion_id, caste_id, social_category_id,
          madhab_id, is_orphan, aadhar_no, medical_remarks, notes)
       VALUES ?`,
      [studentIds.map((id) => [id, null, null, null, null, 0, null, null, null])]
    );

    await connection.query(
      `INSERT INTO student_academic_details
         (student_id, rrn, univ_email, yoj, yoc,
          madras_course, madras_roll_no, madras_joining_year)
       VALUES ?`,
      [studentIds.map((id) => [id, null, null, null, null, null, null, null])]
    );

    await connection.query(
      `INSERT INTO student_family_details
         (student_id,
          father_name, father_mobile, father_education,
          father_occupation, father_annual_income,
          mother_name, mother_mobile, mother_education,
          mother_occupation, mother_annual_income,
          parent_email, parent_whatsapp, parent_sms,
          guardian_name, guardian_mobile,
          guardian_relationship, guardian_address)
       VALUES ?`,
      [studentIds.map((id) => [
        id, null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null,
      ])]
    );

    await connection.query(
      `INSERT INTO student_admission_details
         (student_id, admission_date, entrance_mark,
          entrance_rank, hafiz, recommended_by)
       VALUES ?`,
      [studentIds.map((id) => [id, null, null, null, 0, null])]
    );

    // Fixed 2-row address set (0=Present, 1=Permanent) per student, still
    // just one round trip for the whole batch.
    await connection.query(
      `INSERT INTO student_addresses (student_id, address_type) VALUES ?`,
      [studentIds.flatMap((id) => [[id, 0], [id, 1]])]
    );

    // Fixed 3-row qualification set (10th/11th/12th) per student, still
    // just one round trip for the whole batch.
    await connection.query(
      `INSERT INTO student_qualifications (student_id, level) VALUES ?`,
      [studentIds.flatMap((id) => [[id, "10th"], [id, "11th"], [id, "12th"]])]
    );

    // ---- student_academic_enrollments: 1 multi-row INSERT ----------------------
    // Not routed through studentAcademicEnrollment.model.js's createEnrollment()
    // here — that function inserts one row per call, which would mean
    // `total_students` round trips inside this transaction and would undo
    // the whole point of this function being bulk multi-row inserts.
    await connection.query(
      `INSERT INTO student_academic_enrollments
         (academic_year_id, student_id, classroom_id, enrollment_status)
       VALUES ?`,
      [studentIds.map((id) => [academicYearId, id, classroom_id, "active"])]
    );

    await connection.commit();

    return rollNumbers.map((roll) => ({
      student_id  : studentIdByRoll.get(roll),
      roll_number : roll,
      user_id     : roll,
    }));

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =============================================================================
// updateStudent
//
// SINGLE PATCH entry point — PATCH /api/students/:id
//
// Updates only the section(s)/key(s) actually present on `data`. Everything
// runs inside one transaction (spans up to 10 tables), so a failure on any
// section rolls back the whole request rather than leaving a half-applied
// edit across tables.
//
//   data.account / data.personal_details / data.classroom_id → users + students
//   data.other_details                                        → student_other_details
//   data.academic_details                                     → student_academic_details
//   data.family_details                                       → student_family_details
//   data.admission_details                                    → student_admission_details
//   data.address              (array, full replace)           → student_addresses
//   data.qualifications       (array, full replace)           → student_qualifications
//   data.extra_qualifications (array, full replace)           → student_extra_qualifications
//   data.related_links        (array, full replace)           → student_related_links
//
// A key that is `undefined` (omitted by the client) is left completely
// untouched — including array keys, since `Array.isArray(undefined)` is
// false. Sending an empty array [] for a list section clears it.
//
// @param  {number} studentId
// @param  {Object} data — req.validatedBody from patchStudentSchema
// @throws {Error}  code "ER_NOT_FOUND" if the student doesn't exist
// =============================================================================
const updateStudent = async (studentId, data) => {
  const {
    account,
    personal_details,
    other_details,
    academic_details,
    family_details,
    address,
    qualifications,
    extra_qualifications,
    admission_details,
    related_links,
  } = data;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock the row so we can safely resolve user_id and know the student exists.
    const [[student]] = await connection.query(
      `SELECT id, user_id FROM students WHERE id = ? LIMIT 1 FOR UPDATE`,
      [studentId]
    );
    if (!student) {
      const err = new Error("Student not found.");
      err.code = "ER_NOT_FOUND";
      throw err;
    }

    // ---- users table (account / credentials — password excluded, has its
    // own dedicated endpoint) --------------------------------------------------
    if (account && Object.keys(account).length > 0) {
      const { setClause, values } = buildSetClause(account);
      await connection.query(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        [...values, student.user_id]
      );
    }

    // ---- students table (personal_details only — classroom no longer
    // lives here; use PATCH /api/students/promote instead) --------------------
    const studentFields = { ...(personal_details || {}) };

    if (Object.keys(studentFields).length > 0) {
      const { setClause, values } = buildSetClause(studentFields, ["is_hostel"]);
      await connection.query(
        `UPDATE students SET ${setClause} WHERE id = ?`,
        [...values, studentId]
      );
    }

    // ---- student_other_details -----------------------------------------------
    if (other_details && Object.keys(other_details).length > 0) {
      const { setClause, values } = buildSetClause(other_details, ["is_orphan"]);
      await connection.query(
        `UPDATE student_other_details SET ${setClause} WHERE student_id = ?`,
        [...values, studentId]
      );
    }

    // ---- student_academic_details ---------------------------------------------
    if (academic_details && Object.keys(academic_details).length > 0) {
      const { setClause, values } = buildSetClause(academic_details);
      await connection.query(
        `UPDATE student_academic_details SET ${setClause} WHERE student_id = ?`,
        [...values, studentId]
      );
    }

    // ---- student_family_details -------------------------------------------------
    if (family_details && Object.keys(family_details).length > 0) {
      const { setClause, values } = buildSetClause(family_details);
      await connection.query(
        `UPDATE student_family_details SET ${setClause} WHERE student_id = ?`,
        [...values, studentId]
      );
    }

    // ---- student_admission_details ----------------------------------------------
    if (admission_details && Object.keys(admission_details).length > 0) {
      const { setClause, values } = buildSetClause(admission_details, ["hafiz"]);
      await connection.query(
        `UPDATE student_admission_details SET ${setClause} WHERE student_id = ?`,
        [...values, studentId]
      );
    }

    // ---- student_addresses (update-only — fixed 2-row set, id required) --------
    // Addresses are created once in createStudent and never added/removed
    // afterward, so a PATCH must always update an existing row by id.
    // A missing id, or an id that doesn't belong to this student, is a hard
    // error rather than a silent no-op or an accidental new row.
    if (Array.isArray(address)) {
      for (const addr of address) {
        if (!addr.id) {
          const err = new Error("address.id is required when updating an address.");
          err.code = "ER_MISSING_ID";
          throw err;
        }

        const [result] = await connection.query(
          `UPDATE student_addresses
             SET address_type = ?, door_no = ?, street = ?, area = ?,
                 city = ?, district = ?, state = ?, country = ?, pin_code = ?
           WHERE id = ? AND student_id = ?`,
          [
            addr.address_type,
            sanitize(addr.door_no),
            sanitize(addr.street),
            sanitize(addr.area),
            sanitize(addr.city),
            sanitize(addr.district),
            sanitize(addr.state),
            sanitize(addr.country),
            sanitize(addr.pin_code),
            addr.id,
            studentId,
          ]
        );

        // affectedRows === 0 is ambiguous: either the id doesn't belong to
        // this student, or every value sent matched what's already stored.
        // Disambiguate with an explicit existence check.
        if (result.affectedRows === 0) {
          const [[exists]] = await connection.query(
            `SELECT id FROM student_addresses WHERE id = ? AND student_id = ? LIMIT 1`,
            [addr.id, studentId]
          );
          if (!exists) {
            const err = new Error(`Address id ${addr.id} does not belong to this student.`);
            err.code = "ER_NOT_FOUND";
            throw err;
          }
          // row exists, values were just unchanged — not an error
        }
      }
    }

// ---- student_qualifications (update-only — fixed 3-row set, id required) ---
    // Qualifications (10th/11th/12th) are created once in createStudent and
    // never added/removed afterward, so a PATCH must always update an
    // existing row by id, same rationale as student_addresses above.
    if (Array.isArray(qualifications)) {
      for (const qual of qualifications) {
        if (!qual.id) {
          const err = new Error("qualifications.id is required when updating a qualification.");
          err.code = "ER_MISSING_ID";
          throw err;
        }

        const [result] = await connection.query(
          `UPDATE student_qualifications
             SET level = ?, school_name = ?, board = ?, medium = ?,
                 passing_year = ?, passing_month = ?, school_address = ?,
                 reg_number = ?, marks = ?, total_marks = ?, emis = ?
           WHERE id = ? AND student_id = ?`,
          [
            qual.level,
            sanitize(qual.school_name),
            sanitize(qual.board),
            sanitize(qual.medium),
            qual.passing_year ?? null,
            sanitize(qual.passing_month),
            sanitize(qual.school_address),
            sanitize(qual.reg_number),
            qual.marks ?? null,
            qual.total_marks ?? null,
            sanitize(qual.emis),
            qual.id,
            studentId,
          ]
        );

        if (result.affectedRows === 0) {
          const [[exists]] = await connection.query(
            `SELECT id FROM student_qualifications WHERE id = ? AND student_id = ? LIMIT 1`,
            [qual.id, studentId]
          );
          if (!exists) {
            const err = new Error(`Qualification id ${qual.id} does not belong to this student.`);
            err.code = "ER_NOT_FOUND";
            throw err;
          }
        }
      }
    }

    // ---- student_extra_qualifications (full replace) — NEW -----------------------
    if (Array.isArray(extra_qualifications)) {
      await connection.query(`DELETE FROM student_extra_qualifications WHERE student_id = ?`, [studentId]);
      for (const eq of extra_qualifications) {
        await connection.query(
          `INSERT INTO student_extra_qualifications (student_id, course_name, cert_url) VALUES (?, ?, ?)`,
          [studentId, eq.course_name, sanitize(eq.cert_url)]
        );
      }
    }

    // ---- student_related_links (full replace) -------------------------------------
    if (Array.isArray(related_links)) {
      await connection.query(`DELETE FROM student_related_links WHERE student_id = ?`, [studentId]);
      for (const link of related_links) {
        await connection.query(
          `INSERT INTO student_related_links (student_id, description, url) VALUES (?, ?, ?)`,
          [studentId, link.description, link.url]
        );
      }
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
// bulkUpdateStudentFields
//
// PATCH /api/students/bulk — applies the SAME field values to MANY students
// at once (e.g. moving a set of students to a new classroom/batch, or
// setting madras_joining_year for a batch in one shot).
//
// Any field left null/omitted is skipped entirely for ALL students — it is
// never written as NULL, only ever left untouched, matching the semantics
// of the single-student PATCH.
//
// @param  {number[]} studentIds
// @param  {Object}   data — req.validatedBody, flat shape:
//                           classroom_id, batch_id, status, is_hostel,
//                           academic_status, madhab_id, yoj, madras_course,
//                           madras_joining_year
// @returns {{updated_count:number, student_ids:number[]}}
// @throws  {Error} code "ER_NOT_FOUND"  if any id doesn't exist
// @throws  {Error} code "ER_NO_FIELDS"  if every value provided was null
// =============================================================================
const bulkUpdateStudentFields = async (studentIds, data) => {
  const {
    batch_id,
    status,
    is_hostel,
    academic_status,
    madhab_id,
    yoj,
    madras_course,
    madras_joining_year,
  } = data;

  // ---- users table fields -------------------------------------------------------
  const userFields = filterNonNull({ status });

  // ---- students table fields (classroom_id removed — use
  // PATCH /api/students/promote for classroom moves) --------------------------
  const studentFields = filterNonNull({ batch_id, is_hostel, academic_status });

  // ---- child table fields — null-valued keys dropped, not nulled out ----------
  const otherFields    = filterNonNull({ madhab_id });
  const academicFields = filterNonNull({ yoj, madras_course, madras_joining_year });

  if (
    Object.keys(userFields).length === 0 &&
    Object.keys(studentFields).length === 0 &&
    Object.keys(otherFields).length === 0 &&
    Object.keys(academicFields).length === 0
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
    // Also grab user_id here since userFields (account.status) writes to
    // the `users` table, keyed by users.id, not students.id.
    const [existingRows] = await connection.query(
      `SELECT id, user_id FROM students WHERE id IN (?) FOR UPDATE`,
      [studentIds]
    );
    if (existingRows.length !== studentIds.length) {
      const foundIds = new Set(existingRows.map((r) => r.id));
      const missing  = studentIds.filter((id) => !foundIds.has(id));
      const err = new Error(`Student id(s) not found: ${missing.join(", ")}`);
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

    if (Object.keys(studentFields).length > 0) {
      const { setClause, values } = buildSetClause(studentFields, ["is_hostel"]);
      await connection.query(
        `UPDATE students SET ${setClause} WHERE id IN (?)`,
        [...values, studentIds]
      );
    }

    if (Object.keys(otherFields).length > 0) {
      const { setClause, values } = buildSetClause(otherFields);
      await connection.query(
        `UPDATE student_other_details SET ${setClause} WHERE student_id IN (?)`,
        [...values, studentIds]
      );
    }

    if (Object.keys(academicFields).length > 0) {
      const { setClause, values } = buildSetClause(academicFields);
      await connection.query(
        `UPDATE student_academic_details SET ${setClause} WHERE student_id IN (?)`,
        [...values, studentIds]
      );
    }

    await connection.commit();
    return { updated_count: studentIds.length, student_ids: studentIds };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =============================================================================
// findStudentById
//
// Returns the full student record joined across all child tables.
// @param  {number} id — students.id (PK)
// @returns {Object|undefined}
// =============================================================================
const findStudentById = async (id) => {

  // Single JOIN query replaces 5 separate round-trips for all 1:1 tables.
  // student_academic_enrollments (sae) is joined against whichever
  // academic_years (ay) row has is_current = 1, so classroom_id below
  // always reflects the student's placement for the CURRENT academic year
  // only — never an arbitrary/explicit one.
  const [[student]] = await pool.query(
    `SELECT
       s.name, s.roll_number, s.dob, s.gender,
       s.batch_id, s.blood_group, s.mother_tongue,
       bt.batch_name AS batch_name,
       co.id AS course_id, co.name AS course_name,
       co.is_default AS course_is_default, co.is_active AS course_is_active,
       s.is_hostel, s.photo_url, s.mobile_number, s.academic_status,
       u.user_id, u.email, u.role, u.status,
       od.religion_id, od.caste_id, od.social_category_id,
       od.madhab_id, od.is_orphan, od.aadhar_no,
       od.medical_remarks, od.notes,
       ac.rrn, ac.univ_email, ac.yoj, ac.yoc,
       ac.madras_course, ac.madras_roll_no, ac.madras_joining_year,
       fd.father_name, fd.father_mobile, fd.father_education,
       fd.father_occupation, fd.father_annual_income,
       fd.mother_name, fd.mother_mobile, fd.mother_education,
       fd.mother_occupation, fd.mother_annual_income,
       fd.parent_email, fd.parent_whatsapp, fd.parent_sms,
       fd.guardian_name, fd.guardian_mobile,
       fd.guardian_relationship, fd.guardian_address,
       ad.admission_date, ad.entrance_mark,
       ad.entrance_rank, ad.hafiz, ad.recommended_by,
       sae.classroom_id AS classroom_id,
       c.name AS classroom_name, c.is_active AS classroom_is_active
     FROM students s
     JOIN  users                    u  ON u.id         = s.user_id
     LEFT JOIN student_other_details     od ON od.student_id = s.id
     LEFT JOIN student_academic_details  ac ON ac.student_id = s.id
     LEFT JOIN student_family_details    fd ON fd.student_id = s.id
     LEFT JOIN student_admission_details ad ON ad.student_id = s.id
     LEFT JOIN batches bt ON bt.id = s.batch_id
     LEFT JOIN courses co ON co.id = bt.course_id
     LEFT JOIN academic_years ay
       ON ay.is_current = 1
     LEFT JOIN student_academic_enrollments sae
       ON sae.student_id = s.id AND sae.academic_year_id = ay.id
     LEFT JOIN classrooms c ON c.id = sae.classroom_id
     WHERE s.id = ?
     LIMIT 1`,
    [id]
  );
  if (!student) return undefined;

  // 1:N tables — still parallel, now only 4 round-trips instead of 8
  const [
    [addresses],
    [qualifications],
    [extra_qualifications],
    [related_links],
  ] = await Promise.all([
    pool.query(`SELECT id, address_type, door_no, street, area, city, district, state, country, pin_code FROM student_addresses WHERE student_id = ?`, [id]),
    pool.query(`SELECT id, level, school_name, board, medium, passing_year, passing_month, school_address, reg_number, marks, total_marks, emis FROM student_qualifications WHERE student_id = ?`, [id]),
    pool.query(`SELECT id, course_name, cert_url FROM student_extra_qualifications WHERE student_id = ?`, [id]),
    pool.query(`SELECT id, description, url FROM student_related_links WHERE student_id = ?`, [id]),
  ]);

  return {
    account : {
      user_id : student.user_id,
      email   : student.email,
      role    : student.role,
      status  : student.status,
    },

    personal_details : {
      name            : student.name,
      roll_number     : student.roll_number,
      dob             : student.dob,
      gender          : student.gender,
      batch           : student.batch_id
        ? { id: student.batch_id, batch_name: student.batch_name }
        : null,
      blood_group     : student.blood_group,
      mother_tongue   : student.mother_tongue,
      is_hostel       : student.is_hostel,
      photo_url       : student.photo_url,
      mobile_number   : student.mobile_number,
      academic_status : student.academic_status,
    },

    other_details : {
      religion_id        : student.religion_id,
      caste_id           : student.caste_id,
      social_category_id : student.social_category_id,
      madhab_id          : student.madhab_id,
      is_orphan          : student.is_orphan,
      aadhar_no          : student.aadhar_no,
      medical_remarks    : student.medical_remarks,
      notes              : student.notes,
    },

    academic_details : {
      rrn                 : student.rrn,
      univ_email          : student.univ_email,
      yoj                 : student.yoj,
      yoc                 : student.yoc,
      madras_course       : student.madras_course,
      madras_roll_no      : student.madras_roll_no,
      madras_joining_year : student.madras_joining_year,
    },

    family_details : {
      father_name           : student.father_name,
      father_mobile         : student.father_mobile,
      father_education      : student.father_education,
      father_occupation     : student.father_occupation,
      father_annual_income  : student.father_annual_income,
      mother_name           : student.mother_name,
      mother_mobile         : student.mother_mobile,
      mother_education      : student.mother_education,
      mother_occupation     : student.mother_occupation,
      mother_annual_income  : student.mother_annual_income,
      parent_email          : student.parent_email,
      parent_whatsapp       : student.parent_whatsapp,
      parent_sms            : student.parent_sms,
      guardian_name         : student.guardian_name,
      guardian_mobile       : student.guardian_mobile,
      guardian_relationship : student.guardian_relationship,
      guardian_address      : student.guardian_address,
    },

    address : addresses,

    qualifications : qualifications.map((q) => ({
      id             : q.id,
      level          : q.level,
      school_name    : q.school_name,
      board          : q.board,
      medium         : q.medium,
      passing_year   : q.passing_year,
      passing_month  : q.passing_month,
      school_address : q.school_address,
      reg_number     : q.reg_number,
      marks          : parseFloat(q.marks),
      total_marks    : parseFloat(q.total_marks),
      emis           : q.emis,
    })),

    extra_qualifications : extra_qualifications,

    admission_details : {
      admission_date : student.admission_date,
      entrance_mark  : parseFloat(student.entrance_mark),
      entrance_rank  : student.entrance_rank,
      hafiz          : student.hafiz,
      recommended_by : student.recommended_by,
    },

    related_links : related_links,

    // Derived from batches.course_id → courses. null if the student has
    // no batch assigned.
    course : student.course_id
      ? {
          id         : student.course_id,
          name       : student.course_name,
          is_default : student.course_is_default,
          is_active  : student.course_is_active,
        }
      : null,

    // Derived, not stored: this student's classroom for whichever
    // academic_years row has is_current = 1. null if there's no current
    // academic year configured, or no enrollment row for it yet.
    classroom : student.classroom_id
      ? { id: student.classroom_id, name: student.classroom_name, is_active: student.classroom_is_active }
      : null,
  };
};

// =============================================================================
// getAllStudents
//
// Lightweight listing — only master row + user name/email, no child tables.
// @returns {Array}
// =============================================================================
// =============================================================================
// mapClassroom
//
// Converts flat classroom_id/classroom_name/classroom_is_active columns from
// a row into a nested `classroom: { id, name, is_active }` object.
// Returns classroom: null when the student has no current-year enrollment.
// =============================================================================
const mapClassroom = (row) => {
  const {
    classroom_id, classroom_name, classroom_is_active,
    course_id, course_name, course_is_default, course_is_active,
    ...rest
  } = row;
  return {
    ...rest,
    classroom: classroom_id
      ? { id: classroom_id, name: classroom_name, is_active: classroom_is_active }
      : null,
    course: course_id
      ? { id: course_id, name: course_name, is_default: course_is_default, is_active: course_is_active }
      : null,
  };
};

const getAllStudents = async () => {
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.roll_number, s.batch_id,
              co.id AS course_id, co.name AS course_name,
              co.is_default AS course_is_default, co.is_active AS course_is_active,
              u.user_id, u.email, u.role, u.status,
              sae.classroom_id AS classroom_id,
              c.name AS classroom_name, c.is_active AS classroom_is_active
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN batches b ON b.id = s.batch_id
       LEFT JOIN courses co ON co.id = b.course_id
       LEFT JOIN academic_years ay ON ay.is_current = 1
       LEFT JOIN student_academic_enrollments sae
         ON sae.student_id = s.id AND sae.academic_year_id = ay.id
       LEFT JOIN classrooms c ON c.id = sae.classroom_id
       ORDER BY s.id DESC`
    );
    return rows.map(mapClassroom);
  };

// =============================================================================
// getStudentsByFilters
//
// Supports ?classroom_id=&batch_id=&status= query params (extendable).
// Allowed filter columns — whitelist prevents SQL injection from raw keys.
// =============================================================================
// classroom_id removed — students no longer carries it directly. Use
// GET /api/students/list (getStudentsList), which already filters/joins
// classroom via student_academic_enrollments for a given academic year.
const ALLOWED_FILTERS = new Set(["batch_id", "status"]);

const getStudentsByFilters = async (filters) => {
  let sql = `
    SELECT s.id, s.name, s.roll_number, s.batch_id,
           co.id AS course_id, co.name AS course_name,
           co.is_default AS course_is_default, co.is_active AS course_is_active,
           u.user_id, u.email, u.role, u.status,
           sae.classroom_id AS classroom_id,
           c.name AS classroom_name, c.is_active AS classroom_is_active
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN batches b ON b.id = s.batch_id
    LEFT JOIN courses co ON co.id = b.course_id
    LEFT JOIN academic_years ay ON ay.is_current = 1
    LEFT JOIN student_academic_enrollments sae
      ON sae.student_id = s.id AND sae.academic_year_id = ay.id
    LEFT JOIN classrooms c ON c.id = sae.classroom_id
    WHERE 1=1
  `;
  const values = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (ALLOWED_FILTERS.has(key) && value !== undefined && value !== null && value !== "") {
      sql += key === "status" ? ` AND u.${key} = ?` : ` AND s.${key} = ?`;
      values.push(value);
    }
  });

  sql += " ORDER BY s.id DESC";
  const [rows] = await pool.query(sql, values);
  return rows.map(mapClassroom);
};

// =============================================================================
// buildStudentsListQuery (private)
//
// Shared WHERE-clause builder for getStudentsList / countStudentsList so the
// two always stay in sync (same filters ⇒ same denominator for pagination).
//
// Joins:
//   users                    u  — name, email, status
//   batches                  b  — filter by batch_name / course
//   student_admission_details ad — hafiz flag
//   student_academic_details  ac — rrn (search only)
//
// Filters:
//   academic_status → s.academic_status
//   classroom_id    → s.classroom_id
//   batch_name      → b.batch_name
//   course          → b.course
//   status          → u.status
//
// Search (q) — matches ANY of: u.name, s.roll_number, ac.rrn
// =============================================================================
// student_academic_enrollments (sae) is always joined against whichever
// academic_years (ay) row has is_current = 1 — there is no override param
// here anymore, so classroom_id in the results is always the CURRENT
// academic year's placement, never an arbitrary one.
const buildStudentsListQuery = ({ academic_status, classroom_id, batch_id, course_id, status, q }) => {
  let joinAndWhere = `
    FROM students s
    JOIN users u                              ON u.id = s.user_id
    LEFT JOIN batches b                       ON b.id = s.batch_id
    LEFT JOIN courses co                      ON co.id = b.course_id
    LEFT JOIN student_admission_details ad    ON ad.student_id = s.id
    LEFT JOIN student_academic_details ac     ON ac.student_id = s.id
    LEFT JOIN academic_years ay               ON ay.is_current = 1
    LEFT JOIN student_academic_enrollments sae
      ON sae.student_id = s.id AND sae.academic_year_id = ay.id
    LEFT JOIN classrooms c ON c.id = sae.classroom_id
    WHERE 1=1
  `;
  const values = [];

  if (academic_status) { joinAndWhere += " AND s.academic_status = ?"; values.push(academic_status); }
  // classroom_id filters against the CURRENT academic year's enrollment.
  if (classroom_id)    { joinAndWhere += " AND sae.classroom_id = ?";  values.push(classroom_id);    }
  if (batch_id)        { joinAndWhere += " AND s.batch_id = ?";        values.push(batch_id);        }
  // course is resolved via batch_id -> courses.id, filtered by course_id only
  if (course_id)       { joinAndWhere += " AND co.id = ?";             values.push(course_id);       }
  if (status)          { joinAndWhere += " AND u.status = ?";          values.push(status);          }

  if (q) {
    joinAndWhere += " AND (s.name LIKE ? OR s.roll_number LIKE ? OR ac.rrn LIKE ?)";
    const term = `%${q}%`;
    values.push(term, term, term);
  }

  return { joinAndWhere, values };
};

// =============================================================================
// getStudentsList
//
// Paginated student directory for listing/search screens.
// Returns exactly: id, photo_url, name, roll_number, batch_id, classroom_id,
//                   email, status, hafiz
// =============================================================================
const getStudentsList = async (filters) => {
    const { joinAndWhere, values } = buildStudentsListQuery(filters);
  
    const sql = `
      SELECT s.id, s.photo_url, s.name, s.roll_number, s.batch_id,
             co.id AS course_id, co.name AS course_name,
             co.is_default AS course_is_default, co.is_active AS course_is_active,
             u.email, u.status, ad.hafiz, s.academic_status, ac.rrn,
             sae.classroom_id AS classroom_id,
             c.name AS classroom_name, c.is_active AS classroom_is_active
      ${joinAndWhere}
  
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?
    `;
    values.push(Number(filters.limit), Number(filters.offset));
  
    const [rows] = await pool.query(sql, values);
    return rows.map(mapClassroom);
  };

// =============================================================================
// countStudentsList
//
// Row count for the same filter set as getStudentsList, used for pagination
// meta (total / totalPages).
// =============================================================================
const countStudentsList = async (filters) => {
  const { joinAndWhere, values } = buildStudentsListQuery(filters);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(DISTINCT s.id) AS total ${joinAndWhere}`,
    values
  );
  return total;
};


module.exports = {
  createStudent,
  findStudentById,
  getAllStudents,
  getStudentsByFilters,
  getStudentsList,
  countStudentsList,

  // single PATCH function
  updateStudent,

  // bulk create
  bulkCreateStudents,

  // bulk update
  bulkUpdateStudentFields,
};