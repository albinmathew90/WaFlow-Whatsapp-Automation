const fs = require('fs');
let c = fs.readFileSync('widget-script.ts', 'utf8');

// The problematic part: onerror="this.style.display='none';"
// Inside the IIFE string (which is double-quoted at the TS export level),
// the onerror attribute has unescaped single quotes that break JS parsing.
// We need to replace 'none' with a safer alternative that avoids quote issues.

// Replace: onerror="this.style.display='none';"
// With:    onerror="this.style.display='none';" -> use setAttribute approach instead
// Actually simplest fix: change 'none' to use double quotes via HTML entity or use setAttribute

// Replace the img construction to avoid onerror with single quotes inside double-quoted attr
// Change: onerror="this.style.display='none';"
// To:     onerror="this.setAttribute('style','display:none')"
// Even simpler - use a data attribute approach

// Actually the cleanest: replace with onerror="this.hidden=true"
const before = "onerror=\\\\\"this.style.display='none';\\\\\"";
const after = "onerror=\\\\\"this.hidden=true\\\\\"";

if (c.includes(before)) {
  c = c.replace(before, after);
  console.log('Replaced successfully!');
} else {
  // Try to find the actual string
  const idx = c.indexOf('onerror');
  if (idx !== -1) {
    console.log('onerror context (raw):', JSON.stringify(c.substring(idx - 5, idx + 80)));
  }
}

fs.writeFileSync('widget-script.ts', c);
