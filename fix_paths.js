const fs = require('fs');
const files = ['d:/ConvoReach/Frontend/public/landing/index.html', 'd:/ConvoReach/Frontend/public/landing/blogs.html'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/images\\/g, 'images/');
  fs.writeFileSync(file, content);
}
console.log('Done');
