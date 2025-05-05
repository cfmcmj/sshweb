const express = require('express');
const net = require('net');
const app = express();

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.get('/ssh', (req, res) => {
  res.json({ message: 'SSH connection endpoint' });
});

app.post('/connect-ssh', (req, res) => {
  const { host } = req.body;
  if (!host) {
    return res.status(400).json({ error: 'Missing host' });
  }

  console.log(`Attempting TCP connection to ${host}:80`);

  const socket = new net.Socket();
  socket.setTimeout(5000);
  socket.on('connect', () => {
    console.log(`TCP connection to ${host}:80 successful`);
    socket.destroy();
    res.json({ message: 'TCP connection to port 80 successful' });
  }).on('timeout', () => {
    console.error(`TCP connection to ${host}:80 timed out`);
    socket.destroy();
    res.status(500).json({ error: 'TCP connection timed out' });
  }).on('error', (err) => {
    console.error(`TCP connection error: ${err.message}`);
    socket.destroy();
    res.status(500).json({ error: `TCP connection failed: ${err.message}`, code: err.code });
  }).connect(host, 80);
});

module.exports = app;