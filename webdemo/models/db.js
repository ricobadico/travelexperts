const mysql = require("mysql");

// prettier-ignore [Bob]
// used but should have promisified it. long running queries or remote db may cause problems as it isn't async compatible
const getConnection = () => {
    // Open up the database for use. Any expreess method call can use this 'connection' variable, but needs to connect and end it's particular connection instance! (see existing examples)
    try {
        let connection = mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASS,
          database: process.env.DB_NAME,
          multipleStatements: true
        });
        console.log(`DB connection success: ${process.env.DB_HOST}`);
        return connection;
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

// not used and not working
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

module.exports = getConnection;
