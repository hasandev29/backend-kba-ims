// scripts/create-tables.js

"use strict";

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
const timetableSchemaPath = path.join(
  __dirname, "..", "database", "tt-db.sql" );

const run = async () => {
  let connection;

  try {
    console.log("========================================");
    console.log("       COLLEGE ERP - CREATE TABLES");
    console.log("========================================");
    console.log("");

    // ------------------------------------------------------------
    // Check SQL files
    // ------------------------------------------------------------

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found: ${schemaPath}`);
    }

    if (!fs.existsSync(timetableSchemaPath)) {
      throw new Error(
        `tt-db.sql not found: ${timetableSchemaPath}`
      );
    }

    console.log("✓ schema.sql found");
    console.log("✓ tt-db.sql found");
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
    const timetableSchemaSql = fs.readFileSync(timetableSchemaPath, "utf8");

    // ------------------------------------------------------------
    // STEP 1: Create core tables
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 1: Creating core database tables...");
    console.log("----------------------------------------");

    await connection.query(schemaSql);

    console.log("✓ Core schema executed successfully");
    console.log("");

    // ------------------------------------------------------------
    // STEP 2: Create timetable & attendance tables
    // ------------------------------------------------------------
    // Depends on: courses, classrooms, subjects, staff, students,
    // users (all created in STEP 1).
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 2: Creating timetable & attendance tables...");
    console.log("----------------------------------------");

    await connection.query(timetableSchemaSql);

    console.log("✓ Timetable & attendance schema executed successfully");
    console.log("");

    // ------------------------------------------------------------
    // STEP 3: Verification
    // ------------------------------------------------------------

    console.log("----------------------------------------");
    console.log("STEP 3: Verifying tables...");
    console.log("----------------------------------------");

    const [tables] = await connection.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME]);

    console.log(`✓ Total tables found: ${tables.length}`);
    console.log("");
    tables.forEach((t) => console.log(`  - ${t.TABLE_NAME}`));

    console.log("");
    console.log("========================================");
    console.log("       TABLE CREATION COMPLETE ✓");
    console.log("========================================");
    console.log("");

  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("       TABLE CREATION FAILED ✗");
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