const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/schedule', async (req, res) => {
  try {
    const date = req.query.date || '';
    const url = 'http://www.ds-pilot.co.kr/api/forecast' + (date ? '?date=' + date : '');
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch(e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: e.message });
  }
});

app.use(express.static(path.join(__dirname, '.')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'MPX_2026-04-03_v42.html'));
});

app.listen(PORT, () => {
  console.log('MPX Server running on port ' + PORT);
});
