const express = require('express');
const https = require('https');
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

  console.log(`Attempting HTTPS connection to ${host}`);

  const options = {
    hostname: host,
    port: 443,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  const req = https.request(options, (response) => {
    console.log(`HTTPS connection to ${host}:443 successful, status: ${response.statusCode}`);
    res.json({ message: `HTTPS connection successful, status: ${response.statusCode}` });
  });

  req.on('timeout', () => {
    console.error(`HTTPS connection to ${host}:443 timed out`);
    req.destroy();
    res.status(500).json({ error: 'HTTPS connection timed out' });
  });

  req.on('error', (err) => {
    console.error(`HTTPS connection error: ${err.message}`);
    res.status(500).json({ error: `HTTPS connection failed: ${err.message}`, code: err.code });
  });

  req.end();
});

module.exports = app;