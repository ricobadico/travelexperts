const mysql = require("mysql");

const getConn = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      multipleStatements: true,
    });

    console.log(`MySql connected: ${process.env.DB_HOST}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  // for my brain - try block will return promise of mysql connection
  //return connection;
};

module.exports = getConn;
