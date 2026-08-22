const fs = require('fs');
let c = fs.readFileSync('widget-script.ts', 'utf8');

// Fix: 'data =' needs 'var data;' declared before the try block
// The pattern in the file (raw escaped string) is:
// try {\\n\\n            data =\\n                await response.json();
// We need to add 'var data;' before the try block

const findStr = '        try {\\n\\n            data =\\n                await response.json();';
const replaceStr = '        var data;\\n        try {\\n\\n            data =\\n                await response.json();';

if (c.includes(findStr)) {
  c = c.replace(findStr, replaceStr);
  console.log('✅ Fixed! Added var data; declaration');
} else {
  console.log('Pattern not found, searching for it...');
  const idx = c.indexOf('data =');
  console.log('Context:', JSON.stringify(c.substring(idx - 80, idx + 100)));
}

fs.writeFileSync('widget-script.ts', c);

// Verify fix
const nc = fs.readFileSync('widget-script.ts', 'utf8');
const idx = nc.indexOf('var data;');
if (idx !== -1) {
  console.log('Verified - var data found at:', idx);
  console.log('Context:', JSON.stringify(nc.substring(idx - 20, idx + 80)));
}
