const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/openwa.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Fast-forwarding time to expire all trials...");

db.run(`UPDATE users SET subscriptionStatus = 'expired', subscriptionExpiresAt = datetime('now', '-1 day')`, function(err) {
  if (err) {
    return console.error(err.message);
  }
  console.log(`Successfully expired trials! ${this.changes} user(s) were modified.`);
  db.close();
});
