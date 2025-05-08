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

app.post('/connect-ssh', (req, res) => {
  const { host, username, password, command } = req.body;
  console.log(`Received /connect-ssh request with host: ${host}, username: ${username}, command: ${command || 'ls -l'}`);

  if (!host || !username || !password) {
    return res.status(400).json({ error: 'Missing host, username, or password' });
  }

  if (!command || command.trim() === '') {
    return res.status(400).json({ error: 'No command provided' });
  }

  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connection established');
    conn.exec(command, (err, stream) => {
      if (err) {
        console.error(`Exec error: ${err.message}`);
        conn.end();
        return res.status(500).json({ error: `Command execution failed: ${err.message}` });
      }
      let output = '';
      stream.on('data', (data) => {
        output += data;
      }).stderr.on('data', (data) => {
        console.error(`STDERR: ${data}`);
        conn.end();
        return res.status(500).json({ error: `SSH command execution failed: ${data.toString()}` });
      }).on('close', (code, signal) => {
        console.log(`Stream closed with code ${code} and signal ${signal}`);
        conn.end();
        res.json({ message: output.trim() });
      });
    });
  }).on('error', (err) => {
    console.error(`SSH connection error: ${err.message}, stack: ${err.stack}`);
    conn.end();
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