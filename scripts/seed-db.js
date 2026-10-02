// scripts/seed-data.js

"use strict";

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

const seedPath = path.join(__dirname, "..", "database", "seed.sql");

const run = async () => {
  let connection;

  try {
    console.log("========================================");
    console.log("       COLLEGE ERP - SEED DATA");
    console.log("========================================");
    console.log("");

    // ------------------------------------------------------------
    // Check SQL file
    // ------------------------------------------------------------

    if (!fs.existsSync(seedPath)) {
      throw new Error(`seed.sql not found: ${seedPath}`);
    }

    console.log("✓ seed.sql found");
    console.log("");

    // ------------------------------------------------------------
    // Connect to MySQL
    // ------------------------------------------------------------

    console.log("Connecting to MySQL...");

    connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      multipleStatements: true,
    });

    console.log("✓ MySQL connection successful");
    console.log("");

    // ------------------------------------------------------------
    // Read SQL file
    // ------------------------------------------------------------

    const seedSql = fs.readFileSync(seedPath, "utf8");

    // ------------------------------------------------------------
    // STEP 1: Insert seed data
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 1: Inserting seed data...");
    console.log("----------------------------------------");

    await connection.query(seedSql);

    console.log("✓ Seed data inserted successfully");
    console.log("");

    // ------------------------------------------------------------
    // STEP 2: Verification
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 2: Verifying seed data...");
    console.log("----------------------------------------");

    const [courses] = await connection.query(
      "SELECT COUNT(*) AS count FROM courses"
    );

    const [semesters] = await connection.query(
      "SELECT COUNT(*) AS count FROM semesters"
    );

    const [batches] = await connection.query(
      "SELECT COUNT(*) AS count FROM batches"
    );

    const [users] = await connection.query(
      "SELECT COUNT(*) AS count FROM users"
    );

    const [staff] = await connection.query(
      "SELECT COUNT(*) AS count FROM staff"
    );

    const [classrooms] = await connection.query(
      "SELECT COUNT(*) AS count FROM classrooms"
    );

    const [students] = await connection.query(
      "SELECT COUNT(*) AS count FROM students"
    );

    const [qualifications] = await connection.query(
      "SELECT COUNT(*) AS count FROM student_qualifications"
    );

    console.log("");
    console.log("Seed verification:");
    console.log(`  Courses:                  ${courses[0].count}`);
    console.log(`  Semesters:                ${semesters[0].count}`);
    console.log(`  Batches:                  ${batches[0].count}`);
    console.log(`  Users:                    ${users[0].count}`);
    console.log(`  Staff:                    ${staff[0].count}`);
    console.log(`  Classrooms:               ${classrooms[0].count}`);
    console.log(`  Students:                 ${students[0].count}`);
    console.log(`  Student qualifications:   ${qualifications[0].count}`);

    console.log("");
    console.log("========================================");
    console.log("       SEED DATA COMPLETE ✓");
    console.log("========================================");
    console.log("");

  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("       SEED DATA FAILED ✗");
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
    if (connection) {
      await connection.end();
      console.log("MySQL connection closed.");
    }
  }
};

run();