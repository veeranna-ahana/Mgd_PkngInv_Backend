var mysql = require("mysql2");
require("dotenv").config();

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPort = process.env.DB_PORT;
const dbPassword = process.env.DB_PASSWORD;
const dbDatabase1 = process.env.DB_DATABASE_1; //magodmis
const dbDatabase2 = process.env.DB_DATABASE_2; //magod_setup
const dbDatabase3 = process.env.DB_DATABASE_3; //magodqtn
const dbDatabase4 = process.env.DB_DATABASE_4; //machine_data
const dbDatabase5 = process.env.DB_DATABASE_5; //magod_sales
const dbDatabase6 = process.env.DB_DATABASE_6; //magod_mtrl

var misConn = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  port: dbPort,
  password: dbPassword,
  database: dbDatabase1,
});

var setupConn = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  port: dbPort,
  password: dbPassword,
  database: dbDatabase2,
});

var qtnConn = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  port: dbPort,
  password: dbPassword,
  database: dbDatabase3,
});

var mchConn = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  port: dbPort,
  password: dbPassword,
  database: dbDatabase4,
});

var slsConn = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  port: dbPort,
  password: dbPassword,
  database: dbDatabase5,
});

var mtrlConn = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  port: dbPort,
  password: dbPassword,
  database: dbDatabase6,
});

let misQuery = async (q, callback) => {
  misConn.connect();
  misConn.query(q, (err, res, fields) => {
    if (err) throw err;
    callback(res);
  });
};

// let misQueryMod = async (q, callback) => {
//   misConn.connect();
//   misConn.query(q, (err, res, fields) => {
//     if (err) callback(err, null);
//     else callback(null, res);
//   });
// };

let misQueryMod = async (q, callback) => {
  try {
    misConn.connect((connectErr) => {
      if (connectErr) {
        // Handle connection error
        if (typeof callback === "function") {
          callback(connectErr, null);
        } else {
          console.error("Callback is not a function.");
        }
        return;
      }

      misConn.query(q, (err, res, fields) => {
        // misConn.end(); // Close the connection

        if (typeof callback === "function") {
          if (err) {
            callback(err, null);
          } else {
            callback(null, res);
          }
        } else {
          console.error("Callback is not a function.");
        }
      });
    });
  } catch (error) {
    // Handle unexpected errors
    console.error("Unexpected error:", error);

    if (typeof callback === "function") {
      callback(error, null);
    } else {
      console.error("Callback is not a function.");
    }
  }
};

// const misQueryMod = async (q, values) => {
//   misConn.connect();
//   try {
//     const [rows, fields] = await misConn.query(q, values);
//     return rows;
//   } catch (err) {
//     throw err;
//   } finally {
//     misConn.end(); // Close the connection after the query
//   }
// };

let mtrlQueryMod = async (m, callback) => {
  mtrlConn.connect();
  mtrlConn.query(m, (err, res, fields) => {
    if (err) callback(err, null);
    else callback(null, res);
  });
};

let setupQuery = (q, callback) => {
  setupConn.connect();
  setupConn.query(q, (err, res, fields) => {
    if (err) throw err;
    callback(res);
  });
};

let setupQueryMod = async (q, callback) => {
  setupConn.connect();
  setupConn.query(q, (err, res, fields) => {
    if (err) callback(err, null);
    else callback(null, res);
  });
};

let qtnQuery = (q, callback) => {
  // console.log(q);
  qtnConn.connect();
  qtnConn.query(q, (err, res, fields) => {
    if (err) throw err;
    callback(res);
    // return res[0].solution;
  });
};

let qtnQueryMod = (q, callback) => {
  // console.log(q);
  qtnConn.connect();
  qtnConn.query(q, (err, res, fields) => {
    if (err) callback(err, null);
    else callback(null, res);
    // return res[0].solution;
  });
};

let qtnQueryModv2 = (q, values, callback) => {
  // console.log(q);
  qtnConn.connect();
  qtnConn.query(q, values, (err, res, fields) => {
    if (err) callback(err, null);
    else callback(null, res);
    // return res[0].solution;
  });
};

let slsQueryMod = (s, callback) => {
  slsConn.connect();
  slsConn.query(s, (err, res, fields) => {
    if (err) callback(err, null);
    else callback(null, res);
  });
};

let mchQueryMod = (m, callback) => {
  mchConn.connect();
  mchConn.query(m, (err, res, fields) => {
    if (err) callback(err, null);
    else callback(null, res);
  });
};

module.exports = {
  misQuery,
  setupQuery,
  qtnQuery,
  misQueryMod,
  qtnQueryMod,
  qtnQueryModv2,
  slsQueryMod,
  mchQueryMod,
  mtrlQueryMod,
  setupQueryMod,
};
