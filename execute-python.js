const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/execute-python', (req, res) => {
  const { code } = req.body;
  const randomNumber = Math.floor(Math.random() * 10) + 1; 

  const sanitizedAndSafeCode = removePottentialyMaliciousCode(code);

  const scriptContent = `#!/usr/bin/env python\n${sanitizedAndSafeCode}`;
  const scriptPath = path.join(__dirname, `tempRunner_${Date.now()}_${randomNumber}.py`);

  fs.writeFile(scriptPath, scriptContent, (err) => {
    if (err) {
      console.error('Error writing Python script file:', err);
      res.status(500).json({ error: 'Error writing Python script file' });
      return;
     }

    const executionTimeout = 1000; 
    const pythonProcess = exec(`python ${scriptPath}`, { timeout: executionTimeout }, (error, stdout, stderr) => {
      fs.unlink(scriptPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temporary Python script file:', unlinkErr);
        }
      });

      if (error) {
        console.error('Error executing Python code:', error);
        res.status(500).json({ error: 'Error executing Python code' });
        return;
      }

      if (stderr) {
        console.error('Error from Python script:', stderr);
        res.status(500).json({ error: 'Error from Python script', stderr });
        return;
      }

      console.log('Python script output:', stdout);
      res.json({ output: stdout });
    });

    // Handle execution timeout
    pythonProcess.on('timeout', () => {
      console.error('Execution timeout exceeded. Terminating process.');
      pythonProcess.kill('SIGINT'); 
      res.status(500).json({ error: 'Execution timeout exceeded' });
    });
  });
});


function removePottentialyMaliciousCode(code) {
  const unsafeConstructs = ['import os', 'eval(', 'exec(', 'import subprocess', 'compile(', 'input('];
  return code.split('\n').filter(line => !unsafeConstructs.some(unsafeConstruct => line.includes(unsafeConstruct))).join('\n')
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
