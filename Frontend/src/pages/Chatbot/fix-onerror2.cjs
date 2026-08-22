const fs = require('fs');
let c = fs.readFileSync('widget-script.ts', 'utf8');

// The current string in the file (raw) has:
// onerror=\"this.style.display='none';\"
// But when this runs in the browser, the 'none' single quotes break string context
// We need to escape them as: onerror=\"this.style.display=\\'none\\';\"
// Which in the actual JS output becomes: onerror="this.style.display=\'none\';"

c = c.replace(
  `onerror=\\\\\\"this.style.display='none';\\\\\\"`  ,
  `onerror=\\\\\\"this.style.display=\\\\'none\\\\';\\\\\\"`
);

fs.writeFileSync('widget-script.ts', c);
console.log('done');
console.log('verify:');
const idx = c.indexOf('onerror');
console.log(JSON.stringify(c.substring(idx - 5, idx + 70)));
