const express = require('express');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// 네이버 SMTP 설정
const transporter = nodemailer.createTransport({
  host: 'smtp.naver.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// CORS preflight
app.options('/api/sendmail', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// 이메일 전송 API
app.post('/api/sendmail', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { subject, html, filename } = req.body;
    if (!html) return res.status(400).json({ error: 'html 없음' });

    await transporter.sendMail({
      from: '"MPX 도선 시스템" <' + process.env.MAIL_USER + '>',
      to: 'dscontrol08@naver.com',
      subject: subject || 'MPX 증서',
      html: '<p>MPX 증서가 첨부되었습니다.</p><p>' + (subject||'') + '</p>',
      attachments: [{
        filename: filename || 'Certificate.html',
        content: Buffer.from(html, 'utf-8'),
        contentType: 'text/html'
      }]
    });

    res.json({ result: 'success' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// 도선예보 API
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

app.use(express.static('/app'));

app.get('/', (req, res) => {
  res.redirect('/MPX_2026-04-03_v51.html');
});

app.listen(PORT, () => {
  console.log('MPX Server running on port ' + PORT);
});
