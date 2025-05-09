const express = require('express');
const { Client } = require('ssh2');
const AnsiToHtml = require('ansi-to-html');
const app = express();

const ansiConverter = new AnsiToHtml({
  fg: '#FFF',
  bg: '#000',
  newline: true,
  escapeXML: true,
  stream: true,
  colors: {
    0: '#000',     // Black (reset)
    30: '#000',    // Black
    31: '#FF0000', // Red
    32: '#00FF00', // Green
    34: '#0000FF', // Blue
    35: '#FF00FF', // Purple
    37: '#FFFFFF', // White
    '1;37': '#FFFFFF', // Bold white
  },
});

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
  console.log(`Received /connect-ssh request with host: ${host}, username: ${username}, command: ${command || 'bash -l'}`);

  if (!host || !username || !password) {
    return res.status(400).json({ error: 'Missing host, username, or password' });
  }

  if (!command || command.trim() === '') {
    return res.status(400).json({ error: 'No command provided' });
  }

  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connection established');
    // Use shell mode instead of exec to provide a full terminal environment
    conn.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, (err, stream) => {
      if (err) {
        console.error(`Shell error: ${err.message}`);
        conn.end();
        return res.status(500).json({ error: `Shell creation failed: ${err.message}` });
      }

      let output = '';
      let errorOutput = '';

      // Send the command to the shell
      stream.write(command + '\n');
      stream.write('exit\n'); // Exit the shell after command execution

      stream.on('data', (data) => {
        const dataStr = data.toString('utf8');
        output += dataStr;
        console.log(`Partial data (hex): ${Buffer.from(dataStr).toString('hex')}`);
        console.log(`Partial data (string): ${dataStr}`);
      }).stderr.on('data', (data) => {
        const dataStr = data.toString('utf8');
        errorOutput += dataStr;
        console.error(`STDERR: ${dataStr}`);
      }).on('close', (code, signal) => {
        console.log(`Stream closed with code ${code} and signal ${signal}`);
        console.log(`Raw output (hex): ${Buffer.from(output).toString('hex')}`);
        console.log(`Raw output (string): ${output}`);
        console.log(`Error output (string): ${errorOutput}`);

        // Combine stdout and stderr for display
        const fullOutput = output + errorOutput;
        const htmlOutput = ansiConverter.toHtml(fullOutput.trim());
        console.log(`HTML output: ${htmlOutput}`);
        conn.end();
        res.json({ message: htmlOutput });
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