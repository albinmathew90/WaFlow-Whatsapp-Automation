const fs = require('fs');
let c = fs.readFileSync('widget-script.ts', 'utf8');
c = c.replace(/\\\\\\\\'none\\\\\\\\'/g, "'none'");
fs.writeFileSync('widget-script.ts', c);
console.log('fixed');
