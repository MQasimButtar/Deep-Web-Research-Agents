require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection (Optional)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/web-researcher';
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.warn('MongoDB connection failed. Proceeding without database.', err.message);
    });

// Routes
app.post('/api/research', async (req, res) => {
    const { topic, length, includeCharts } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    console.log(`Starting research for: ${topic} (${length}, charts: ${includeCharts})`);

    const pythonProcess = spawn('python', [
        path.join(__dirname, '../main.py'), 
        topic, 
        length || 'Medium',
        includeCharts ? 'true' : 'false'
    ]);
    
    let stdoutData = '', stderrData = '';

    pythonProcess.stdout.on('data', (data) => stdoutData += data.toString());
    pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        process.stderr.write(data);
    });

    pythonProcess.on('close', async (code) => {
        if (code !== 0) return res.status(500).json({ error: 'Research failed', details: stderrData });
        try {
            const result = JSON.parse(stdoutData);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: 'Failed to parse results' });
        }
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
