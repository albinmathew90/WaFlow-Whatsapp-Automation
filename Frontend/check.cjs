const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('useState(')) {
        if (!content.match(/import.*useState.*from.*['"]react['"]/)) {
          console.log("Missing useState import in:", fullPath);
        }
      }
    }
  }
}

walk('src');
