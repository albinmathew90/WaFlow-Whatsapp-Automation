const fs = require('fs');
const code = fs.readFileSync('d:/ConvoReach/Frontend/src/pages/Chatbot/Chatbot.tsx', 'utf8');

const issues = [];
code.split('\n').forEach((line, i) => {
  if (line.match(/text-gray-[89]00/) && !line.match(/dark:text-/)) {
    issues.push(`Line ${i+1}: Missing dark mode text for text-gray - ${line.trim()}`);
  }
  if (line.match(/bg-white/) && !line.match(/dark:bg-/)) {
    issues.push(`Line ${i+1}: Missing dark mode bg for bg-white - ${line.trim()}`);
  }
  if (line.match(/color:\s*['"]#(111|222|000|1e293b)['"]/i) || line.match(/color:\s*['"]#333['"]/i)) {
    issues.push(`Line ${i+1}: Hardcoded dark color - ${line.trim()}`);
  }
  if (line.match(/background:\s*['"]white['"]/i) || line.match(/background:\s*['"]#fff['"]/i)) {
    issues.push(`Line ${i+1}: Hardcoded white background - ${line.trim()}`);
  }
});

fs.writeFileSync('d:/ConvoReach/Frontend/style_issues.txt', issues.join('\n'));
console.log(`Found ${issues.length} issues`);
