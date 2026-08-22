const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'pages', 'Flows'),
  path.join(__dirname, 'pages', 'Flows', 'nodes'),
  path.join(__dirname, 'pages', 'Flows', 'edges')
];

const reps = [
  { class: 'bg-white', dark: 'dark:bg-gray-900' },
  { class: 'text-gray-900', dark: 'dark:text-white' },
  { class: 'text-gray-800', dark: 'dark:text-gray-200' },
  { class: 'text-gray-700', dark: 'dark:text-gray-300' },
  { class: 'text-gray-600', dark: 'dark:text-gray-400' },
  { class: 'text-gray-500', dark: 'dark:text-gray-400' },
  { class: 'border-gray-300', dark: 'dark:border-gray-600' },
  { class: 'border-gray-200', dark: 'dark:border-gray-700' },
  { class: 'border-gray-100', dark: 'dark:border-gray-800' },
  { class: 'bg-gray-50', dark: 'dark:bg-gray-800' },
  { class: 'bg-gray-100', dark: 'dark:bg-gray-800' },
  { class: 'bg-gray-200', dark: 'dark:bg-gray-700' },
  { class: 'bg-gray-50/50', dark: 'dark:bg-gray-800' },
  { class: 'bg-gray-100/50', dark: 'dark:bg-gray-800' },
  { class: 'divide-gray-100', dark: 'dark:divide-gray-800' },
  { class: 'divide-gray-200', dark: 'dark:divide-gray-700' },
  { class: 'hover:bg-gray-50', dark: 'dark:hover:bg-gray-800' },
  { class: 'hover:bg-gray-100', dark: 'dark:hover:bg-gray-700' },
  { class: 'hover:bg-gray-200', dark: 'dark:hover:bg-gray-700' },
  { class: 'bg-admin-bg', dark: 'dark:bg-gray-950' },
  { class: 'text-black', dark: 'dark:text-white' },
];

let filesUpdated = 0;
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    if (f.endsWith('.tsx')) {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    let oc = content;

    reps.forEach(rep => {
      // Regex: 
      // (?<![-:]) : Not preceded by a hyphen or colon
      // escape regex for class
      const escapedClass = rep.class.replace(/[:/]/g, '\\$&');
      const escapedDark = rep.dark.replace(/[:/]/g, '\\$&');
      
      const regex = new RegExp(`(?<![-:])${escapedClass}(?![-\\w]|\\s+${escapedDark})`, 'g');
      content = content.replace(regex, `${rep.class} ${rep.dark}`);
    });

    if (content !== oc) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${f}`);
      filesUpdated++;
    }
    }
  });
});
console.log(`Total files updated: ${filesUpdated}`);
