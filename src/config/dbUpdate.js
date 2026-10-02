const { pool } = require("./db");

async function dbUpdate() {
  try {
    // const [columns] = await pool.query("DESCRIBE users");

    // console.log("\n========== STUDENTS TABLE COLUMNS ==========\n");
    // console.table(columns);


    // const [rows] = await pool.query("SHOW CREATE TABLE users");

    // console.log("\n========== CREATE TABLE ==========\n");
    // console.log(rows[0]["Create Table"]);
    // console.log("\n==================================\n");

    // !-------------------------------------------------------------------

    // Add the new column
    // await pool.query(`
    //   ALTER TABLE students
    //   ADD COLUMN academic_status ENUM(
    //     'studying',
    //     'graduated',
    //     'dropout',
    //     'transferred',
    //     'suspended'
    //   ) NOT NULL DEFAULT 'studying'
    //   AFTER mobile_number
    // `);

    // console.log("✅ academic_status column added successfully.");

    // const [rows] = await pool.query("SHOW CREATE TABLE students");

    // console.log("\n========== STUDENTS TABLE ==========\n");
    // console.log(rows[0]["Create Table"]);
    // console.log("\n====================================\n");

  } catch (error) {
    console.error("❌ Error updating students table:");
    console.error(error);
  }
}

module.exports = dbUpdate;