/*
 * CoursePress Template — server.js
 * Static storefront + tiny mock API (courses, auth, checkout, newsletter).
 * No database needed: JSON file store in ./data/db.json (auto-created).
 * Real payments via Stripe Checkout when STRIPE_SECRET_KEY is set,
 * otherwise /api/checkout falls back to the dev mock so the demo works.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe (optional): set STRIPE_SECRET_KEY to enable real branded checkout.
// Without it the API uses the dev mock. Publishable key is exposed for Stripe.js if needed.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
let stripe = null;
if (STRIPE_SECRET_KEY) {
  try { stripe = require('stripe')(STRIPE_SECRET_KEY); }
  catch (e) { console.warn('Stripe init failed, using mock checkout:', e.message); stripe = null; }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- tiny JSON store ----------
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], orders: [], subscribers: [] }, null, 2));
}
function readDb() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: [], orders: [], subscribers: [] }; }
}
function writeDb(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

// ---------- course catalogue (single source of truth, also mirrored in public/app.js) ----------
const COURSES = require('./courses.json');

// ---------- API ----------
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get('/api/courses', (_req, res) => {
  res.json(COURSES.map(c => ({
    slug: c.slug, title: c.title, tagline: c.tagline, price: c.price,
    compareAt: c.compareAt, level: c.level, rating: c.rating,
    students: c.students, hours: c.hours, lessons: c.lessonsCount,
    image: c.image, badge: c.badge, category: c.category, free: c.price === 0
  })));
});

app.get('/api/courses/:slug', (req, res) => {
  const c = COURSES.find(x => x.slug === req.params.slug);
  if (!c) return res.status(404).json({ error: 'Course not found' });
  res.json(c);
});

app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email.' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be 6+ characters.' });
  const db = readDb();
  if (db.users.some(u => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ error: 'That email is already registered. Try logging in.' });
  }
  const user = { id: 'u_' + Date.now().toString(36), name: String(name).slice(0, 60), email, createdAt: new Date().toISOString() };
  db.users.push({ ...user, pass: 'hashed::' + String(password).length }); // demo only — hash in prod!
  writeDb(db);
  res.json({ ok: true, user, token: 'demo-' + user.id });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const db = readDb();
  const found = db.users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!found) return res.status(404).json({ error: 'No account for that email. Please sign up.' });
  if (!password) return res.status(400).json({ error: 'Password required.' });
  res.json({ ok: true, user: { id: found.id, name: found.name, email: found.email }, token: 'demo-' + found.id });
});

app.get('/api/config', (_req, res) => {
  res.json({ stripePublishableKey: STRIPE_PUBLISHABLE_KEY || null, stripeLive: Boolean(stripe) });
});

app.post('/api/checkout', async (req, res) => {
  const { courseSlug, email } = req.body || {};
  const course = COURSES.find(c => c.slug === courseSlug);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  if (!email) return res.status(400).json({ error: 'Email is required for delivery.' });
  const db = readDb();

  // Free course: grant instantly, no Stripe needed.
  if (course.price === 0) {
    const order = {
      id: 'ord_' + Date.now().toString(36), courseSlug, email,
      amount: 0, currency: 'USD', status: 'granted',
      createdAt: new Date().toISOString()
    };
    db.orders.push(order);
    writeDb(db);
    return res.json({ ok: true, order, message: 'Enrolled! Check your email for access.', next: `/#/learn/${course.slug}` });
  }

  // Real Stripe Checkout when keys are configured.
  if (stripe) {
    try {
      const base = PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: course.title, description: course.tagline },
            unit_amount: Math.round(course.price * 100),
          },
          quantity: 1,
        }],
        success_url: `${base}/#/learn/${course.slug}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/#/course/${course.slug}?canceled=1`,
        metadata: { courseSlug, email },
      });
      const order = {
        id: session.id, courseSlug, email,
        amount: course.price, currency: 'USD', status: 'stripe-pending',
        createdAt: new Date().toISOString()
      };
      db.orders.push(order);
      writeDb(db);
      return res.json({ ok: true, order, url: session.url, stripe: true });
    } catch (e) {
      return res.status(502).json({ error: 'Stripe error: ' + e.message });
    }
  }

  // Dev fallback (no keys): mock success so the demo still works.
  const order = {
    id: 'ord_' + Date.now().toString(36), courseSlug, email,
    amount: course.price, currency: 'USD',
    status: 'paid-mock',
    createdAt: new Date().toISOString()
  };
  db.orders.push(order);
  writeDb(db);
  res.json({
    ok: true, order, mock: true,
    message: `Dev checkout (no STRIPE_SECRET_KEY set): “${course.title}” marked paid. Add Stripe keys to take live payments.`,
    next: `/#/learn/${course.slug}`
  });
});

// Stripe webhook: marks stripe-pending orders as paid. Configure with:
//   stripe listen --forward-to localhost:3000/api/stripe-webhook
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.json({ received: true, mock: true });
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const db = readDb();
    const o = db.orders.find(x => x.id === session.id);
    if (o) { o.status = 'paid'; writeDb(db); }
  }
  res.json({ received: true });
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Valid email required.' });
  const db = readDb();
  if (!db.subscribers.includes(email)) { db.subscribers.push(email); writeDb(db); }
  res.json({ ok: true, message: 'You are on the list! Check your inbox to confirm.' });
});

// SPA fallback (keep API + assets first)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`CoursePress listening on http://localhost:${PORT}`));
module.exports = app;

