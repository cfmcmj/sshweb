const express = require('express');
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
  res.json({ message: `Test connection to ${host}` });
});

module.exports = app;