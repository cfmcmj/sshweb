const express = require('express');
const WebSocket = require('ws');
const app = express();

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.get('/ssh', (req, res) => {
  console.log('Accessing /ssh endpoint');
  res.json({ message: 'SSH connection endpoint' });
});

app.post('/connect-ssh', (req, res) => {
  const { host } = req.body;
  console.log(`Received /connect-ssh request with host: ${host}`);
  if (!host) {
    return res.status(400).json({ error: 'Missing host' });
  }

  // 测试 WebSocket 连接到已知服务
  const ws = new WebSocket('wss://echo.websocket.org');
  ws.on('open', () => {
    console.log('WebSocket connection to echo.websocket.org successful');
    ws.send('Test message');
  });
  ws.on('message', (data) => {
    console.log(`Received from echo.websocket.org: ${data}`);
    ws.close();
    res.json({ message: `WebSocket test successful: ${data}` });
  });
  ws.on('error', (err) => {
    console.error(`WebSocket error: ${err.message}`);
    res.status(500).json({ error: `WebSocket connection failed: ${err.message}` });
  });
});

module.exports = app;