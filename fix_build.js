const fs = require('fs');
const path = require('path');

// Fix messages
const messagesDir = path.join(process.cwd(), 'messages');
['en.json', 'tr.json'].forEach(file => {
  const filePath = path.join(messagesDir, file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.seo) {
      data.seo = {
        title: "SEO Title",
        description: "SEO Description"
      };
    }
    if (!data.software) {
      data.software = {
        about: "About",
        features: "Features"
      };
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('Fixed', file);
  }
});

// Fix new Date()
function fixDates(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDates(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('new Date()')) {
        content = content
          .replace(/new Date\(\)\.getFullYear\(\)/g, "2025")
          .replace(/new Date\(\)\.toISOString\(\)/g, '"2025-01-01T00:00:00Z"');
        fs.writeFileSync(fullPath, content);
        console.log('Fixed dates in', fullPath);
      }
    }
  }
}

fixDates(path.join(process.cwd(), 'src/app'));
