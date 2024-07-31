const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors())

const SHARED_DIR = path.join('shared');

app.post('/api/share', async (req, res) => {
    try {
        const tabsState = req.body;
        const id = uuidv4();
        const filePath = path.join(SHARED_DIR, `${id}.txt`);
        
        await fs.writeFile(filePath, JSON.stringify(tabsState));
        
        res.json({ id });
    } catch (error) {
        console.error('Error sharing workspace:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/restore/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filePath = path.join(SHARED_DIR, `${id}.txt`);
        
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const tabsState = JSON.parse(fileContent);
        
        res.json(tabsState);
    } catch (error) {
        console.error('Error restoring workspace:', error);
        res.status(404).json({ error: 'Workspace not found' });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
