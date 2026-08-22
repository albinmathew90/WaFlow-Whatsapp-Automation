const fs = require('fs');
let c = fs.readFileSync('widget-script.ts', 'utf8');

// The decoded IIFE has: onerror="this.style.display=\'none\';"
// We need: onerror="this.hidden=true"
// In the raw TS source, the backslash-escaped pattern is:
// display=\\'none\\'
// We need to replace the entire onerror logic

// Replace the problematic onerror with a simpler one that has no quotes inside
c = c.replace("display=\\'none\\'", "hidden=true");
c = c.replace("display='none'", "hidden=true");

fs.writeFileSync('widget-script.ts', c);

// Verify
const nc = fs.readFileSync('widget-script.ts', 'utf8');
const idx = nc.indexOf('onerror');
if (idx !== -1) {
  console.log('onerror context:', JSON.stringify(nc.substring(idx - 5, idx + 60)));
} else {
  console.log('onerror not found (may have been fully removed)');
}
console.log('Done');
