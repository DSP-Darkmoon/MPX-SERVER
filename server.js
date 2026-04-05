const express = require('express');
const fetch = require('node-fetch');
const sgMail = require('@sendgrid/mail');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 정적 파일 서빙 - 카톡/외부 브라우저 호환을 위한 헤더 추가
app.use(express.static(__dirname, {
  setHeaders: function(res, path) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// CORS 전역 허용
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.post('/api/sendmail', async function(req, res) {
  console.log('sendmail called');
  try {
    var subject = req.body.subject;
    var html = req.body.html;
    var filename = req.body.filename;
    if (!html) return res.status(400).json({ error: 'html empty' });
    await sgMail.send({
      from: 'wony1390@gmail.com',
      to: 'dscontrol08@naver.com',
      subject: subject || 'MPX Certificate',
      html: '<p>MPX Certificate attached.</p>',
      attachments: [{
        filename: filename || 'Certificate.html',
        content: Buffer.from(html, 'utf-8').toString('base64'),
        type: 'text/html',
        disposition: 'attachment'
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
    // 날짜 필터 결과 없으면 전체 반환
    if (date && filtered.length === 0) filtered = list;
    res.json({ result: 'success', date: date, count: filtered.length, list: filtered });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// 루트 → 최신 MPX 파일로 리다이렉트
app.get('/', function(req, res) {
  res.redirect('/MPX_2026-04-05_v53.html');
});

app.listen(PORT, function() {
  console.log('MPX Server running on port ' + PORT);
});
