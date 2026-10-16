/* CoursePress SPA — hash router, cart, slideshow, docs tabs, auth, checkout */
'use strict';
const $ = (s, el) => (el || document).querySelector(s);
const app = $('#app');
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
let COURSES = [];
let cart = store.get('cp_cart', []);
let user = store.get('cp_user', null);
let slideIdx = 0, learnIdx = 0;

async function loadCourses() {
  // 1) live API (node server)  2) static fallback (GitHub Pages: ./courses.json)
  try { const r = await fetch('/api/courses'); if (r.ok) { COURSES = await r.json(); return; } } catch {}
  try { const r = await fetch('./courses.json'); if (r.ok) { COURSES = await r.json(); return; } } catch {}
  try { const r = await fetch('courses.json'); if (r.ok) { COURSES = await r.json(); return; } } catch {}
  COURSES = [];
}
function money(n) { return n === 0 ? 'Free' : '$' + n; }
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 2600);
}
function refreshCart() {
  $('#cartCount').textContent = cart.length;
  store.set('cp_cart', cart);
  const box = $('#cartItems');
  if (!cart.length) box.innerHTML = '<p style="color:var(--mut)">Cart is empty. Go grab a course!</p>';
  else box.innerHTML = cart.map(slug => {
    const c = COURSES.find(x => x.slug === slug); if (!c) return '';
    return `<div style=\"display:flex;justify-content:space-between;gap:8px;margin:8px 0\">
      <div><b>${c.title}</b><br><small style=\"color:var(--mut)\">${money(c.price)}</small></div>
      <button class=\"btn ghost sm\" data-rm=\"${slug}\">×</button></div>`;
  }).join('');
  const total = cart.reduce((s, slug) => { const c = COURSES.find(x => x.slug === slug); return s + (c ? c.price : 0); }, 0);
  $('#cartTotal').innerHTML = `<b>Total: ${money(total)}</b>`;
  box.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    cart = cart.filter(x => x !== b.dataset.rm); refreshCart();
  });
}
function addToCart(slug) {
  if (!cart.includes(slug)) cart.push(slug);
  refreshCart(); toast('Added to cart');
  $('#cartDrawer').classList.remove('hidden');
}
function refreshUser() {
  const chip = $('#userChip');
  if (user) { chip.textContent = user.name; chip.classList.remove('hidden'); $('#loginLink').classList.add('hidden'); }
  else { chip.classList.add('hidden'); $('#loginLink').classList.remove('hidden'); }
}
const ICONS = {
  star: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
  users: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
  clock: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  book: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  cert: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M8.2 13.9L7 23l5-3 5 3-1.2-9.1"/></svg>',
  card: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>',
  cart: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2 3h3l2.6 12.5a1 1 0 0 0 1 .5h8.9a1 1 0 0 0 1-.8L20.5 7H6"/></svg>',
  play: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none"/></svg>',
  spark: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2L19 19M19 5l-2.8 2.8M7.8 16.2L5 19"/></svg>',
  check: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
  lock: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  chart: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/></svg>',
  eye: '<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  game: '<svg class="ic xl" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-4 3.6L2 15a3 3 0 0 0 5.2 2.1L9 15h6l1.8 2.1A3 3 0 0 0 22 15l-.7-6.4a4 4 0 0 0-4-3.6z"/></svg>',
  globe: '<svg class="ic xl" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/></svg>',
  bot: '<svg class="ic xl" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M8 4h8"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/></svg>',
  cash: '<svg class="ic xl" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>',
  cap: '<svg class="ic lg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3L1 9l11 6 9-4.9V15h2V9L12 3z"/><path d="M5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8z"/></svg>'
};
function cardHTML(c) {
  const thumbs = { 'gradient-1': ICONS.game, 'gradient-2': ICONS.globe, 'gradient-3': ICONS.bot, 'gradient-4': ICONS.cash };
  return `<div class="card"><div class="thumb ${c.image}">${thumbs[c.image] || ICONS.book}</div>
  <div class="pad"><span class="badge">${c.badge || c.level}</span>
  <h3>${c.title}</h3><p>${c.tagline}</p>
  <div class="meta"><span>${ICONS.star} ${c.rating}</span><span>${ICONS.users} ${c.students.toLocaleString()}</span><span>${ICONS.clock} ${c.hours}h</span></div>
  <div class="price-row"><span class="price">${money(c.price)}</span>
  ${c.compareAt ? `<span class="old">${c.compareAt}</span>` : ''}</div>
  <div style="display:flex;gap:8px;margin-top:10px">
    <a class="btn primary sm" style="flex:1;text-align:center" href="#/course/${c.slug}">View course</a>
    <button class="btn ghost sm" data-add="${c.slug}">+ Cart</button>
  </div></div></div>`;
}
function bindAddButtons(scope) {
  (scope || document).querySelectorAll('[data-add]').forEach(b => b.onclick = () => addToCart(b.dataset.add));
}
// ---------- views ----------
function vHome(){
  const feat = COURSES[0];
  return `<section class="hero">
   <div><span class="eyebrow">${ICONS.spark} Free GitHub template · MIT licensed</span>
    <h1>Learn to code.<br><span class="grad">Sell your courses.</span></h1>
    <p class="lead">CoursePress is a freeCodeCamp-style template with <b>storefront, docs tabs, signup & checkout</b>. Ships with a full example course: <b>Scratch Games From Zero</b> — slideshows included.</p>
    <div class="hero-cta"><a class="btn primary" href="#/course/scratch-games-from-zero">${ICONS.play} Start Scratch Games — $29</a>
    <a class="btn ghost" href="#/courses">Browse all courses</a></div>
    <div class="stats"><span>${ICONS.star} 4.9 avg rating</span><span>${ICONS.users} 47,000+ learners</span><span>${ICONS.cert} Certificates</span><span>${ICONS.card} Stripe-ready</span></div></div>
   <div class="hero-card"><div class="code-window"><div class="code-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
   <pre>when green flag clicked
set [Score v] to (0)
forever
  move (10) steps
  if &lt;touching [coin v]?&gt; then
    change [Score v] by (1)
    play sound [pop v]
  end
end</pre></div>
   <div class="scratch-stage">${ICONS.game}${ICONS.chart}${ICONS.bot}${ICONS.cap}</div>
   <p style="color:var(--mut);font-size:13px">↑ Live preview of the Scratch slideshow component. <a href="#/course/scratch-games-from-zero">Try the deck →</a></p></div></section>
  <section class="section"><h2>Featured courses</h2><p class="sub">Swap these with your own — just edit <code>courses.json</code>.</p>
   <div class="grid">${COURSES.map(cardHTML).join('')}</div></section>
  <section class="section"><h2>Everything you need to get paid</h2><p class="sub">Like freeCodeCamp for learning, like Gumroad for selling.</p>
   <div class="two">
    <div class="feature"><h3>${ICONS.book} Courses + slideshows</h3><p>Curriculum, slide decks with Scratch blocks, and project files per lesson.</p></div>
    <div class="feature"><h3>${ICONS.book} Docs tabs</h3><p>Quickstart, selling, payments & deploy guides built in at <a href="#/docs">#/docs</a>.</p></div>
    <div class="feature"><h3>${ICONS.lock} Signup & login</h3><p>Mock API included. Plug Firebase, Supabase or Auth0 in minutes.</p></div>
    <div class="feature"><h3>${ICONS.card} Secure checkout</h3><p>Cart + Stripe Checkout ready. Live payments via Stripe, fallback mock in dev.</p></div>
   </div></section>`;
}
function vCourses(){
  return `<section class="section"><h2>All courses</h2><p class="sub">${COURSES.length} courses · lifetime access · certificate included</p>
  <div class="tabs"><button class="tab active" data-f="all">All</button><button class="tab" data-f="Game Dev">Game Dev</button><button class="tab" data-f="Web Dev">Web Dev</button><button class="tab" data-f="Business">Business</button></div>
  <div class="grid" id="courseGrid">${COURSES.map(cardHTML).join('')}</div></section>`;
}
async function vCourse(slug){
  let c = COURSES.find(x=>x.slug===slug);
  try{ const r=await fetch('/api/courses/'+slug); if(r.ok) c=await r.json(); }catch{}
  if((!c || !c.curriculum) && COURSES.length){ const f=COURSES.find(x=>x.slug===slug); if(f) c=f; }
  if(!c) return '<h2>Course not found</h2><a href="#/courses">Back</a>';
  slideIdx = 0;
  const mods = (c.curriculum||[]).map(m=>'<div class="mod"><b>'+m.module+'</b><ul>'+(m.lessons||[]).map(l=>'<li>'+l+'</li>').join('')+'</ul></div>').join('');
  const feats = (c.features||[]).map(f=>'<li>'+f+'</li>').join('');
  return '<section class="course-hero"><div>'
    +'<a href="#/courses" style="color:var(--mut)">← All courses</a>'
    +'<h1 style="font-size:38px">'+c.title+'</h1><p class="lead">'+c.tagline+'</p>'
    +'<div class="meta"><span>'+ICONS.star+' '+c.rating+'</span><span>'+ICONS.users+' '+Number(c.students).toLocaleString()+' students</span><span>'+c.level+'</span><span>'+ICONS.clock+' '+c.hours+'h</span><span>'+ICONS.book+' '+c.lessonsCount+' lessons</span></div>'
    +'<div id="slideBox">'+slideHTML(c)+'</div>'
    +'<h3>What you get</h3><ul style="color:var(--mut)">'+feats+'</ul>'
    +'<h3>Curriculum</h3><div class="curriculum">'+mods+'</div></div>'
    +'<div class="buybox"><div class="thumb '+c.image+'" style="height:90px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff">'+(c.image==='gradient-1'?ICONS.game:c.image==='gradient-2'?ICONS.globe:c.image==='gradient-3'?ICONS.bot:ICONS.cash)+'</div>'
    +'<div class="price-row" style="margin-top:12px"><span class="price">'+money(c.price)+'</span>'+(c.compareAt?'<span class="old">$'+c.compareAt+'</span><span class="badge">SAVE '+(Math.round((1-c.price/c.compareAt)*100))+'%</span>':'')+'</div>'
    +'<p style="color:var(--mut);font-size:13px">Lifetime access · Certificate · 30-day guarantee</p>'
    +'<button class="btn primary block" data-add="'+c.slug+'">'+ICONS.cart+' Add to cart</button>'
    +'<a class="btn accent block" style="margin-top:8px" href="#/checkout/'+c.slug+'">Buy now →</a>'
    +'<a class="btn ghost block" style="margin-top:8px" href="#/learn/'+c.slug+'">'+ICONS.eye+' Preview lessons</a></div></section>';
}
function slideHTML(c){
  const s = (c.slides||[])[slideIdx]; if(!s) return '';
  const bullets = (s.bullets||[]).map(b=>'<li>'+b+'</li>').join('');
  return '<div class="slideshow"><div class="slide-head"><b>'+ICONS.chart+' '+s.title+'</b>'
    +'<div class="slide-nav"><button class="btn ghost sm" id="prevSlide">← Prev</button>'
    +'<span style="font-size:13px;color:var(--mut)">'+(slideIdx+1)+' / '+c.slides.length+'</span>'
    +'<button class="btn ghost sm" id="nextSlide">Next →</button></div></div>'
    +'<div class="slide-body"><ul>'+bullets+'</ul><pre>'+s.code+'</pre></div></div>';
}
function bindSlides(c){
  const p=$('#prevSlide'), n=$('#nextSlide');
  if(p) p.onclick=()=>{ slideIdx=(slideIdx-1+c.slides.length)%c.slides.length; $('#slideBox').innerHTML=slideHTML(c); bindSlides(c); };
  if(n) n.onclick=()=>{ slideIdx=(slideIdx+1)%c.slides.length; $('#slideBox').innerHTML=slideHTML(c); bindSlides(c); };
  document.onkeydown=(e)=>{
    if(!$('#slideBox')) return;
    if(e.key==='ArrowRight'&&n) n.click();
    if(e.key==='ArrowLeft'&&p) p.click();
  };
}


const DOCS = {
  start: { t:'Quickstart', h:'<h2>Quickstart</h2><p>Live in 5 min:</p><pre>npm install\nnpm start</pre><p>1) Edit courses.json 2) Tweak app.js 3) Deploy (see Deploy tab).</p>' },
  sell: { t:'Sell', h:'<h2>Sell your course</h2><p>1 flagship ($19-$39) + 1 free mini-course. Anchor price via compareAt. Checkout uses Stripe when keys are set, dev mock otherwise.</p>' },
  payments: { t:'Payments', h:'<h2>Payments (Stripe)</h2><p>Set env vars then restart:</p><pre>STRIPE_SECRET_KEY=sk_test_...\nSTRIPE_PUBLISHABLE_KEY=pk_test_...\nPUBLIC_BASE_URL=https://yoursite.com</pre><p>Checkout creates a branded Stripe Checkout Session per course. Without keys the demo mock is used.</p>' },
  deploy: { t:'Deploy', h:'<h2>Deploy</h2><pre>Render: Build npm install / Start npm start</pre><p>Add the Stripe env vars in your host dashboard.</p>' }
};
function vDocs(tab){
  tab = DOCS[tab] ? tab : 'start';
  const links = Object.keys(DOCS).map(k=>'<a href="#/docs/'+k+'" class="'+(k===tab?'active':'')+'">'+DOCS[k].t+'</a>').join('');
  return '<div class="docs"><nav>'+links+'</nav><article>'+DOCS[tab].h+'</article></div>';
}
function vSignup(){
  return '<form class="form" id="suForm"><h2>Create account</h2><div id="suMsg"></div>'
  +'<label>Name</label><input id="suName" required>'
  +'<label>Email</label><input id="suEmail" type="email" required>'
  +'<label>Password</label><input id="suPass" type="password" required>'
  +'<button class="btn primary block" style="margin-top:14px">Sign up free</button>'
  +'<p style="text-align:center;color:var(--mut)">Have an account? <a href="#/login">Log in</a></p></form>';
}
function vLogin(){
  return '<form class="form" id="liForm"><h2>Welcome back</h2><div id="liMsg"></div>'
  +'<label>Email</label><input id="liEmail" type="email" required>'
  +'<label>Password</label><input id="liPass" type="password" required>'
  +'<button class="btn primary block" style="margin-top:14px">Log in</button>'
  +'<p style="text-align:center;color:var(--mut)">New? <a href="#/signup">Sign up free</a></p></form>';
}

async function vCheckout(slug){
  let c = COURSES.find(x=>x.slug===slug) || COURSES[0];
  try{ const r=await fetch('/api/courses/'+slug); if(r.ok){ const j=await r.json(); if(j && j.slug) c=j; } }catch{}
  if(!c) return '<h2>Pick a course</h2>';
  return '<div class="two"><form class="form" id="coForm" style="margin:0;max-width:none"><h2>'+ICONS.lock+' Secure checkout</h2><p style="color:var(--mut)">'+c.title+' — <b>'+money(c.price)+'</b></p><div id="coMsg"></div>'
  +'<label>Email for delivery</label><input id="coEmail" type="email" required value="'+(user?user.email:'')+'">'
  +'<button class="btn accent block" id="stripePayBtn" style="margin-top:14px">'+ICONS.card+' Pay '+money(c.price)+' with Stripe</button>'
  +'<div class="stripe-badge"><svg viewBox="0 0 640 512" fill="#635bff" aria-hidden="true"><path d="M537 225c-9-3-18-5-28-5c-35 0-60 24-60 56s25 56 60 56c10 0 19-2 28-5v-25c-8 4-16 6-25 6c-21 0-35-14-35-32s14-32 35-32c9 0 17 2 25 6v-25zM512 96C300 96 128 235 128 341c0 68 30 111 49 133l-21 78l82-37c26 8 55 12 86 12c8 0 16 0 24-1l9-35c-8 1-16 1-24 1c-27 0-52-4-75-10l224-83c21-8 12-38-9-30zM352 405l-16 62c-13-2-25-6-37-10l16-61c12 3 25 7 37 9zm-58-15l-15 58c-12-4-23-8-34-13l16-56c11 4 22 8 33 11zm-53-20l-15 53c-10-5-20-10-29-16l15-49c9 4 19 8 29 12zm-45-22l-14 45c-8-6-16-12-23-19l13-39c8 4 16 9 24 13z"/></svg> Powered by <b>Stripe</b></div>'
  +'<p style="color:var(--mut);font-size:12px;margin-top:10px">Cards, Apple Pay, Google Pay accepted. No Stripe keys? Dev mock is used automatically.</p></form>'
  +'<div class="feature"><h3>'+ICONS.check+' Order summary</h3><p>'+c.tagline+'</p><p>'+ICONS.star+' '+c.rating+' · '+ICONS.users+' '+Number(c.students).toLocaleString()+' students</p><ul style="color:var(--mut)">'+((c.features||[]).map(function(f){return '<li>'+f+'</li>'}).join(''))+'</ul><div class="trust-row"><span>'+ICONS.lock+' SSL secured</span><span>'+ICONS.check+' 30-day guarantee</span><span>'+ICONS.cert+' Certificate</span></div></div></div>';
}
function vLearn(slug){
  const c = COURSES.find(x=>x.slug===slug);
  if(!c) return '<h2>Pick a course</h2>';
  learnIdx = 0;
  setTimeout(()=>{ const b=$('#learnBody'); if(b) b.innerHTML = learnHTML(c); }, 0);
  return '<a href="#/course/'+slug+'" style="color:var(--mut)">Back</a><h2>Preview: '+c.title+'</h2><div id="learnBody"></div>';
}
function learnHTML(c){
  const s=(c.slides||[])[learnIdx]; if(!s) return '<p>No slides.</p>';
  return '<div class="slideshow"><div class="slide-head"><b>'+s.title+'</b><div class="slide-nav">'
  +'<button class="btn ghost sm" id="lPrev">Prev</button><span style="color:var(--mut)">'+(learnIdx+1)+'/'+c.slides.length+'</span>'
  +'<button class="btn ghost sm" id="lNext">Next</button></div></div>'
  +'<div class="slide-body"><ul>'+(s.bullets.map(b=>'<li>'+b+'</li>').join(''))+'</ul><pre>'+s.code+'</pre></div></div>'
  +'<p><a class="btn primary sm" href="#/checkout/'+c.slug+'">Unlock full course</a></p>';
}
function vPricing(){
  return '<section class="section"><h2>Pricing</h2><p class="sub">Template is free (MIT). You keep 100%.</p>'
  +'<div class="grid">'+COURSES.map(c=>'<div class="card"><div class="pad"><h3>'+c.title+'</h3><p>'+c.tagline+'</p>'
  +'<div class="price-row"><span class="price">'+money(c.price)+'</span></div>'
  +'<a class="btn primary block" href="#/course/'+c.slug+'">Get course</a></div></div>').join('')+'</div></section>';
}

async function router(){
  const h = location.hash || '#/';
  const parts = h.replace(/^#\//,'').split('/');
  window.scrollTo(0,0);
  if(h==='#/'||h===''||h==='#'){ app.innerHTML = vHome(); }
  else if(parts[0]==='courses'){ app.innerHTML = vCourses(); wireFilter(); }
  else if(parts[0]==='course'&&parts[1]){ app.innerHTML = await vCourse(parts[1]);
    const c = COURSES.find(x=>x.slug===parts[1]); if(c) bindSlides(c); }
  else if(parts[0]==='docs'){ app.innerHTML = vDocs(parts[1]); }
  else if(parts[0]==='signup'){ app.innerHTML = vSignup(); wireSignup(); }
  else if(parts[0]==='login'){ app.innerHTML = vLogin(); wireLogin(); }
  else if(parts[0]==='checkout'){ app.innerHTML = await vCheckout(parts[1]); wireCheckout(parts[1]); }
  else if(parts[0]==='learn'){ app.innerHTML = vLearn(parts[1]); wireLearn(parts[1]); }
  else if(parts[0]==='pricing'){ app.innerHTML = vPricing(); }
  else { app.innerHTML = '<h2>404</h2><a href="#/">Home</a>'; }
  bindAddButtons(app);
}
function wireFilter(){
  document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const f=t.dataset.f;
    const list = f==='all'?COURSES:COURSES.filter(c=>c.category===f);
    $('#courseGrid').innerHTML=list.map(cardHTML).join('');
    bindAddButtons($('#courseGrid'));
  });
}
function wireSignup(){
  const f=$('#suForm'); if(!f) return;
  f.onsubmit=async e=>{ e.preventDefault();
    const body={name:$('#suName').value,email:$('#suEmail').value,password:$('#suPass').value};
    const r=await fetch('/api/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok){ $('#suMsg').innerHTML='<div class="alert err">'+j.error+'</div>'; return; }
    user=j.user; store.set('cp_user',user); refreshUser();
    $('#suMsg').innerHTML='<div class="alert ok">'+ICONS.check+' Welcome, '+user.name+'!</div>';
    setTimeout(()=>location.hash='#/courses',800);
  };
}
function wireLogin(){
  const f=$('#liForm'); if(!f) return;
  f.onsubmit=async e=>{ e.preventDefault();
    const body={email:$('#liEmail').value,password:$('#liPass').value};
    const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok){ $('#liMsg').innerHTML='<div class="alert err">'+j.error+'</div>'; return; }
    user=j.user; store.set('cp_user',user); refreshUser(); location.hash='#/courses';
  };
}
function stripeBadgeHTML(){ return '<div class="stripe-badge"><b>Stripe</b> secured payments</div>'; }
function wireCheckout(slug){
  const f=$('#coForm'); if(!f) return;
  f.onsubmit=async e=>{
    e.preventDefault();
    const btn=$('#stripePayBtn'); if(btn){ btn.disabled=true; btn.textContent='Redirecting to Stripe...'; }
    try{
      let r; try{ r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseSlug:slug,email:$('#coEmail').value})}); }catch(netErr){ $('#coMsg').innerHTML='<div class="alert err">Static demo (GitHub Pages): checkout needs the Node server. Run <code>npm start</code> locally or deploy with backend for Stripe.</div>'; if(btn){btn.disabled=false; btn.innerHTML='Try again';} return; }
      const j=await r.json();
      if(!r.ok){ $('#coMsg').innerHTML='<div class="alert err">'+(j.error||'Checkout failed')+'</div>'; if(btn){btn.disabled=false;} return; }
      if(j.url){ location.href=j.url; return; }
      cart=cart.filter(s=>s!==slug); refreshCart();
      $('#coMsg').innerHTML='<div class="alert ok">'+j.message+'</div>';
      setTimeout(()=>location.hash='#/learn/'+slug,1000);
    }catch(err){ $('#coMsg').innerHTML='<div class="alert err">'+err.message+'</div>'; if(btn){btn.disabled=false;} }
  };
}
function wireLearn(slug){
  document.addEventListener('click',e=>{
    if(e.target&&e.target.id==='lNext'){ const c=COURSES.find(x=>x.slug===slug); learnIdx=(learnIdx+1)%c.slides.length; $('#learnBody').innerHTML=learnHTML(c); }
    if(e.target&&e.target.id==='lPrev'){ const c=COURSES.find(x=>x.slug===slug); learnIdx=(learnIdx-1+c.slides.length)%c.slides.length; $('#learnBody').innerHTML=learnHTML(c); }
  });
}
window.addEventListener('hashchange',router);
$('#cartBtn').onclick=()=>$('#cartDrawer').classList.toggle('hidden');
$('#closeCart').onclick=()=>$('#cartDrawer').classList.add('hidden');
$('#checkoutBtn').onclick=()=>{ $('#cartDrawer').classList.add('hidden');
  location.hash = cart.length ? '#/checkout/'+cart[0] : '#/courses'; };
$('#ham').onclick=()=>$('#mobileMenu').classList.toggle('hidden');
document.querySelectorAll('#mobileMenu a').forEach(a=>a.onclick=()=>$('#mobileMenu').classList.add('hidden'));
$('#newsForm').onsubmit=async e=>{ e.preventDefault();
  const r=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('#newsEmail').value})});
  const j=await r.json(); $('#newsMsg').textContent=j.message||j.error||'';
};
$('#year').textContent=new Date().getFullYear();
(async function init(){ await loadCourses(); refreshCart(); refreshUser(); router(); })();
