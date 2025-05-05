const express = require('express');
const { Client } = require('ssh2');
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

  const conn = new Client();
  conn.on('ready', () => {
    conn.exec('whoami', (err, stream) => {
      if (err) {
        conn.end();
        return res.json({ error: err.message });
      }
      let output = '';
      stream.on('data', (data) => {
        output += data;
      }).on('close', () => {
        conn.end();
        res.json({ output });
      });
    });
  }).on('error', (err) => {
    conn.end();
    res.status(500).json({ error: `Connection failed: ${err.message}`, code: err.code });
  }).connect({
    host,
    username,
    password,
    port: 22,
    timeout: 10000 // 10秒超时
  });
});

module.exports = app;