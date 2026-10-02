// scripts/setup-db.js

"use strict";

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
const seedPath = path.join(__dirname, "..", "database", "seed.sql");

const run = async () => {
  let connection;

  try {
    console.log("========================================");
    console.log("       COLLEGE ERP DATABASE SETUP");
    console.log("========================================");
    console.log("");

    // ------------------------------------------------------------
    // Check SQL files
    // ------------------------------------------------------------

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found: ${schemaPath}`);
    }

    if (!fs.existsSync(seedPath)) {
      throw new Error(`seed.sql not found: ${seedPath}`);
    }

    console.log("✓ schema.sql found");
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
    // Read SQL files
    // ------------------------------------------------------------

    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    const seedSql = fs.readFileSync(seedPath, "utf8");

    // ------------------------------------------------------------
    // STEP 1: Create tables
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 1: Creating database tables...");
    console.log("----------------------------------------");

    await connection.query(schemaSql);

    console.log("✓ Schema executed successfully");
    console.log("");

    // ------------------------------------------------------------
    // STEP 2: Insert seed data
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 2: Inserting seed data...");
    console.log("----------------------------------------");

    await connection.query(seedSql);

    console.log("✓ Seed data inserted successfully");
    console.log("");

    // ------------------------------------------------------------
    // STEP 3: Verification
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 3: Verifying database...");
    console.log("----------------------------------------");

    const [tables] = await connection.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME]);

    console.log(`✓ Total tables found: ${tables.length}`);

    const [users] = await connection.query(
      "SELECT COUNT(*) AS count FROM users"
    );

    const [staff] = await connection.query(
      "SELECT COUNT(*) AS count FROM staff"
    );

    const [students] = await connection.query(
      "SELECT COUNT(*) AS count FROM students"
    );

    const [batches] = await connection.query(
      "SELECT COUNT(*) AS count FROM batches"
    );

    const [classrooms] = await connection.query(
      "SELECT COUNT(*) AS count FROM classrooms"
    );

    const [qualifications] = await connection.query(
      "SELECT COUNT(*) AS count FROM student_qualifications"
    );

    console.log("");
    console.log("Seed verification:");
    console.log(`  Users:                    ${users[0].count}`);
    console.log(`  Staff:                    ${staff[0].count}`);
    console.log(`  Students:                 ${students[0].count}`);
    console.log(`  Batches:                  ${batches[0].count}`);
    console.log(`  Classrooms:               ${classrooms[0].count}`);
    console.log(`  Student qualifications:   ${qualifications[0].count}`);

    console.log("");
    console.log("========================================");
    console.log("       DATABASE SETUP COMPLETE ✓");
    console.log("========================================");
    console.log("");

  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("       DATABASE SETUP FAILED ✗");
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