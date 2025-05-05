const express = require('express');
const { Client } = require('ssh2');
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
  const { host, username, password } = req.body;
  if (!host || !username || !password) {
    return res.status(400).json({ error: 'Missing host, username, or password' });
  }

  console.log(`Attempting SSH connection to ${host}:${22} with user ${username}`);

  // 测试 TCP 连接
  const socket = new net.Socket();
  socket.setTimeout(5000);
  socket.on('connect', () => {
    console.log(`TCP connection to ${host}:22 successful`);
    socket.destroy();
    // 继续 SSH 连接
    const conn = new Client();
    conn.on('ready', () => {
      console.log('SSH connection established');
      conn.exec('whoami', (err, stream) => {
        if (err) {
          console.error('Exec error:', err);
          conn.end();
          return res.json({ error: err.message });
        }
        let output = '';
        stream.on('data', (data) => {
          output += data;
        }).on('close', () => {
          console.log('Command executed, closing connection');
          conn.end();
          res.json({ output });
        });
      });
    }).on('error', (err) => {
      console.error('SSH error:', err.message, 'Code:', err.code);
      conn.end();
      res.status(500).json({ error: `SSH failed: ${err.message}`, code: err.code });
    }).connect({
      host,
      username,
      password,
      port: 22,
      timeout: 10000,
      tryKeyboard: true
    });
  }).on('timeout', () => {
    console.error(`TCP connection to ${host}:22 timed out`);
    socket.destroy();
    res.status(500).json({ error: `TCP connection timed out` });
  }).on('error', (err) => {
    console.error(`TCP connection error: ${err.message}`);
    socket.destroy();
    res.status(500).json({ error: `TCP connection failed: ${err.message}`, code: err.code });
  }).connect(host, 22);
});

module.exports = app;