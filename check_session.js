const { DataSource } = require('typeorm');
const path = require('path');

const ds = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:postgres@localhost:5432/convoreach',
});

ds.initialize().then(async () => {
  const res = await ds.query("SELECT id, phone, name FROM \"session\" WHERE id = '2ccfb06a-405a-42de-877c-62042bd8045c'");
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}).catch(console.error);
