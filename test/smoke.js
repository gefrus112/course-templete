'use strict';
/* Smoke test: boots the real server, hits every API route. */
const assert = require('assert');

process.env.PORT = '3457';
const app = require('../server.js');

function req(method, p, body) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({ host: 'localhost', port: 3457, path: p, method,
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {} },
      res => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ s: res.statusCode, b })); });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}
(async () => {
  await new Promise(r => setTimeout(r, 800));
  let x = await req('GET', '/api/health'); assert.equal(x.s, 200, 'health');
  x = await req('GET', '/api/courses'); const list = JSON.parse(x.b);
  assert.ok(list.length >= 4, 'courses list'); assert.ok(list[0].slug, 'slug');
  x = await req('GET', '/api/courses/scratch-games-from-zero');
  const c = JSON.parse(x.b); assert.ok(c.slides.length >= 3, 'slides');
  const email = 'test' + Date.now() + '@x.com';
  x = await req('POST', '/api/signup', { name: 'T', email, password: 'secret1' });
  assert.equal(x.s, 200, 'signup ' + x.b);
  x = await req('POST', '/api/login', { email, password: 'secret1' });
  assert.equal(x.s, 200, 'login');
  x = await req('POST', '/api/checkout', { courseSlug: 'scratch-games-from-zero', email });
  assert.equal(x.s, 200, 'checkout ' + x.b);
  x = await req('POST', '/api/newsletter', { email });
  assert.equal(x.s, 200, 'newsletter');
  x = await req('GET', '/'); assert.equal(x.s, 200, 'index');
  console.log('✅ smoke passed: health, courses, signup, login, checkout, newsletter, index');
  process.exit(0);
})().catch(e => { console.error('❌ smoke failed:', e.message); process.exit(1); });
