const fs = require('fs');
const raw = fs.readFileSync('widget-script.ts', 'utf8');

// Find the error location
const start = raw.indexOf('"') + 1;
const end = raw.lastIndexOf('";');
const escaped = raw.substring(start, end);

// Find bad escape at position 21869
const badPos = 21869;
console.log('Context around bad escape (position', badPos, '):');
console.log(JSON.stringify(escaped.substring(badPos - 20, badPos + 40)));

// Show all single backslash occurrences (should be \\n, \\t, \\", etc.)
// Look for single backslash followed by invalid char
let i = 0;
let foundBad = false;
while (i < escaped.length) {
  if (escaped[i] === '\\') {
    const next = escaped[i+1];
    if (!['"', '\\', 'n', 'r', 't', 'u', '/', 'b', 'f', "'"].includes(next)) {
      console.log(`Bad escape at ${i}: \\${next} (charCode: ${next ? next.charCodeAt(0) : 'EOF'})`);
      console.log('Context:', JSON.stringify(escaped.substring(i - 20, i + 40)));
      foundBad = true;
    }
    i += 2;
  } else {
    i++;
  }
}
if (!foundBad) console.log('No bad escapes found by scan');
