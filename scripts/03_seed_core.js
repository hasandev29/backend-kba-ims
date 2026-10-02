// scripts/03_seed_core.js

"use strict";

const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { pool } = require("../src/config/db");

const seedPath = path.join(
  __dirname, "..", "database", "03_seed_core.sql"
);

const run = async () => {
  try {
    console.log("========================================");
    console.log("     COLLEGE ERP - SEED CORE DATA");
    console.log("========================================");
    console.log("");

    // ------------------------------------------------------------
    // Check SQL file
    // ------------------------------------------------------------

    if (!fs.existsSync(seedPath)) {
      throw new Error(`03_seed_core.sql not found: ${seedPath}`);
    }

    console.log("✓ 03_seed_core.sql found");
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

    const seedSql = fs.readFileSync(seedPath, "utf8");

    // ------------------------------------------------------------
    // STEP 1: Insert core seed data
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 1: Inserting core seed data...");
    console.log("----------------------------------------");

    await pool.query(seedSql);

    console.log("✓ Core seed data inserted successfully");
    console.log("");

    // ------------------------------------------------------------
    // STEP 2: Verification
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 2: Verifying core seed data...");
    console.log("----------------------------------------");

    const [courses] = await pool.query(
      "SELECT COUNT(*) AS count FROM courses"
    );

    const [batches] = await pool.query(
      "SELECT COUNT(*) AS count FROM batches"
    );

    const [semesters] = await pool.query(
      "SELECT COUNT(*) AS count FROM semesters"
    );

    const [academicTerms] = await pool.query(
      "SELECT COUNT(*) AS count FROM academic_terms"
    );

    const [academicYears] = await pool.query(
      "SELECT COUNT(*) AS count FROM academic_years"
    );

    const [users] = await pool.query(
      "SELECT COUNT(*) AS count FROM users"
    );

    const [staff] = await pool.query(
      "SELECT COUNT(*) AS count FROM staff"
    );

    const [classrooms] = await pool.query(
      "SELECT COUNT(*) AS count FROM classrooms"
    );

    const [subjects] = await pool.query(
      "SELECT COUNT(*) AS count FROM subjects"
    );

    const [students] = await pool.query(
      "SELECT COUNT(*) AS count FROM students"
    );

    const [qualifications] = await pool.query(
      "SELECT COUNT(*) AS count FROM student_qualifications"
    );

    const [enrollments] = await pool.query(
      "SELECT COUNT(*) AS count FROM student_academic_enrollments"
    );

    console.log("");
    console.log("Seed verification:");
    console.log(`  Courses:                  ${courses[0].count}`);
    console.log(`  Batches:                  ${batches[0].count}`);
    console.log(`  Semesters:                ${semesters[0].count}`);
    console.log(`  Academic terms:           ${academicTerms[0].count}`);
    console.log(`  Academic years:           ${academicYears[0].count}`);
    console.log(`  Users:                    ${users[0].count}`);
    console.log(`  Staff:                    ${staff[0].count}`);
    console.log(`  Classrooms:               ${classrooms[0].count}`);
    console.log(`  Subjects:                 ${subjects[0].count}`);
    console.log(`  Students:                 ${students[0].count}`);
    console.log(`  Student qualifications:   ${qualifications[0].count}`);
    console.log(`  Student enrollments:      ${enrollments[0].count}`);

    console.log("");
    console.log("========================================");
    console.log("     CORE SEED DATA COMPLETE ✓");
    console.log("========================================");
    console.log("");

  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("     CORE SEED DATA FAILED ✗");
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