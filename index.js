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
  const { host, username, password } = req.body;
  console.log(`Received /connect-ssh request with host: ${host}, username: ${username}`);
<<<<<<< HEAD
  if (!host || !username ||!password) {
=======
  if (!host || !username || !password) {
>>>>>>> 723bd99b9c15746fcf5b85c3de0cafd2f8ea14d2
    return res.status(400).json({ error: 'Missing host, username or password' });
  }

  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connection established');
    conn.exec('ls -l', (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log(`Stream closed with code ${code} and signal ${signal}`);
        conn.end();
      }).on('data', (data) => {
        console.log(`STDOUT: ${data}`);
        res.json({ message: `SSH command executed successfully: ${data.toString()}` });
      }).stderr.on('data', (data) => {
        console.log(`STDERR: ${data}`);
        res.status(500).json({ error: `SSH command execution failed: ${data.toString()}` });
      });
    });
  }).on('error', (err) => {
    console.error(`SSH connection error: ${err.message}`);
<<<<<<< HEAD
    res.status(500).json({ error: `SSH connection failed: ${err.message}`, details: err.toString() });
  }).connect({
    host,
    port: 22,
    username,
    password,
    tryKeyboard: true, 
    readyTimeout: 30000
  });
});
  }

  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connection established');
    conn.exec('ls -l', (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log(`Stream closed with code ${code} and signal ${signal}`);
        conn.end();
      }).on('data', (data) => {
        console.log(`STDOUT: ${data}`);
        res.json({ message: `SSH command executed successfully: ${data.toString()}` });
      }).stderr.on('data', (data) => {
        console.log(`STDERR: ${data}`);
        res.status(500).json({ error: `SSH command execution failed: ${data.toString()}` });
      });
    });
  }).on('error', (err) => {
    console.error(`SSH connection error: ${err.message}`);
=======
>>>>>>> 723bd99b9c15746fcf5b85c3de0cafd2f8ea14d2
    res.status(500).json({ error: `SSH connection failed: ${err.message}` });
  }).connect({
    host,
    port: 22,
    username,
    password
  });
});

module.exports = app;