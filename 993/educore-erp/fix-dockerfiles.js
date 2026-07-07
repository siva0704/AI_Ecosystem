const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'backend', 'services');
const services = fs.readdirSync(servicesDir);

for (const service of services) {
  const dockerfilePath = path.join(servicesDir, service, 'Dockerfile');
  if (fs.existsSync(dockerfilePath)) {
    let content = fs.readFileSync(dockerfilePath, 'utf8');
    content = content.replace(/npm ci/g, 'npm install');
    fs.writeFileSync(dockerfilePath, content);
    console.log(`Updated ${dockerfilePath}`);
  }
}
