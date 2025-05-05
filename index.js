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

  // 测试 WebSocket 连接
  const ws = new WebSocket(`wss://${host}:443`);
  ws.on('open', () => {
    console.log(`WebSocket connection to ${host}:443 successful`);
    ws.close();
    res.json({ message: `WebSocket test to ${host} successful` });
  });
  ws.on('error', (err) => {
    console.error(`WebSocket error: ${err.message}`);
    res.status(500).json({ error: `WebSocket connection failed: ${err.message}` });
  });
});

module.exports = app;