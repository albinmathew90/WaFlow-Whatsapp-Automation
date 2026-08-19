import fs from 'fs';

const filePath = 'd:/ConvoReach/Frontend/src/pages/Chatbot/Chatbot.tsx';
const code = fs.readFileSync(filePath, 'utf8');

// Check how many actual newlines there are
const realNewlines = (code.match(/\n/g) || []).length;
console.log('Real newlines in file:', realNewlines);
console.log('File length:', code.length);
console.log('First 500 chars:', code.substring(0, 500));
console.log('---');
console.log('Chars around pos 17850:', code.substring(17845, 17860));
