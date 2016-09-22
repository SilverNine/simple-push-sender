var mysql = require('mysql');
var databaseName = "databaseName";
var userName = "userName";
var password = "password";

console.log("Server Type : " + process.env.NODE_ENV);

if( process.env.NODE_ENV == 'production' ) {
    databaseName = "databaseName";
    userName = "userName";
    password = "password";
} else if( process.env.NODE_ENV == 'development' ) {
    //
}

// Initialize pool
var pool = mysql.createPool({
    connectionLimit : 3,
    host: "host",
    database: databaseName,
    user: userName,
    password: password,
    debug    :  false
});

module.exports = pool;