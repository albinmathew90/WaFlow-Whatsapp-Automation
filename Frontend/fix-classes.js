import fs from 'fs';

const filePath = 'd:/ConvoReach/Frontend/src/pages/Chatbot/Chatbot.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Replace duplicate classNames like className="A" className="B" with className="A B"
code = code.replace(/className=(["'])([^"']*)(["'])\s+className=(["'])([^"']*)(["'])/g, 'className=$1$2 $5$6');

fs.writeFileSync(filePath, code);
console.log('Fixed duplicate classNames');
