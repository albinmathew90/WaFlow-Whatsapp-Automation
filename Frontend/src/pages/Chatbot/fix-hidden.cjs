const fs = require('fs');
let c = fs.readFileSync('widget-script.ts', 'utf8');

// Fix: this.style.hidden=true -> this.hidden=true
c = c.replace('this.style.hidden=true', 'this.hidden=true');
// Also need to remove the semicolon since it's fine either way but let's clean up the full replace
c = c.replace('this.style.hidden=true;', 'this.hidden=true');

fs.writeFileSync('widget-script.ts', c);

const nc = fs.readFileSync('widget-script.ts', 'utf8');
const idx = nc.indexOf('onerror');
console.log('Fixed onerror:', JSON.stringify(nc.substring(idx, idx + 50)));
