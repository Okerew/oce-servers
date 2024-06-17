const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
const os = require('os');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors())

app.get('/files', (req, res) => {
    const directoryPath = req.query.path || __dirname;
    fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        const fileList = files.map(file => ({
            name: file.name,
            type: file.isDirectory() ? 'dir' : 'file',
        }));
        res.send(fileList);
    });
});

app.get('/open-file', (req, res) => {
    const filePath = req.query.path;
    if (!filePath) {
        return res.status(400).send('File path is required');
    }
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Unable to read file: ' + err);
        }
        res.send(data);
    });
});

app.get('/execute-file', (req, res) => {
    const filePath = req.query.path;
    if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    let command;

    switch (fileExtension) {
        case '.py':
            command = `python ${filePath}`;
            break;
        case '.js':
            if (os.platform() === 'darwin') {
                const homebrewPath = '/opt/homebrew/bin';
                if (fs.existsSync(homebrewPath)) {
                    process.env.PATH = `${homebrewPath}:${process.env.PATH}`;
                }
            }
            command = `node ${filePath}`;
            break;
        case '.go':
            command = `go run ${filePath}`;
            break;
        case '.rb':
            command = `ruby ${filePath}`;
            break;
        case '.rs':
            command = `rustc ${filePath} && ./${path.basename(filePath, '.rs')}`;
            break;
        case '.cpp':
            command = `g++ ${filePath} -o ${path.basename(filePath, '.cpp')} && ./${path.basename(filePath, '.cpp')}`;
            break;
        case '.c':
            command = `gcc ${filePath} -o ${path.basename(filePath, '.c')} && ./${path.basename(filePath, '.c')}`;
            break;
        case '.kt':
            command = `kotlinc ${filePath} -include-runtime -d ${path.basename(filePath, '.kt')}.jar && java -jar ${path.basename(filePath, '.kt')}.jar`;
            break;
        default:
            return res.status(400).json({ error: `Unsupported file type: ${fileExtension}` });
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: `Error executing ${fileExtension} code: ${error.message}` });
        }
        if (stderr) {
            return res.status(500).json({ error: `${fileExtension} script encountered an error: ${stderr}` });
        }
        res.json({ output: stdout });
    });
});

app.post('/save-file', (req, res) => {
  const filePath = req.body.path;
  const fileContent = req.body.content;

  fs.writeFile(filePath, fileContent, 'utf8', (err) => {
    if (err) {
      console.error(`Error saving file: ${err}`);
      res.status(500).json({ error: 'Failed to save file' });
    } else {
      res.status(200).json({ message: 'File saved successfully' });
    }
  });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
