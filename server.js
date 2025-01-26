const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const MAX_HISTORY = 20; // Limit history to 20 entries
const HISTORY_FILE = path.join(__dirname, 'statusHistory.json');
const WEBSITES_FILE = path.join(__dirname, 'URLs.txt'); // Renamed to URLs.txt

let statusHistory = {};
let websites = [];

// Load history from file
function loadHistory() {
    if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        statusHistory = JSON.parse(data);
    }
}

// Save history to file
function saveHistory() {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(statusHistory, null, 2));
}

// Load websites from file
function loadWebsites() {
    if (fs.existsSync(WEBSITES_FILE)) {
        const data = fs.readFileSync(WEBSITES_FILE, 'utf8');
        websites = data.split('\n').filter(Boolean);
    }
}

// Save websites to file
function saveWebsites() {
    fs.writeFileSync(WEBSITES_FILE, websites.join('\n'));
}

app.use(express.static('public'));
app.use(express.json());

// Check the status of a website
async function checkStatus(url) {
    try {
        const response = await axios.get(url);
        return { url, status: response.status, timestamp: new Date().toISOString() };
    } catch (error) {
        const status = error.response ? error.response.status : `Error: ${error.message}`;
        return { url, status, timestamp: new Date().toISOString() };
    }
}

// Update the status history for all websites
async function updateStatusHistory() {
    const results = await Promise.all(websites.map(url => checkStatus(url)));
    results.forEach(result => {
        if (!statusHistory[result.url]) {
            statusHistory[result.url] = [];
        }
        statusHistory[result.url].push(result);
        if (statusHistory[result.url].length > MAX_HISTORY) {
            statusHistory[result.url].shift(); // Remove oldest entry if history exceeds MAX_HISTORY
        }
    });
    saveHistory(); // Save history after updating
}

// Endpoint to get the status history
app.get('/check-status', (req, res) => {
    res.json(statusHistory);
});

// Endpoint to get the list of websites
app.get('/websites', (req, res) => {
    res.json(websites);
});

// Endpoint to add a new website
app.post('/websites', async (req, res) => {
    const { url } = req.body;
    if (url && !websites.includes(url)) {
        websites.push(url);
        saveWebsites();
        await updateStatusHistory(); // Update status history immediately after adding a website
        res.status(201).json({ message: 'Website added' });
    } else {
        res.status(400).json({ message: 'Invalid URL or already exists' });
    }
});

// Endpoint to remove a website
app.delete('/websites', async (req, res) => {
    const { url } = req.body;
    websites = websites.filter(website => website !== url);
    delete statusHistory[url]; // Remove history for the website
    saveWebsites();
    saveHistory(); // Save history after removing
    res.status(200).json({ message: 'Website removed' });
});

// Start the server and load initial data
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    loadHistory(); // Load history on startup
    loadWebsites(); // Load websites on startup
    updateStatusHistory();
    setInterval(updateStatusHistory, 60 * 1000); // Recheck every minute
});
