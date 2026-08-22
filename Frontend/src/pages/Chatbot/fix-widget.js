const fs = require('fs');
let c = fs.readFileSync('widget-script.ts', 'utf8');
c = c.replace(
  'capturedData = data;\\n            try {',
  'capturedData = data;\\n            try {\\n                sendMessage("").catch(function(e) {});'
);
fs.writeFileSync('widget-script.ts', c);
console.log('Widget updated');
