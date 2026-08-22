const fs = require('fs');
const raw = fs.readFileSync('widget-script.ts', 'utf8');

// Extract the string value (everything between the first " and last ";)
const start = raw.indexOf('"') + 1;
const end = raw.lastIndexOf('";');
const escaped = raw.substring(start, end);

// Parse it as a JSON string to get actual JS code
try {
  const jsCode = JSON.parse('"' + escaped + '"');
  console.log('✅ String parsed OK! Length:', jsCode.length);
  const erridx = jsCode.indexOf('onerror');
  if (erridx !== -1) {
    console.log('onerror context in generated JS:', JSON.stringify(jsCode.substring(erridx - 5, erridx + 55)));
  }
} catch(e) {
  console.error('❌ Parse error:', e.message);
}
