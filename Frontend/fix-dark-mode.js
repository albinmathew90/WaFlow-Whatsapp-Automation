import fs from 'fs';

const filePath = 'd:/ConvoReach/Frontend/src/pages/Chatbot/Chatbot.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace hardcoded style backgrounds
code = code.replace(/style={{([^}]*)background:\s*['"]white['"]([^}]*)}}/gi, "style={{$1$2}} className=\"bg-white dark:bg-gray-800\"");
code = code.replace(/style={{([^}]*)background:\s*['"]#fff(fff)?['"]([^}]*)}}/gi, "style={{$1$3}} className=\"bg-white dark:bg-gray-800\"");

// 2. Replace hardcoded text colors in styles that are dark
code = code.replace(/style={{([^}]*)color:\s*['"]#(111827|111|222|000|333|1f2937|111827)['"]([^}]*)}}/gi, "style={{$1$3}} className=\"text-gray-900 dark:text-gray-100\"");
code = code.replace(/style={{([^}]*)color:\s*['"]black['"]([^}]*)}}/gi, "style={{$1$2}} className=\"text-gray-900 dark:text-gray-100\"");
code = code.replace(/style={{([^}]*)color:\s*['"]rgba?\(0,\s*0,\s*0[^)]*\)['"]([^}]*)}}/gi, "style={{$1$2}} className=\"text-gray-900 dark:text-gray-100\"");

// 3. Fix bg-white classes that don't have dark:bg
code = code.replace(/className=(["'][^"']*)bg-white([^"']*["'])/g, (match, p1, p2) => {
  if (match.includes('dark:bg-')) return match;
  return `className=${p1}bg-white dark:bg-gray-900${p2}`;
});

// 4. Fix text-gray-800 or text-gray-900 classes that don't have dark:text
code = code.replace(/className=(["'][^"']*)text-gray-[89]00([^"']*["'])/g, (match, p1, p2) => {
  if (match.includes('dark:text-')) return match;
  return match.replace(/text-gray-([89]00)/, 'text-gray-$1 dark:text-gray-200');
});

// Fix specific layout elements:
// The "Waflow Bot Auto-Responder" banner
code = code.replace(/<div className="bg-white rounded-2xl/g, '<div className="bg-white dark:bg-gray-900 rounded-2xl');

// The dashed box in rules
code = code.replace(/border-dashed border-gray-300/g, 'border-dashed border-gray-300 dark:border-gray-700');

// The 'Quick Templates' box
code = code.replace(/bg-gray-50 rounded-2xl/g, 'bg-gray-50 dark:bg-gray-800/50 rounded-2xl');
code = code.replace(/bg-white rounded-xl shadow-sm border border-gray-100/g, 'bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800');

// Input backgrounds
code = code.replace(/bg-white border-gray-200/g, 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800');

// Replace className="text-gray-900 dark:text-gray-100" where a style also exists
// e.g. <div style={{...}} className="..." className="text-gray-900 dark:text-gray-100">
code = code.replace(/className="text-gray-[0-9]+ dark:text-gray-[0-9]+"\s+className="/g, 'className="text-gray-900 dark:text-gray-100 ');

fs.writeFileSync(filePath, code);
console.log('Fixed dark mode issues');
