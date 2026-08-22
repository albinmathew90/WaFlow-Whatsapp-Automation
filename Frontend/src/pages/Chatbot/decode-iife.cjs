const fs = require('fs');
const raw = fs.readFileSync('widget-script.ts', 'utf8');
const start = raw.indexOf('"') + 1;
const end = raw.lastIndexOf('";');
const escaped = raw.substring(start, end);

// Decode the escaped string to get the actual IIFE code
let jsCode = escaped
  .replace(/\\n/g, '\n')
  .replace(/\\r/g, '\r')
  .replace(/\\t/g, '\t')
  .replace(/\\"/g, '"')
  .replace(/\\\\/g, '\\');

console.log('IIFE starts with:', jsCode.substring(0, 30));
console.log('IIFE ends with:', jsCode.substring(jsCode.length - 30));
const onErrIdx = jsCode.indexOf('onerror');
if (onErrIdx !== -1) {
  console.log('onerror context:', JSON.stringify(jsCode.substring(onErrIdx - 5, onErrIdx + 60)));
}

// Write the decoded IIFE so user can paste it directly
fs.writeFileSync('widget-iife-decoded.js', jsCode);
console.log('\nDecoded IIFE written to widget-iife-decoded.js (' + jsCode.length + ' chars)');
