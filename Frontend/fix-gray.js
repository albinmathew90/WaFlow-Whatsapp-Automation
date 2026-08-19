import fs from 'fs';

const filePath = 'd:/ConvoReach/Frontend/src/pages/Chatbot/Chatbot.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Replace the inline background styles that prevent dark mode backgrounds from working
code = code.replace(/background:\s*['"]var\(--color-gray-50\)['"],?/g, '');

fs.writeFileSync(filePath, code);
console.log('Removed inline backgrounds');
