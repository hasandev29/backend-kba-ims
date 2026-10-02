// scripts/04_seed_academics.js

"use strict";

const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { pool } = require("../src/config/db");

const seedPath = path.join(
  __dirname, "..", "database", "04_seed_academics.sql"
);

const run = async () => {
  try {
    console.log("========================================");
    console.log("   COLLEGE ERP - SEED ACADEMICS DATA");
    console.log("========================================");
    console.log("");

    // ------------------------------------------------------------
    // Check SQL file
    // ------------------------------------------------------------

    if (!fs.existsSync(seedPath)) {
      throw new Error(`04_seed_academics.sql not found: ${seedPath}`);
    }

    console.log("✓ 04_seed_academics.sql found");
    console.log("");

    // ------------------------------------------------------------
    // Connect to MySQL
    // ------------------------------------------------------------

    console.log("Connecting to MySQL...");

    await pool.query("SELECT 1");

    console.log("✓ MySQL connection successful");
    console.log("");

    // ------------------------------------------------------------
    // STEP 1: Check core seed data exists
    // ------------------------------------------------------------
    // Timetables, slots and attendance all reference classrooms,
    // subjects, staff and students seeded by 03_seed_core.js.
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 1: Checking core seed data exists...");
    console.log("----------------------------------------");

    const [studentCount] = await pool.query(
      "SELECT COUNT(*) AS count FROM students"
    );

    if (studentCount[0].count === 0) {
      throw new Error(
        "No students found. Run 03_seed_core.js before seeding academics data."
      );
    }

    console.log("✓ Core seed data is present");
    console.log("");

    // ------------------------------------------------------------
    // Read SQL file
    // ------------------------------------------------------------

    const seedSql = fs.readFileSync(seedPath, "utf8");

    // ------------------------------------------------------------
    // STEP 2: Insert academics seed data
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 2: Inserting academics seed data...");
    console.log("----------------------------------------");

    await pool.query(seedSql);

    console.log("✓ Academics seed data inserted successfully");
    console.log("");

    // ------------------------------------------------------------
    // STEP 3: Verification
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 3: Verifying academics seed data...");
    console.log("----------------------------------------");

    const [calendar] = await pool.query(
      "SELECT COUNT(*) AS count FROM academic_calendar"
    );

    const [calendarClassrooms] = await pool.query(
      "SELECT COUNT(*) AS count FROM academic_calendar_classrooms"
    );

    const [formats] = await pool.query(
      "SELECT COUNT(*) AS count FROM timetable_formats"
    );

    const [formatDays] = await pool.query(
      "SELECT COUNT(*) AS count FROM timetable_format_days"
    );

    const [formatPeriods] = await pool.query(
      "SELECT COUNT(*) AS count FROM timetable_format_periods"
    );

    const [timetables] = await pool.query(
      "SELECT COUNT(*) AS count FROM timetables"
    );

    const [slots] = await pool.query(
      "SELECT COUNT(*) AS count FROM timetable_slots"
    );

    const [additionalClasses] = await pool.query(
      "SELECT COUNT(*) AS count FROM additional_classes"
    );

    const [sessions] = await pool.query(
      "SELECT COUNT(*) AS count FROM attendance_sessions"
    );

    const [records] = await pool.query(
      "SELECT COUNT(*) AS count FROM attendance_records"
    );

    console.log("");
    console.log("Seed verification:");
    console.log(`  Academic calendar events:      ${calendar[0].count}`);
    console.log(`  Calendar -> classroom links:   ${calendarClassrooms[0].count}`);
    console.log(`  Timetable formats:             ${formats[0].count}`);
    console.log(`  Timetable format days:         ${formatDays[0].count}`);
    console.log(`  Timetable format periods:      ${formatPeriods[0].count}`);
    console.log(`  Timetables:                    ${timetables[0].count}`);
    console.log(`  Timetable slots:               ${slots[0].count}`);
    console.log(`  Additional classes:            ${additionalClasses[0].count}`);
    console.log(`  Attendance sessions:           ${sessions[0].count}`);
    console.log(`  Attendance records:            ${records[0].count}`);

    console.log("");
    console.log("========================================");
    console.log("   ACADEMICS SEED DATA COMPLETE ✓");
    console.log("========================================");
    console.log("");

  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("   ACADEMICS SEED DATA FAILED ✗");
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