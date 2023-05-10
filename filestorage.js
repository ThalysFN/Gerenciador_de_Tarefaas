const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    const rawData = fs.readFileSync(DATA_FILE);
    return JSON.parse(rawData);
  } catch (err) {
    return [];
  }
}

function writeData(data) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(DATA_FILE, jsonData);
}

module.exports = { readData, writeData };