import fs from 'fs';
import path from 'path';

function findHurlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHurlFiles(filePath, fileList);
    } else if (filePath.endsWith('.hurl')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = findHurlFiles('test/hurl');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We only want exact matches for:
  // POST {{api_url}}/api/businesses\n
  // or PATCH {{api_url}}/api/businesses/{{...}}\n
  // Actually, for PATCH it's not strictly required unless the test asserts something,
  // but let's stick to POST businesses to make them valid creation payloads.
  // Wait, does PATCH require it? DTO made them optional for update, so no.
  // So only POST /api/businesses
  
  content = content.replace(/(POST \{\{api_url\}\}\/api\/businesses\r?\n(?:[A-Za-z\-]+: .*\r?\n)*\{)([\s\S]*?)(\r?\n\})/g, (match, p1, p2, p3) => {
    let newBody = p2;
    if (!newBody.includes('"businessType"')) {
      newBody += `,\n  "businessType": "PHYSICAL"`;
    }
    if (!newBody.includes('"phoneNumber"')) {
      newBody += `,\n  "phoneNumber": "+2348000000000"`;
    }
    if (!newBody.includes('"whatsapp"')) {
      newBody += `,\n  "whatsapp": "+2348000000000"`;
    }
    if (!newBody.includes('"email"')) {
      newBody += `,\n  "email": "test@business.com"`;
    }
    return p1 + newBody + p3;
  });

  // Remove the note about businessType removed
  content = content.replace(/# NOTE: businessType field no longer exists — removed from schema.\r?\n/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
