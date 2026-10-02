// src/middlewares/validators/student.validator.js
//
// Joi schemas for student endpoints. Mirrors batch.validator.js conventions —
// schemas are consumed by the generic `validate(schema)` router middleware,
// which validates req.body and attaches the cleaned result as req.validatedBody.
//
// Design decisions (unchanged from the original):
//   • Nested objects use .unknown(false) so stray keys are rejected.
//   • Fields that go through sanitize() in the model are .allow("", null).
//   • Boolean fields accept true/false/1/0/"true"/"false"/"1"/"0".
//
// SECTION-EDIT SCHEMAS (added)
//   Each editable section (Student Information, Other Details, Academic
//   Details, Family Details, Address, Qualifications, Admission Details,
//   Related Links) now has its own PATCH schema, matching the one-table-per-
//   section split in student.routes.js / student.controller.js / student.model.js.
//
//   • Scalar sections (info / other / academic / family / admission) reuse
//     the existing "update*Schema" objects below — every field optional,
//     nothing defaulted, .min(1) so an empty PATCH body is rejected.
//   • List sections (address / qualifications / related_links) are FULL
//     REPLACEMENTS: the PATCH body is a bare array (can be empty to clear
//     the section), validated with the same item schema used on create.
// =============================================================================

"use strict";

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------

const nullableStr = () =>
  Joi.string().allow("", null).optional().default(null);

const nullableInt = () =>
  Joi.number().integer().positive().allow(null).optional().default(null);

// Used by CREATE schemas — omitted key defaults to false.
const boolLike = () =>
  Joi.alternatives()
    .try(Joi.boolean(), Joi.number().valid(0, 1), Joi.string().valid("true", "false", "1", "0"))
    .optional()
    .default(false);

// Used by PATCH/update schemas — no default, so an omitted key stays
// omitted instead of being coerced to false. (Joi's .default() throws
// "Missing default value" if you ever pass it undefined, so this is a
// separate builder rather than boolLike().default(undefined).)
const boolLikeOptional = () =>
  Joi.alternatives()
    .try(Joi.boolean(), Joi.number().valid(0, 1), Joi.string().valid("true", "false", "1", "0"))
    .optional();

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const accountSchema = Joi.object({
  user_id  : Joi.string().trim().required(),
  email           : Joi.string().email().optional(),
  role     : Joi.string().trim().required(),
  status   : Joi.string().trim().optional().default("active"),
  password : Joi.string().min(6).required(),
}).options({ allowUnknown: false });

const personalDetailsSchema = Joi.object({
  name            : Joi.string().trim().required(),
  roll_number     : Joi.string().trim().required(),
  dob             : Joi.date().iso().optional(),
  gender          : Joi.number().integer().valid(1, 2, 3).optional().default(1),
  batch_id        : nullableInt(),
  blood_group     : nullableInt(),
  mother_tongue   : nullableStr(),
  is_hostel       : boolLike(),
  photo_url       : nullableStr(),
  mobile_number   : nullableStr(),
  academic_status : Joi.string().required(),
}).options({ allowUnknown: false });

const otherDetailsSchema = Joi.object({
  religion_id        : nullableInt(),
  caste_id           : nullableInt(),
  social_category_id : nullableInt(),
  madhab_id          : nullableInt(),
  is_orphan          : boolLike(),
  aadhar_no          : nullableStr(),
  medical_remarks    : nullableStr(),
  notes              : nullableStr(),
}).options({ allowUnknown: false });

const academicDetailsSchema = Joi.object({
  rrn                 : nullableStr(),
  univ_email          : Joi.string().email().allow("", null).optional().default(null),
  yoj                 : nullableInt(),
  yoc                 : nullableInt(),
  madras_course       : nullableStr(),
  madras_roll_no      : nullableStr(),
  madras_joining_year : nullableInt(),
}).options({ allowUnknown: false });

const familyDetailsSchema = Joi.object({
  father_name            : nullableStr(),
  father_mobile          : nullableStr(),
  father_education       : nullableStr(),
  father_occupation      : nullableStr(),
  father_annual_income   : Joi.number().integer().min(0).allow(null).optional().default(null),
  mother_name            : nullableStr(),
  mother_mobile          : nullableStr(),
  mother_education       : nullableStr(),
  mother_occupation      : nullableStr(),
  mother_annual_income   : Joi.number().integer().min(0).allow(null).optional().default(null),
  parent_email           : Joi.string().email().allow("", null).optional().default(null),
  parent_whatsapp        : nullableStr(),
  parent_sms              : nullableStr(),
  guardian_name          : nullableStr(),
  guardian_mobile        : nullableStr(),
  guardian_relationship  : nullableStr(),
  guardian_address       : nullableStr(),
}).options({ allowUnknown: false });

const addressSchema = Joi.object({
  address_type : Joi.number().integer().valid(0, 1).required(),
  door_no      : nullableStr(),
  street       : nullableStr(),
  area         : nullableStr(),
  city         : nullableStr(),
  district     : nullableStr(),
  state        : nullableStr(),
  country      : nullableStr(),
  pin_code     : nullableStr(),
}).options({ allowUnknown: false });

const qualificationSchema = Joi.object({
  level          : Joi.string().trim().required(),
  school_name    : nullableStr(),
  board          : nullableStr(),
  medium         : nullableStr(),
  passing_year   : nullableInt(),
  passing_month  : nullableStr(),
  school_address : nullableStr(),
  reg_number     : nullableStr(),
  marks          : Joi.number().allow(null).optional().default(null),
  total_marks    : Joi.number().allow(null).optional().default(null),
  emis           : nullableStr(),
}).options({ allowUnknown: false });

const extraQualificationSchema = Joi.object({
  course_name : Joi.string().trim().required(),
  cert_url    : nullableStr(),
}).options({ allowUnknown: false });

const admissionDetailsSchema = Joi.object({
  admission_date : Joi.date().iso().allow(null).optional().default(null),
  entrance_mark  : Joi.number().allow(null).optional().default(null),
  entrance_rank  : Joi.number().integer().allow(null).optional().default(null),
  hafiz          : boolLike(),
  recommended_by : nullableStr(),
}).options({ allowUnknown: false });

const relatedLinkSchema = Joi.object({
  description : Joi.string().trim().required(),
  url         : Joi.string().uri().required(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Root schema — POST /api/students
// ---------------------------------------------------------------------------

const createStudentSchema = Joi.object({
  // classroom_id is NOT stored on the students table anymore — it's used
  // only to create the initial student_academic_enrollments row below.
  classroom_id          : Joi.number().integer().positive().required(),
  // Optional — omit it to auto-enroll into whichever academic_years row
  // has is_current = 1.
  academic_year_id      : Joi.number().integer().positive().optional(),
  account               : accountSchema.required(),
  personal_details      : personalDetailsSchema.required(),
  other_details         : otherDetailsSchema.optional().default({}),
  academic_details      : academicDetailsSchema.optional().default({}),
  family_details        : familyDetailsSchema.optional().default({}),
  address               : Joi.array().items(addressSchema).optional().default([]),
  qualifications        : Joi.array().items(qualificationSchema).optional().default([]),
  extra_qualifications  : Joi.array().items(extraQualificationSchema).optional().default([]),
  admission_details     : admissionDetailsSchema.optional().default({}),
  related_links         : Joi.array().items(relatedLinkSchema).optional().default([]),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query schema — GET /api/students/list
// Kept optional/loose since batch.validator's getBatchesQuerySchema follows
// the same style; controller still guards against garbage values manually.
// ---------------------------------------------------------------------------

const getStudentsListQuerySchema = Joi.object({
  academic_status : Joi.string().trim().max(50).optional(),
  // Filters against the student's enrollment for the CURRENT academic
  // year only (is_current = 1) — see buildStudentsListQuery in
  // student.model.js. There is no way to query a different year here.
  classroom_id    : Joi.number().integer().positive().optional(),
  batch_name      : Joi.string().trim().max(100).optional(),
  course_id       : Joi.number().integer().positive().optional(),
  status          : Joi.string().trim().max(50).optional(),
  q               : Joi.string().trim().max(100).allow("").optional(),
  page            : Joi.number().integer().min(1).optional(),
  limit           : Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE (PATCH) schemas — every field is optional, nothing has a Joi
// .default(), and nothing is forced .required(). This is deliberate:
// req.validatedBody must only contain the keys the client actually sent,
// otherwise the model can't tell "field omitted" apart from "field reset".
// ---------------------------------------------------------------------------

const updateAccountSchema = Joi.object({
  user_id  : Joi.string().trim().optional(),
  email: Joi.string().trim().required(),
  role     : Joi.string().trim().optional(),
  status   : Joi.string().trim().optional(),
}).options({ allowUnknown: false }).min(1);

const updatePersonalDetailsSchema = Joi.object({
  name            : Joi.string().trim().optional(),
  roll_number     : Joi.string().trim().optional(),
  dob             : Joi.date().iso().optional(),
  gender          : Joi.number().integer().valid(1, 2, 3).optional(),
  batch_id        : Joi.number().integer().positive().allow(null).optional(),
  blood_group     : Joi.number().integer().positive().allow(null).optional(),
  mother_tongue   : Joi.string().allow("", null).optional(),
  is_hostel       : boolLikeOptional(),
  photo_url       : Joi.string().allow("", null).optional(),
  mobile_number   : Joi.string().allow("", null).optional(),
  academic_status : Joi.string().optional(),
}).options({ allowUnknown: false }).min(1);

const updateOtherDetailsSchema = Joi.object({
  religion_id        : Joi.number().integer().positive().allow(null).optional(),
  caste_id           : Joi.number().integer().positive().allow(null).optional(),
  social_category_id : Joi.number().integer().positive().allow(null).optional(),
  madhab_id          : Joi.number().integer().positive().allow(null).optional(),
  is_orphan          : boolLikeOptional(),
  aadhar_no          : Joi.string().allow("", null).optional(),
  medical_remarks    : Joi.string().allow("", null).optional(),
  notes              : Joi.string().allow("", null).optional(),
}).options({ allowUnknown: false }).min(1);

const updateAcademicDetailsSchema = Joi.object({
  rrn                 : Joi.string().allow("", null).optional(),
  univ_email          : Joi.string().email().allow("", null).optional(),
  yoj                 : Joi.number().integer().positive().allow(null).optional(),
  yoc                 : Joi.number().integer().positive().allow(null).optional(),
  madras_course       : Joi.string().allow("", null).optional(),
  madras_roll_no      : Joi.string().allow("", null).optional(),
  madras_joining_year : Joi.number().integer().positive().allow(null).optional(),
}).options({ allowUnknown: false }).min(1);

const updateFamilyDetailsSchema = Joi.object({
  father_name            : Joi.string().allow("", null).optional(),
  father_mobile          : Joi.string().allow("", null).optional(),
  father_education       : Joi.string().allow("", null).optional(),
  father_occupation      : Joi.string().allow("", null).optional(),
  father_annual_income   : Joi.number().integer().min(0).allow(null).optional(),
  mother_name            : Joi.string().allow("", null).optional(),
  mother_mobile          : Joi.string().allow("", null).optional(),
  mother_education       : Joi.string().allow("", null).optional(),
  mother_occupation      : Joi.string().allow("", null).optional(),
  mother_annual_income   : Joi.number().integer().min(0).allow(null).optional(),
  parent_email           : Joi.string().email().allow("", null).optional(),
  parent_whatsapp        : Joi.string().allow("", null).optional(),
  parent_sms             : Joi.string().allow("", null).optional(),
  guardian_name          : Joi.string().allow("", null).optional(),
  guardian_mobile        : Joi.string().allow("", null).optional(),
  guardian_relationship  : Joi.string().allow("", null).optional(),
  guardian_address       : Joi.string().allow("", null).optional(),
}).options({ allowUnknown: false }).min(1);

const updateAdmissionDetailsSchema = Joi.object({
  admission_date : Joi.date().iso().allow(null).optional(),
  entrance_mark  : Joi.number().allow(null).optional(),
  entrance_rank  : Joi.number().integer().allow(null).optional(),
  hafiz          : boolLikeOptional(),
  recommended_by : Joi.string().allow("", null).optional(),
}).options({ allowUnknown: false }).min(1);

// ---------------------------------------------------------------------------
// PATCH-only address/qualification schemas — id is required.
// Addresses (present/permanent) and qualifications (10th/11th/12th) are
// created once in createStudent and never added or removed afterward, so a
// PATCH must always target an existing row by id. Built with .keys() on top
// of the create-time schemas so field-level rules (nullableStr, etc.) stay
// in one place and don't drift between create and patch.
// ---------------------------------------------------------------------------
const patchAddressSchema = addressSchema.keys({
  id : Joi.number().integer().positive().required(),
});

const patchQualificationSchema = qualificationSchema.keys({
  id : Joi.number().integer().positive().required(),
});

// =============================================================================
// SINGLE PATCH SCHEMA — PATCH /api/students/:id
//
// The frontend sends only the node(s)/section(s) that actually changed.
// Every key here is optional so req.validatedBody only ever contains what
// the client sent — nothing is defaulted, nothing is forced.
//
// Array sections (address / qualifications / extra_qualifications /
// related_links) are FULL REPLACEMENTS when present — each item still needs
// its "required" fields, same shape as create. Sending an empty array []
// clears that section entirely; omitting the key leaves it untouched.
// =============================================================================
const patchStudentSchema = Joi.object({
  // classroom_id removed — classroom/academic-year changes now go through
  // the dedicated bulk promotion endpoint (PATCH /api/students/promote),
  // which writes to student_academic_enrollments, not students.
  account               : updateAccountSchema.optional(),
  personal_details      : updatePersonalDetailsSchema.optional(),
  other_details         : updateOtherDetailsSchema.optional(),
  academic_details      : updateAcademicDetailsSchema.optional(),
  family_details        : updateFamilyDetailsSchema.optional(),
  address               : Joi.array().items(patchAddressSchema).optional(),
  qualifications        : Joi.array().items(patchQualificationSchema).optional(),
  extra_qualifications  : Joi.array().items(extraQualificationSchema).optional(),
  admission_details     : updateAdmissionDetailsSchema.optional(),
  related_links         : Joi.array().items(relatedLinkSchema).optional(),
}).options({ allowUnknown: false }).min(1);

// ---------------------------------------------------------------------------
// BULK CREATE — POST /api/students/bulk
//
// Admin only needs to supply classroom/batch/hostel + a roll-number range.
// Everything else (name, dob, etc.) is filled in later by the student via
// PATCH once they log in with roll_number / `${roll_number}@123`.
// ---------------------------------------------------------------------------
const bulkCreateStudentsSchema = Joi.object({
  classroom_id         : Joi.number().integer().positive().required(),
  batch_id             : Joi.number().integer().positive().required(),
  is_hostel            : boolLike(),
  starting_roll_number : Joi.number().integer().positive().required(),
  total_students       : Joi.number().integer().positive().max(500).required(),
  // Optional — omit to auto-enroll the whole batch into whichever
  // academic_years row has is_current = 1.
  academic_year_id     : Joi.number().integer().positive().optional(),
}).options({ allowUnknown: false });

const bulkUpdateStudentsSchema = Joi.object({
  student_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  batch_id             : Joi.number().integer().positive().allow(null),
  status               : Joi.string().valid("active", "inactive").allow(null),
  is_hostel            : boolLike().allow(null),
  academic_status      : Joi.string().valid("studying", "passed_out", "discontinued").allow(null),
  madhab_id            : Joi.number().integer().positive().allow(null),
  yoj                  : Joi.number().integer().allow(null),
  madras_course        : Joi.string().max(255).allow(null, ""),
  madras_joining_year  : Joi.number().integer().allow(null),
}).options({ allowUnknown: false });


module.exports = {
  createStudentSchema,
  getStudentsListQuerySchema,
  patchStudentSchema,
  bulkCreateStudentsSchema,
  bulkUpdateStudentsSchema,
};