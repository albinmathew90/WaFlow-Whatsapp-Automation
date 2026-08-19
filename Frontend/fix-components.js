import fs from 'fs';

const filePath = 'd:/ConvoReach/Frontend/src/pages/Chatbot/Chatbot.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Chatbot Icon / Avatar
code = code.replace(/background:\s*isSelected\s*\?\s*'var\(--color-brand-50\)'\s*:\s*'var\(--color-white\)'/g, "background: isSelected ? 'var(--color-brand-50)' : ''");
// In Chatbot Icon/Avatar text color
code = code.replace(/color:\s*isSelected\s*\?\s*'var\(--color-brand-500\)'\s*:\s*'var\(--color-gray-500\)'/g, "color: isSelected ? 'var(--color-brand-500)' : 'var(--color-text-secondary)'");

// 2. Palette presets
code = code.replace(/background:\s*isSelected\s*\?\s*'var\(--color-brand-900\)'\s*:\s*'white'/g, "background: isSelected ? 'var(--color-brand-900)' : ''");
code = code.replace(/color:\s*'var\(--color-gray-900\)'/g, "color: 'var(--color-text-primary)'");

// 3. Visual Theme Style & Widget Position & Collect Leads & Gradient Header & Widget Icon (All similar flex containers with white bg)
code = code.replace(/background:\s*'var\(--color-white\)'/g, "background: ''");

// 4. Quick Templates
code = code.replace(/className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-3"/g, "className=\"bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3\"");
code = code.replace(/className="font-medium text-sm text-gray-900"/g, "className=\"font-medium text-sm text-gray-900 dark:text-gray-100\"");
code = code.replace(/className="text-xs text-gray-500 truncate"/g, "className=\"text-xs text-gray-500 dark:text-gray-400 truncate\"");
// Add general dark backgrounds for Quick Templates items
code = code.replace(/<div\s+onClick=\{[^}]+\}\s+className="cursor-pointer\s+hover:bg-gray-50\s+transition-colors/g, "<div onClick={() => {}} className=\"cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors");
code = code.replace(/className="flex items-center justify-between mb-1 text-gray-900"/g, "className=\"flex items-center justify-between mb-1 text-gray-900 dark:text-white\"");

// 5. Test Knowledge Matching (Search / Simulator inputs)
// Input for searching knowledge
code = code.replace(/<input\s+type="text"\s+placeholder="Search knowledge\.\.\."/g, "<input type=\"text\" placeholder=\"Search knowledge...\" className=\"dark:bg-gray-900 dark:text-white\" ");
// Input for test simulator
code = code.replace(/<input\s+type="text"\s+placeholder="Ask a question to test your knowledge base\.\.\."/g, "<input type=\"text\" placeholder=\"Ask a question to test your knowledge base...\" className=\"dark:bg-gray-900 dark:text-white\" ");

// Also fix any leftover inline styles with hardcoded '#111827' or similar
code = code.replace(/color:\s*'#111827'/g, "color: 'var(--color-text-primary)'");
code = code.replace(/color:\s*'#374151'/g, "color: 'var(--color-text-secondary)'");

fs.writeFileSync(filePath, code);
console.log('Fixed styling for Dark Mode');
