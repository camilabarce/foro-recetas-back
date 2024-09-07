require('dotenv').config();
var mysql = require('mysql2');

var connection = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true, 
    connectionLimit: 10,      
    queueLimit: 0 
});

connection.getConnection((err, connection) => {
    if (err) {
        console.error('Error al obtenerla conexión del pool:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos.');
});

module.exports = connection;