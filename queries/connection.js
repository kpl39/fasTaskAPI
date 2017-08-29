var promise = require('bluebird');


var options = {
  promiseLib: promise
};

var pgp = require('pg-promise')(options);


var dbConnection = {
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT,
  database: process.env.RDS_DB_NAME
}

var db = pgp(dbConnection);

module.exports = db;