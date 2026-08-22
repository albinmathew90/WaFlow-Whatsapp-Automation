const fs = require('fs');
let c = fs.readFileSync('widget-script.ts', 'utf8');

// Read the actual raw bytes around onerror
const idx = c.indexOf('onerror');
const before_raw = c.substring(idx - 5, idx + 80);
console.log('Raw bytes:', [...before_raw].map(ch => ch.charCodeAt(0).toString(16).padStart(2,'0')).join(' '));
console.log('String:', JSON.stringify(before_raw));
