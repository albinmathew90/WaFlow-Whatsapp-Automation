const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('d:/ConvoReach/Backend/data/openwa.sqlite');

db.all("SELECT waMessageId, status, metadata FROM messages WHERE metadata LIKE '%source%'", (err, rows) => {
  if (err) console.error(err);
  console.log(JSON.stringify(rows, null, 2));
});
