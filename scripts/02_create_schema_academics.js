// scripts/02_create_schema_academics.js

"use strict";

const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { pool } = require("../src/config/db");

const schemaPath = path.join(
  __dirname, "..", "database", "02_schema_academics.sql"
);

// These tables must already exist (created by 01_create_schema_core.js)
// since the academics schema references them via foreign keys.
const REQUIRED_CORE_TABLES = [
  "users",
  "classrooms",
  "subjects",
  "staff",
  "students",
  "academic_terms",
];

const EXPECTED_TABLES = [
  "academic_calendar",
  "academic_calendar_classrooms",
  "timetable_formats",
  "timetable_format_days",
  "timetable_format_periods",
  "timetables",
  "timetable_slots",
  "additional_classes",
  "attendance_sessions",
  "attendance_records",
];

const run = async () => {
  try {
    console.log("========================================");
    console.log(" COLLEGE ERP - CREATE ACADEMICS SCHEMA");
    console.log("========================================");
    console.log("");

    // ------------------------------------------------------------
    // Check SQL file
    // ------------------------------------------------------------

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`02_schema_academics.sql not found: ${schemaPath}`);
    }

    console.log("✓ 02_schema_academics.sql found");
    console.log("");

    // ------------------------------------------------------------
    // Connect to MySQL
    // ------------------------------------------------------------

    console.log("Connecting to MySQL...");

    await pool.query("SELECT 1");

    console.log("✓ MySQL connection successful");
    console.log("");

    // ------------------------------------------------------------
    // STEP 1: Check core tables exist
    // ------------------------------------------------------------
    // Depends on: courses, classrooms, subjects, staff, students,
    // users, academic_terms (all created by 01_schema_core.sql).
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 1: Checking core tables exist...");
    console.log("----------------------------------------");

    const [coreTables] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    const coreNames = coreTables.map((t) => t.TABLE_NAME);
    const missingCore = REQUIRED_CORE_TABLES.filter(
      (t) => !coreNames.includes(t)
    );

    if (missingCore.length > 0) {
      throw new Error(
        `Core tables missing: ${missingCore.join(", ")}. ` +
        "Run 01_create_schema_core.js first."
      );
    }

    console.log("✓ Required core tables are present");
    console.log("");

    // ------------------------------------------------------------
    // Read SQL file
    // ------------------------------------------------------------

    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    // ------------------------------------------------------------
    // STEP 2: Create timetable & attendance tables
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 2: Creating timetable & attendance tables...");
    console.log("----------------------------------------");

    await pool.query(schemaSql);

    console.log("✓ Academics schema executed successfully");
    console.log("");

    // ------------------------------------------------------------
    // STEP 3: Verification
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 3: Verifying academics tables...");
    console.log("----------------------------------------");

    const [tables] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

    const foundNames = tables.map((t) => t.TABLE_NAME);
    const missing = EXPECTED_TABLES.filter((t) => !foundNames.includes(t));

    console.log(`✓ Total tables found: ${tables.length}`);
    console.log("");
    EXPECTED_TABLES.forEach((t) => {
      const mark = foundNames.includes(t) ? "✓" : "✗";
      console.log(`  ${mark} ${t}`);
    });

    if (missing.length > 0) {
      throw new Error(
        `Missing expected academics table(s): ${missing.join(", ")}`
      );
    }

    console.log("");
    console.log("========================================");
    console.log(" ACADEMICS SCHEMA CREATION COMPLETE ✓");
    console.log("========================================");
    console.log("");

  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error(" ACADEMICS SCHEMA CREATION FAILED ✗");
    console.error("========================================");
    console.error("");
    console.error("Error:", error.message);
    console.error("");

    if (error.sqlMessage) {
      console.error("MySQL:", error.sqlMessage);
    }

    if (error.sql) {
      console.error("");
      console.error("SQL:");
      console.error(error.sql);
    }

    process.exitCode = 1;

  } finally {
    await pool.end();
    console.log("MySQL connection pool closed.");
  }
};

run();