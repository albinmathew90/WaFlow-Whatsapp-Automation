const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/openwa.sqlite');

db.each("SELECT sql FROM sqlite_master WHERE name='otp_template_versions'", (err, row) => {
  console.log(row.sql);
});
