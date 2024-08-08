const express = require('express');
const { spawnSync, spawn } = require('child_process');
const app = express();
app.use(express.json());
// Uncoment this if you are using it on a seperate server
// const cors = require('cors');
// app.use(cors())

app.post('/docker', async (req, res) => {
  const { operation, container, image, command } = req.body;

  try {
    let result;
    switch (operation) {
      case 'start':
        result = await startContainer(container);
        break;
      case 'stop':
        result = await stopContainer(container);
        break;
      case 'kill':
        result = await killContainer(container);
        break;
      default:
        throw new Error('Invalid operation');
    }
    res.json(result);
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

async function startContainer(container) {
  const { stdout, stderr } = spawnSync('docker', ['start', container]);
  return { stdout: stdout.toString(), stderr: stderr.toString() };
}

async function stopContainer(container) {
  const { stdout, stderr } = spawnSync('docker', ['stop', container]);
  return { stdout: stdout.toString(), stderr: stderr.toString() };
}

async function killContainer(container) {
  const { stdout, stderr } = spawnSync('docker', ['kill', container]);
  return { stdout: stdout.toString(), stderr: stderr.toString() };
}

const port = process.env.PORT || 6749;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
