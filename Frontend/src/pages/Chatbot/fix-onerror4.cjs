const fs = require('fs');
let c = fs.readFileSync('widget-script.ts', 'utf8');

// From the raw bytes, the actual bytes in the file around onerror are:
// ... 5c 22 20 6f 6e 65 72 72 6f 72 3d 5c 22 74 68 69 73 2e 73 74 79 6c 65 2e 64 69 73 70 6c 61 79 3d 27 6e 6f 6e 65 27 3b 5c 22 20 ...
// Which decodes to: \" onerror=\"this.style.display='none';\" 
// So the actual string IN THE FILE (as raw chars) is:
// \" onerror=\"this.style.display='none';\"
//
// The 27 bytes are literal single quotes - that's the bug.
// We need to replace the literal single-quoted 'none' with escaped ones.
// The actual bytes to replace: 3d 27 6e 6f 6e 65 27 3b  (='none';)
// Replace with: 3d 5c 27 6e 6f 6e 65 5c 27 3b  (=\'none\';)

// In JS string terms:
// Find: ="this.style.display='none';"
// Replace: ="this.style.display=\\'none\\';"
// But 5c is backslash, so we need actual backslash chars in the output

const findStr = "display='none'";
const replaceStr = "display=\\'none\\'";

if (c.includes(findStr)) {
  c = c.replace(findStr, replaceStr);
  console.log('Success! Replaced', JSON.stringify(findStr), 'with', JSON.stringify(replaceStr));
} else {
  console.log('Pattern not found');
}

fs.writeFileSync('widget-script.ts', c);

// Verify
const nc = fs.readFileSync('widget-script.ts', 'utf8');
const idx = nc.indexOf('onerror');
console.log('After fix:', JSON.stringify(nc.substring(idx - 5, idx + 60)));
