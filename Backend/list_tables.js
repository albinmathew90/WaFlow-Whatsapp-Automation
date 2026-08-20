const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./data/openwa.sqlite', (err) => {
  if (err) console.error("DB error:", err);
});
db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {
  if (err) console.error("Query error:", err);
  else console.log(JSON.stringify(rows, null, 2));
  db.close();
});
