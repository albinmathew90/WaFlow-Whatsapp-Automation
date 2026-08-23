const fs = require('fs');
const path = 'd:\\\\ConvoReach\\\\Frontend\\\\src\\\\pages\\\\Chatbot\\\\widget-script.ts';
let code = fs.readFileSync(path, 'utf8');

// Fix escaped backticks
code = code.replace(/\\\\`/g, '`');
// Fix escaped dollar signs
code = code.replace(/\\\\\$/g, '$');
// Fix escaped single quotes in the img onerror handler to be normal single quotes
code = code.replace(/\\\\'none\\\\'/g, "'none'");

fs.writeFileSync(path, code);
console.log('Fixed widget-script.ts successfully');
