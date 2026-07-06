const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'keys');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

fs.writeFileSync(path.join(dir, 'jwtRS256.key.pub'), publicKey);
fs.writeFileSync(path.join(dir, 'jwtRS256.key'), privateKey);

console.log('RS256 keys generated in keys/ directory.');
