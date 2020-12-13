// [Bob]
// this was intended to be a modlue for the password checking
// but I never had time to refactor the code
// below are test functions I used when implementing the code
// they are not used right now


const getConnection = require("../models/db.js");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const genPasswordHash = (myPlaintextPassword) => {
  bcrypt.hash(myPlaintextPassword, saltRounds, (err, hash) => {
    // Store hash in your password DB.
    if (err) {
      console.error(err);
      console.log("unable to hash new password!");
      return false; // continue
    } else {
      //console.log(typeof hash);
      console.log(hash);
      return hash.slice(0);
    }
  });
};

const checkPasswordHash = (myPlaintextPassword, hash) => {
  bcrypt.compare(myPlaintextPassword, hash, (err, result) => {
    // Compare and return true or false
    if (err) {
      console.error(err);
      console.log("error in checking password!");
      return false; // continue
    } else {
      if (result) {
        console.log("Passwords Match");
      } else {
        console.log("Passwords Do Not Match");
      }
      return result;
    }
  });
};

module.exports.genPasswordHash = genPasswordHash;
module.exports.checkPasswordHash = checkPasswordHash;
