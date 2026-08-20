const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('/home/azureuser/convoreach/Backend/database.sqlite');
db.all('SELECT id, status, waMessageId, type, body FROM inbox_messages ORDER BY createdAt DESC LIMIT 10;', (err, rows) => {
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
