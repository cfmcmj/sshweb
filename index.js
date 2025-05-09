const express = require('express');
const { Client } = require('ssh2');
const AnsiToHtml = require('ansi-to-html');
const app = express();
const ansiConverter = new AnsiToHtml({
  fg: '#FFF',
  bg: '#000',
  newline: true,
  escapeXML: true,
});

app.use(express.static('public'));
app.use(express.json());

let currentWorkingDir = '/usr/home/jiezi';

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.get('/ssh', (req, res) => {
  console.log('Accessing /ssh endpoint');
  res.json({ message: 'SSH connection endpoint' });
});

app.post('/connect-ssh', (req, res) => {
  const { host, username, password, command } = req.body;
  console.log(`Received /connect-ssh request with host: ${host}, username: ${username}, command: ${command || 'bash -l -c "cat /etc/motd || true"'}`);

  if (!host || !username || !password) {
    return res.status(400).json({ error: 'Missing host, username, or password' });
  }

  if (!command || command.trim() === '') {
    return res.status(400).json({ error: 'No command provided' });
  }

  let finalCommand = command;
  if (command.startsWith('cd ')) {
    const newDir = command.slice(3).trim();
    let targetDir = newDir;
    if (!newDir.startsWith('/')) {
      targetDir = `${currentWorkingDir}/${newDir}`;
    }
    finalCommand = `cd ${targetDir} && pwd`;
  } else if (command === 'ls') {
    finalCommand = 'export TERM=xterm-256color CLICOLOR=1 && LS_COLORS="di=34:ln=35:ex=32:fi=37" ls -G';
  } else if (command === 'pwd') {
    finalCommand = 'pwd';
  } else {
    finalCommand = `cd ${currentWorkingDir} && ${command}`;
  }

  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connection established');
    conn.exec(finalCommand, { pty: { term: 'xterm-256color', cols: 80, rows: 24 } }, (err, stream) => {
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
        output += data;
      }).on('close', (code, signal) => {
        console.log(`Stream closed with code ${code} and signal ${signal}`);
        console.log(`Raw output (hex): ${Buffer.from(output).toString('hex')}`);
        console.log(`Raw output (string): ${JSON.stringify(output)}`);
        let responseMessage = output.trim();
        if (command.startsWith('cd ')) {
          if (code === 0) {
            currentWorkingDir = responseMessage;
            responseMessage = '';
          } else {
            responseMessage = `cd: ${command.slice(3).trim()}: No such file or directory`;
          }
        }
        const htmlOutput = ansiConverter.toHtml(responseMessage);
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