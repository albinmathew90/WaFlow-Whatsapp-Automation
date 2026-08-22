const fs = require('fs');
const raw = fs.readFileSync('widget-script.ts', 'utf8');

const start = raw.indexOf('"') + 1;
const end = raw.lastIndexOf('";');
const escaped = raw.substring(start, end);

// Try a different approach: use vm to check if it's a valid JS string literal
const vm = require('vm');
try {
  const result = vm.runInNewContext(`(${JSON.stringify(escaped)})`);
  console.log('JSON OK, length:', result.length);
} catch(e) {
  console.log('JSON fail, try eval:');
}

// Try evaluating as TS export
try {
  const val = vm.runInNewContext('(' + JSON.stringify('"' + escaped + '"') + ')');
  console.log('val OK');
} catch(e) {
  console.log('val fail:', e.message);
}

// Let's just try to find what the actual bad char is at that offset
// The JSON parse fails at position 21869 in the full string (starting from after first '"')
// But our scanner says no bad escapes. Maybe it's a backtick or template literal issue
const surrounding = escaped.substring(21840, 21920);
console.log('Surrounding bytes:', [...surrounding].map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join(' '));
