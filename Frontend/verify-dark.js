import fs from 'fs';

const filePath = 'd:/ConvoReach/Frontend/src/pages/Chatbot/Chatbot.tsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines.forEach((line, i) => {
  if (line.includes('bg-white') && !line.includes('dark:bg-')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
  if (line.includes('text-gray-') && !line.includes('dark:text-')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
  if (line.includes('style={{') && line.match(/color:\s*['"]#(111|222|000|333|111827|1f2937)['"]/i)) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
  if (line.includes('style={{') && line.match(/background:\s*['"]white['"]/i)) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
});
