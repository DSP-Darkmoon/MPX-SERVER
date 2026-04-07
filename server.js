const express = require('express');
const fetch = require('node-fetch');
const sgMail = require('@sendgrid/mail');
const app = express();
const PORT = process.env.PORT || 3000;
 
app.use(express.json({ limit: '10mb' }));
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 
// 정적 파일 서빙 - 카톡/외부 브라우저 호환을 위한 헤더 추가
app.use(express.static('/app', {
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
 
// 메일 전송
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
 
// 도선예보 API 프록시
app.get('/api/schedule', async function(req, res) {
  try {
    var date = (req.query.date || '').trim();
 
    var response = await fetch('http://www.ds-pilot.co.kr/api/forecast');
    if (!response.ok) throw new Error('upstream HTTP ' + response.status);
 
    var data = await response.json();
    var list = Array.isArray(data) ? data : (data.list || data.result || []);
 
    // 날짜 필터: date 파라미터가 있으면 해당 날짜만 반환
    // 결과가 없어도 빈 배열 그대로 반환 (폴백 없음)
    var filtered = list;
    if (date) {
      filtered = list.filter(function(d) {
        var dt = (d.DT_SHIP || '').replace(/\//g, '-').substring(0, 10);
        return dt === date;
      });
    }
 
    console.log('schedule: date=' + (date || 'ALL') + ' total=' + list.length + ' filtered=' + filtered.length);
    res.json({ result: 'success', date: date, count: filtered.length, list: filtered });
 
  } catch(e) {
    console.error('SCHEDULE ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});
 
// 루트 → 최신 MPX 파일로 리다이렉트
app.get('/', function(req, res) {
  res.redirect('/MPX_2026-04-07_v74.html');
});
 
app.listen(PORT, function() {
  var fs = require('fs');
  console.log('MPX Server running on port ' + PORT);
  console.log('Static dir: /app');
  console.log('HTML files:', fs.readdirSync('/app').filter(function(f){ return f.endsWith('.html'); }));
});
