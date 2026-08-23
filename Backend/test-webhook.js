const sqlite3 = require('sqlite3').verbose();
const http = require('http');

const db = new sqlite3.Database('./data/openwa.sqlite', (err) => {
  if (err) {
    console.error('Error opening db:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.get('SELECT id, webhookToken FROM users WHERE webhookToken IS NOT NULL LIMIT 1', (err, user) => {
    if (err) {
      console.error('Error fetching user:', err.message);
      process.exit(1);
    }
    if (!user) {
      console.log('No user with webhook token found. Ensure you saved the webhook flow first!');
      process.exit(0);
    }

    console.log(`Found User: ${user.id} with Token: ${user.webhookToken}`);

    db.get('SELECT id, trigger FROM crm_flows WHERE userId = ? AND trigger LIKE "%webhook%" LIMIT 1', [user.id], (err, flow) => {
      if (err) {
        console.error('Error fetching flow:', err.message);
        process.exit(1);
      }
      if (!flow) {
        console.log('No webhook flow found for this user.');
        process.exit(0);
      }

      const trigger = JSON.parse(flow.trigger);
      const eventName = trigger.triggerEventNames && trigger.triggerEventNames.length > 0 ? trigger.triggerEventNames[0] : 'order.placed';

      console.log(`Testing flow ${flow.id} for event: ${eventName}`);

      const payload = JSON.stringify({
        event: eventName,
        customer: { name: 'Automated Test User', phone: '1234567890' },
        value: 99.99
      });

      const options = {
        hostname: 'localhost',
        port: 2785,
        path: `/api/crm/flows/webhooks/${user.id}/${user.webhookToken}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('RESPONSE:', data);
        });
      });

      req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
      });

      req.write(payload);
      req.end();
    });
  });
});
