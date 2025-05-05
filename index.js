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
  const conn = new Client();

  conn.on('ready', () => {
    conn.exec('whoami', (err, stream) => {
      if (err) return res.json({ error: err.message });
      let output = '';
      stream.on('data', (data) => {
        output += data;
      }).on('close', () => {
        conn.end();
        res.json({ output });
      });
    });
  }).on('error', (err) => {
    res.json({ error: err.message });
  }).connect({
    host,
    username,
    password,
    port: 22
  });
});

module.exports = app;