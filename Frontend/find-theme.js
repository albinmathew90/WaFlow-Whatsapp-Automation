import fs from 'fs';

const code = fs.readFileSync('d:/ConvoReach/Frontend/src/pages/Chatbot/Chatbot.tsx', 'utf8');
const lines = code.split('\n');

// Search for theme style and widget position
const queries = ['glassy', 'glassmorphic', 'theme', 'position', 'widget', 'solid', 'classic', 'bottom-right', 'bottom_right', 'position ===', 'widgetPosition'];
queries.forEach(q => {
  lines.forEach((l, i) => {
    if (l.toLowerCase().includes(q.toLowerCase())) {
      if (i < 50 || lines[i].includes('bottom') || lines[i].includes('position') || lines[i].includes('solid') || lines[i].includes('glass')) {
        console.log(`[${q}] L${i+1}: ${l.trim()}`);
      }
    }
  });
});
