const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/execute-cpp', (req, res) => {
  const { code } = req.body;
  const randomNumber = Math.floor(Math.random() * 10) + 1; 

  const sanitizedAndSafeCode = removePotentiallyMaliciousCode(code);

  const scriptContent = `${sanitizedAndSafeCode}`;
  const scriptPath = path.join(__dirname, `tempRunner_${Date.now()}_${randomNumber}.cpp`);

  fs.writeFile(scriptPath, scriptContent, (err) => {
    if (err) {
      console.error('Error writing C++ script file:', err);
      res.status(500).json({ error: 'Error writing C++ script file' });
      return;
    }

    const compileCommand = `g++ -o ${scriptPath}.out ${scriptPath}`;
    exec(compileCommand, (compileError) => {
      fs.unlink(scriptPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temporary C++ source file:', unlinkErr);
        }
      });

      if (compileError) {
        console.error('Error compiling C++ code:', compileError);
        res.status(500).json({ error: 'Error compiling C++ code' });
        return;
      }

      const executionTimeout = 1000; 
      const cppProcess = exec(`${scriptPath}.out`, { timeout: executionTimeout }, (error, stdout, stderr) => {
        fs.unlink(`${scriptPath}.out`, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temporary C++ binary file:', unlinkErr);
          }
        });

        if (error) {
          console.error('Error executing C++ code:', error);
          res.status(500).json({ error: 'Error executing C++ code' });
          return;
        }

        if (stderr) {
          console.error('Error from C++ program:', stderr);
          res.status(500).json({ error: 'Error from C++ program', stderr });
          return;
        }

        console.log('C++ program output:', stdout);
        res.json({ output: stdout });
      });

      // Handle execution timeout
      cppProcess.on('timeout', () => {
        console.error('Execution timeout exceeded. Terminating process.');
        cppProcess.kill('SIGINT'); 
        res.status(500).json({ error: 'Execution timeout exceeded' });
      });
    });
  });
});

function removePotentiallyMaliciousCode(code) {
  const unsafeConstructs = ['system(', 'exec(', 'popen(', 'unlink(', 'remove(', 'chmod(']; 
  return code.split('\n').filter(line => !unsafeConstructs.some(unsafeConstruct => line.includes(unsafeConstruct))).join('\n');
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
