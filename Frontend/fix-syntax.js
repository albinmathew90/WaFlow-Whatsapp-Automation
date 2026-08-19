import fs from 'fs';

const filePath = 'd:/ConvoReach/Frontend/src/pages/Chatbot/Chatbot.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Fix the syntax errors left by the regex
code = code.replace(/\{\{\s*,\s*/g, '{{ ');
code = code.replace(/,\s*,/g, ',');
code = code.replace(/,\s*\}/g, ' }');

// There are other errors:
// src/pages/Chatbot/Chatbot.tsx(1566,105): error TS1136: Property assignment expected.
// Wait, I will just log lines with "{{ ," or ", }" to see if there are any remaining.

fs.writeFileSync(filePath, code);
console.log('Fixed syntax errors');
