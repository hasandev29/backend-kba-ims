// scripts/01_create_schema_core.js

"use strict";

const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { pool } = require("../src/config/db");

const schemaPath = path.join(
  __dirname, "..", "database", "01_schema_core.sql"
);

const EXPECTED_TABLES = [
  "courses",
  "batches",
  "semesters",
  "academic_terms",
  "academic_years",
  "users",
  "staff",
  "staff_employment_details",
  "staff_qualifications",
  "staff_addresses",
  "staff_other_details",
  "classrooms",
  "subjects",
  "students",
  "student_other_details",
  "student_academic_details",
  "student_family_details",
  "student_addresses",
  "student_qualifications",
  "student_extra_qualifications",
  "student_admission_details",
  "student_related_links",
  "student_academic_enrollments",
];

const run = async () => {
  try {
    console.log("========================================");
    console.log("   COLLEGE ERP - CREATE CORE SCHEMA");
    console.log("========================================");
    console.log("");

    // ------------------------------------------------------------
    // Check SQL file
    // ------------------------------------------------------------

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`01_schema_core.sql not found: ${schemaPath}`);
    }

    console.log("✓ 01_schema_core.sql found");
    console.log("");

    // ------------------------------------------------------------
    // Connect to MySQL
    // ------------------------------------------------------------

    console.log("Connecting to MySQL...");

    await pool.query("SELECT 1");

    console.log("✓ MySQL connection successful");
    console.log("");

    // ------------------------------------------------------------
    // Read SQL file
    // ------------------------------------------------------------

    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    // ------------------------------------------------------------
    // STEP 1: Create core tables
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 1: Creating core database tables...");
    console.log("----------------------------------------");

    await pool.query(schemaSql);

    console.log("✓ Core schema executed successfully");
    console.log("");

    // ------------------------------------------------------------
    // STEP 2: Verification
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 2: Verifying core tables...");
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
        `Missing expected core table(s): ${missing.join(", ")}`
      );
    }

    console.log("");
    console.log("========================================");
    console.log("   CORE SCHEMA CREATION COMPLETE ✓");
    console.log("========================================");
    console.log("");

  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("   CORE SCHEMA CREATION FAILED ✗");
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