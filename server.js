const express = require('express');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '10mb' }));
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});
app.options('/api/sendmail', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});
app.post('/api/sendmail', async function(req, res) {
  console.log('sendmail called');
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    var subject = req.body.subject;
    var html = req.body.html;
    var filename = req.body.filename;
    if (!html) return res.status(400).json({ error: 'html empty' });
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: 'dscontrol08@naver.com',
      subject: subject || 'MPX Certificate',
      html: '<p>MPX Certificate attached.</p>',
      attachments: [{
        filename: filename || 'Certificate.html',
        content: Buffer.from(html, 'utf-8'),
        contentType: 'text/html'
      }]
    });
    res.json({ result: 'success' });
  } catch(e) {
    console.error('MAIL ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});
app.get('/api/schedule', async function(req, res) {
  try {
    var date = req.query.date || '';
    var response = await fetch('http://www.ds-pilot.co.kr/api/forecast');
    var data = await response.json();
    var list = Array.isArray(data) ? data : (data.list || data.result || []);
    var filtered = date ? list.filter(function(d) {
      return (d.DT_SHIP || '').replace(/\//g, '-').substring(0, 10) === date;
    }) : list;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ result: 'success', date: date, count: filtered.length, list: filtered });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});
app.use(express.static('/app'));
app.get('/', function(req, res) {
  res.redirect('/MPX_2026-04-03_v51.html');
});
app.listen(PORT, function() {
  console.log('MPX Server running on port ' + PORT);
});
