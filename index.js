const express = require('express');
const app = express();

// 提供静态文件（HTML、CSS、JS）
app.use(express.static('public'));

// 首页路由
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// 示例 SSH 端点（可替换为实际 SSH 逻辑）
app.get('/ssh', (req, res) => {
  res.json({ message: 'SSH connection endpoint' });
});

// 监听端口（兼容 Render 环境变量）
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`SSHweb running on port ${port}`));