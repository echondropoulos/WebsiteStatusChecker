const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Check the status of a website
async function checkStatus(url) {
    try {
        const response = await axios.get(url);
        console.log(`Status of ${url}: ${response.status}`);
    } catch (error) {
        if (error.response) {
            console.log(`Status of ${url}: ${error.response.status}`);
        } else {
            console.log(`Error fetching ${url}: ${error.message}`);
        }
    }
}

// Read the list of websites from file and check their status
const filePath = path.join(__dirname, 'URLs.txt'); // Renamed to URLs.txt
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading file: ${err.message}`);
        return;
    }
    const websites = data.split('\n').filter(Boolean);
    websites.forEach(url => checkStatus(url));
});
