const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8091;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  // Find the local network IP for the user
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }

  console.log(`\n🐾 Winston 桌面宠物服务已启动\n`);
  console.log(`   本机访问:  http://localhost:${PORT}`);
  console.log(`   iPhone:    http://${localIP}:${PORT}\n`);
  console.log(`📱 在 iPhone 上:`);
  console.log(`   1. 确保 iPhone 和 Mac 连接同一个 WiFi`);
  console.log(`   2. 打开 Safari 访问上面的 iPhone 地址`);
  console.log(`   3. 点击「分享」→「添加到主屏幕」`);
  console.log(`   4. 从主屏幕打开即可全屏运行\n`);
});
