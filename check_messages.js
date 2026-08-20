const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/convoreach' });
client.connect().then(async () => {
  const res = await client.query("SELECT id, \"chatId\", \"from\", type, status, \"waMessageId\", body FROM message ORDER BY \"createdAt\" DESC LIMIT 10");
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}).catch(console.error);
