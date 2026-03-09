const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'complaints.db');

console.log('USING DB FILE:', dbPath); // LOG HERE

const db = new sqlite3.Database(dbPath);


db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    regnum TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'student'
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_email TEXT,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'Pending',
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_email) REFERENCES users(email)
  )`);

 // Seed admin
  const bcrypt = require('bcryptjs');
  bcrypt.hash('adminpass', 10, (err, hash) => {
    db.run("INSERT OR IGNORE INTO users (email, regnum, password, role) VALUES (?, ?, ?, ?)", ['admin@school.com', 'ADMIN001', hash, 'admin']  );
  });
});

module.exports = db;
