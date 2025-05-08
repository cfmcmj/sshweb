const express = require('express');
const { Client } = require('ssh2');
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

aapp.post('/connect-ssh', (req, res) => {
  const { host, username, password } = req.body;
  console.log(`Received /connect-ssh request with host: ${host}, username: ${username}`);

  if (!host || !username || !password) {
    return res.status(400).json({ error: 'Missing host, username or password' });
  }

  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connection established');
    conn.exec('ls -l', (err, stream) => {
      if (err) {
        console.error(`Exec error: ${err.message}`);
        return res.status(500).json({ error: `Command execution failed: ${err.message}` });
      }
      stream.on('close', (code, signal) => {
        console.log(`Stream closed with code ${code} and signal ${signal}`);
        conn.end();
      }).on('data', (data) => {
        console.log(`STDOUT: ${data}`);
        res.json({ message: `SSH command executed successfully: ${data.toString()}` });
      }).stderr.on('data', (data) => {
        console.error(`STDERR: ${data}`);
        res.status(500).json({ error: `SSH command execution failed: ${data.toString()}` });
      });
    });
  }).on('error', (err) => {
    console.error(`SSH connection error: ${err.message}, stack: ${err.stack}`);
    res.status(500).json({ error: `SSH connection failed: ${err.message}` });
  }).on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
    console.log('Keyboard-interactive authentication requested');
    finish([password]);
  }).connect({
    host,
    port: 22,
    username,
    password,
    tryKeyboard: true,
    readyTimeout: 30000,
    debug: (msg) => console.log(`SSH Debug: ${msg}`)
  });
});

module.exports = app;