const express = require('express');
const { Client } = require('ssh2');
const AnsiToHtml = require('ansi-to-html');
const app = express();
const ansiConverter = new AnsiToHtml();

app.use(express.static('public'));
app.use(express.json());

// Store the current working directory for each session (simulated with a simple variable for now)
let currentWorkingDir = '/usr/home/jiezi'; // Default starting directory

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

  // Handle 'cd' commands to update the working directory
  let finalCommand = command;
  if (command.startsWith('cd ')) {
    const newDir = command.slice(3).trim();
    finalCommand = `cd ${newDir} && pwd`; // Update directory and return new path
  } else if (command === 'ls') {
    finalCommand = 'ls --color=auto'; // Ensure ls outputs colors
  } else if (command === 'pwd') {
    finalCommand = 'pwd'; // Just return the current directory
  } else {
    finalCommand = `cd ${currentWorkingDir} && ${command}`; // Run command in the current directory
  }

  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connection established');
    conn.exec(finalCommand, { pty: true }, (err, stream) => {
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
        output += data; // Include stderr for MOTD or errors
      }).on('close', (code, signal) => {
        console.log(`Stream closed with code ${code} and signal ${signal}`);
        console.log(`Raw output: ${output}`); // Debug raw output
        // If the command was a 'cd', update the current working directory
        if (command.startsWith('cd ')) {
          currentWorkingDir = output.trim();
          output = ''; // No output for cd, just update the directory
        }
        const htmlOutput = ansiConverter.toHtml(output.trim());
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