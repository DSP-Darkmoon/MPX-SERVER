const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/schedule', async (req, res) => {
  try {
    const date = req.query.date || '';
    const response = await fetch('http://www.ds-pilot.co.kr/api/forecast');
    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.list || data.result || []);
    const filtered = date
      ? list.filter(d => (d.DT_SHIP || '').replace(/\//g, '-').substring(0, 10) === date)
      : list;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ result: 'success', date: date, count: filtered.length, list: filtered });
  } catch(e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'MPX_2026-04-03_v44.html'));
});

app.listen(PORT, () => {
  console.log('MPX Server running on port ' + PORT);
});
