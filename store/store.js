/* SkyWorld Online Shop — customer-facing store (prototype) */
const LOGO = '../shared/logo.png';   // <- replace shared/logo.png with your own logo (or change this path)
const $ = s => document.querySelector(s);
const esc = SW.esc, peso = SW.peso;
let me = null;                              // logged-in customer email
let co = null;                              // checkout state
let sel = {};                               // options picked in the product modal
let pickCat = 'All', pickQ = '';
let sf = { q: '', st: 'all', sort: 'def' };
let ordTab = 'All', want = '';
const REASONS = ['I changed my mind', 'Wrong product / variation selected', 'I found a cheaper price', 'I want to change the address / payment method', 'Delivery takes too long', 'I ordered a duplicate', 'Other reason'];

/* ---------- helpers ---------- */
function toast(m, t = '') { const e = document.createElement('div'); e.className = 'toast ' + t; e.textContent = m; $('#toasts').append(e); setTimeout(() => e.remove(), 4500); }
function closeModals() { document.querySelectorAll('.overlay').forEach(e => e.remove()); }
function modal(html, cls = '') { const o = document.createElement('div'); o.className = 'overlay'; o.innerHTML = `<div class="modal ${cls}">${html}</div>`; o.addEventListener('mousedown', e => { if (e.target === o && !o.dataset.lock) o.remove(); }); document.body.append(o); return o; }
const user = d => d.customers[me];
const stallsOf = d => d.stalls;
const bClass = s => s === 'To Ship' ? 'To' : s;
const badge = p => { const s = SW.stockStatus(p); return `<span class="badge b-${s}">${SW.STATUS_LABEL[s]}</span>`; };
const pwOk = p => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

/* ---------- nav & routing ---------- */
function nav() {
  const d = SW.load(), u = d.customers[me]; if (!u) { $('#nav').innerHTML = ''; return; }
  const un = d.cnotifs.filter(n => n.email === me && !n.read).length;
  $('#nav').innerHTML = `<div class="logo" onclick="location.hash='#/pick'"><img class="blogo" src="${LOGO}" alt="" onerror="this.onerror=null;this.src='../shared/logo.svg'"><span class="lt">SkyWorld<span class="sh"> Shop</span></span></div><button onclick="location.hash='#/pick'">🏬 <span class="tx">Choose stall</span></button><div class="sp"></div>
  <button onclick="location.hash='#/cart'">🛒 <span class="tx">Cart</span><span class="bd">${u.cart.length}</span></button><button onclick="location.hash='#/orders'">📦 <span class="tx">My orders</span></button><button onclick="location.hash='#/inbox'">🔔 <span class="tx">Inbox</span><span class="bd">${un}</span></button><button onclick="location.hash='#/reviews'">⭐ <span class="tx">Reviews</span></button>${SWTheme.btn()}`;
}
function route() {
  closeModals();
  const p = location.hash.replace(/^#\/?/, '').split('/'), d = SW.load();
  if (!d.customers[me]) guestInit();
  nav();
  const v = $('#view'); window.scrollTo(0, 0);
  if (p[0] === 's') return vStall(+p[1]);
  if (p[0] === 'cart') return vCart();
  if (p[0] === 'checkout') return vCheckout();
  if (p[0] === 'orders') return vOrders();
  if (p[0] === 'order') return vOrder(p[1]);
  if (p[0] === 'inbox') return vInbox();
  if (p[0] === 'reviews') return vReviews();
  if (p[0] === 'account') return vAccount();
  return vPick();
}
let booted = false;
window.addEventListener('hashchange', () => booted && route());

/* ---------- no login: every browser is a guest shopper ---------- */
function guestInit() {
  // The guest id lives in sessionStorage: opening the store link in a new tab/visit starts a brand-new,
  // blank shopper (no saved delivery address, cart or linked accounts). The same visitor keeps their
  // info while the tab stays open, so they can still review what they bought or keep shopping.
  let id = sessionStorage.getItem('sw_guest');
  const d = SW.load();
  if (!id || !d.customers[id]) {
    id = 'guest' + SW.uid() + '@guest.skyworld'; sessionStorage.setItem('sw_guest', id);
    const old = Date.now() - 864e5;   // tidy up old empty guest accounts
    Object.keys(d.customers).forEach(k => { const c = d.customers[k]; if (/@guest\.skyworld$/.test(k) && !c.cart.length && c.created < old && !d.orders.some(o => o.custEmail === k)) delete d.customers[k]; });
    d.customers[id] = { name: 'Guest', email: id, phone: '', pass: '', addr: { name: '', phone: '', line: '', city: '' }, cart: [], created: Date.now() };
    SW.save(d);
  }
  me = id;
}

/* ---------- choose category + stall ---------- */
function vPick() {
  const d = SW.load(), cats = ['All', ...Object.keys(SW.CATS)];
  const list = d.stalls.filter(s => (pickCat === 'All' || s.cat === pickCat) && (!pickQ || String(s.n) === pickQ.trim() || s.name.toLowerCase().includes(pickQ.toLowerCase())));
  $('#view').innerHTML = `<div class="wrap"><div class="panel"><h2>👋 Welcome to SkyWorld Shop! Choose a category and stall</h2><p class="hint">Every stall (1–105) has its own online store.</p>
  <div class="cats">${cats.map(c => `<button class="${pickCat === c ? 'on' : ''}" onclick="pickCat='${c}';vPick()">${SW.CATS[c] || '🏬'} ${c}</button>`).join('')}<button style="background:#222" onclick="surprise()">🎲 Random stall</button></div>
  <div class="tools"><input id="pq" placeholder="Stall number or name (1–105)" value="${esc(pickQ)}" oninput="pickQ=this.value;pickList()"></div></div><div class="stalls" id="sl"></div></div>`;
  pickList();
}
function pickList() {
  const d = SW.load(), list = d.stalls.filter(s => (pickCat === 'All' || s.cat === pickCat) && (!pickQ || String(s.n) === pickQ.trim() || s.name.toLowerCase().includes(pickQ.toLowerCase())));
  $('#sl').innerHTML = list.map(s => `<div class="stall ${s.open ? '' : 'closed'}" onclick="location.hash='#/s/${s.n}'"><div class="n">#${s.n}</div><div class="nm">${esc(s.name)}</div><div class="c">${SW.CATS[s.cat]} ${s.cat} ${s.open ? '' : '• Closed'}</div></div>`).join('') || '<div class="empty">No stalls found.</div>';
}
function surprise() { const d = SW.load(), l = d.stalls.filter(s => s.open && (pickCat === 'All' || s.cat === pickCat)); const s = l[Math.floor(Math.random() * l.length)]; location.hash = '#/s/' + s.n; }

/* ---------- stall store ---------- */
function vStall(n) {
  const d = SW.load(), s = d.stalls[n - 1]; if (!s) return location.hash = '#/pick';
  const [c1, c2] = SW.CAT_COLOR[s.cat];
  $('#view').innerHTML = `<div class="wrap"><div class="hero" style="background:linear-gradient(120deg,${c1},${c2})"><div><small>Stall #${s.n} • ${SW.CATS[s.cat]} ${s.cat}</small><h1>${esc(s.name)}</h1><small>📍 ${esc(s.address)}</small></div><div><span class="badge ${s.open ? 'b-in' : 'b-out'}">${s.open ? 'Store open' : 'Store closed'}</span></div></div>
  ${s.open ? '' : '<div class="panel" style="background:#fde0e2">This store is temporarily closed. You cannot place orders for now.</div>'}
  <div class="tools"><input placeholder="Search in this store..." value="${esc(sf.q)}" oninput="sf.q=this.value;stallList(${n})"><select onchange="sf.st=this.value;stallList(${n})">${[['all', 'All availability'], ['in', 'In Stock'], ['low', 'Low Stock'], ['out', 'Out of Stock']].map(o => `<option value="${o[0]}" ${sf.st === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>
  <select onchange="sf.sort=this.value;stallList(${n})">${[['def', 'Sort: Newest'], ['lo', 'Price: Low to High'], ['hi', 'Price: High to Low']].map(o => `<option value="${o[0]}" ${sf.sort === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div><div class="pgrid" id="pg"></div></div>`;
  stallList(n);
}
function stallList(n) {
  const d = SW.load(), s = d.stalls[n - 1], q = sf.q.toLowerCase();
  let l = d.products.filter(p => p.stall === n && !p.archived && p.name.toLowerCase().includes(q) && (sf.st === 'all' || SW.stockStatus(p) === sf.st));
  if (sf.sort === 'lo') l.sort((a, b) => SW.finalPrice(a) - SW.finalPrice(b)); else if (sf.sort === 'hi') l.sort((a, b) => SW.finalPrice(b) - SW.finalPrice(a)); else l.sort((a, b) => b.created - a.created);
  $('#pg').innerHTML = l.map(p => {
    const st = SW.stockStatus(p), dis = st === 'out' || !s.open ? 'disabled' : '';
    return `<div class="pc"><img src="${SW.img(p)}" onclick="openProduct('${p.id}')"><div class="in"><div class="nm" onclick="openProduct('${p.id}')">${esc(p.name)}</div><div class="hint">${p.cat}</div>
    <div><span class="pr">${peso(SW.finalPrice(p))}</span>${p.discount ? `<s>${peso(p.price)}</s> <span class="off">-${p.discount}%</span>` : ''}</div>
    <div>${badge(p)} ${st === 'low' ? `<span class="hint">Only ${p.qty} left</span>` : ''}</div>
    <div class="bt"><button class="sec sm" ${dis} onclick="openProduct('${p.id}')">Add to cart</button><button class="sm" ${dis} onclick="openProduct('${p.id}')">Buy now</button></div></div></div>`;
  }).join('') || '<div class="empty" style="grid-column:1/-1">No matching products.</div>';
}

/* ---------- product modal ---------- */
function optsHtml(p) {
  return `${p.colors.length ? `<label>Color</label><div class="chips" id="oc">${p.colors.map(c => `<button class="${sel.color === c ? 'on' : ''}" onclick="setOpt('color','${c}',this)"><span class="sw2" style="background:${SW.COLOR_HEX[c] || '#ccc'}"></span>${c}</button>`).join('')}</div>` : ''}
  ${p.sizes.length ? `<label>Size</label><div class="chips" id="os">${p.sizes.map(c => `<button class="${sel.size === c ? 'on' : ''}" onclick="setOpt('size','${c}',this)">${c}</button>`).join('')}</div>` : ''}
  <label>Quantity <span class="hint">(${p.qty} available)</span></label><div class="qty"><button onclick="qAdj(-1,${p.qty})">−</button><input id="qv" value="${sel.qty}" oninput="qSet(${p.qty})"><button onclick="qAdj(1,${p.qty})">+</button></div>`;
}
function setOpt(k, v, el) { sel[k] = v; [...el.parentNode.children].forEach(b => b.classList.remove('on')); el.classList.add('on'); }
function qAdj(n, max) { sel.qty = Math.min(max, Math.max(1, (+$('#qv').value || 1) + n)); $('#qv').value = sel.qty; }
function qSet(max) { let v = Math.floor(+$('#qv').value) || 1; sel.qty = Math.min(max, Math.max(1, v)); }
function openProduct(pid) {
  const d = SW.load(), p = d.products.find(x => x.id === pid), s = d.stalls[p.stall - 1], st = SW.stockStatus(p);
  sel = { pid, color: '', size: '', qty: 1 };
  const dis = st === 'out' || !s.open;
  modal(`<div class="pd"><img src="${SW.img(p)}"><div><h2>${esc(p.name)}</h2><div class="hint">Stall #${s.n} • ${esc(s.name)} • Category: ${p.cat}</div>
  <div style="margin:10px 0"><span class="pr" style="font-size:24px;color:var(--p);font-weight:700">${peso(SW.finalPrice(p))}</span>${p.discount ? ` <s class="hint">${peso(p.price)}</s> <span class="off">-${p.discount}%</span>` : ''}</div>
  <div>${badge(p)} ${st === 'low' ? `<span class="hint">Only ${p.qty} left!</span>` : st === 'in' ? `<span class="hint">${p.qty} pieces available</span>` : ''}</div><p style="margin-top:10px;color:#444">${esc(p.desc)}</p>
  ${dis ? `<p class="err">${!s.open ? 'The store is closed.' : 'This product is out of stock.'}</p>` : optsHtml(p)}</div></div>
  <div class="mf"><button class="gr" onclick="closeModals()">Close</button><button class="sec" ${dis ? 'disabled' : ''} onclick="addToCart()">🛒 Add to basket</button><button ${dis ? 'disabled' : ''} onclick="buyNow()">Buy now</button></div>`, 'big');
}
function checkSel() {
  const d = SW.load(), p = d.products.find(x => x.id === sel.pid); qSet(p.qty);
  if (p.colors.length && !sel.color) { toast('Please choose a color', 'er'); return null; }
  if (p.sizes.length && !sel.size) { toast('Please choose a size', 'er'); return null; }
  if (p.qty < 1) { toast('Out of stock', 'er'); return null; }
  return { d, p };
}
function addToCart() {
  const r = checkSel(); if (!r) return; const { d, p } = r, u = user(d);
  const ex = u.cart.find(c => c.pid === p.id && c.color === sel.color && c.size === sel.size);
  if (ex) ex.qty = Math.min(p.qty, ex.qty + sel.qty); else u.cart.push({ id: SW.uid(), pid: p.id, stall: p.stall, qty: sel.qty, color: sel.color, size: sel.size });
  SW.save(d); closeModals(); nav(); toast('Added to basket 🛒', 'ok');
}
function buyNow() {
  const r = checkSel(); if (!r) return;
  co = { stall: r.p.stall, from: 'buy', items: [{ pid: r.p.id, qty: sel.qty, color: sel.color, size: sel.size }], voucher: '', addr: null };
  closeModals(); location.hash = '#/checkout';
}

/* ---------- cart ---------- */
function vCart() {
  const d = SW.load(), u = user(d), groups = {};
  u.cart.forEach(c => (groups[c.stall] = groups[c.stall] || []).push(c));
  const keys = Object.keys(groups);
  $('#view').innerHTML = `<div class="wrap"><div class="panel"><h2>🛒 My cart (${u.cart.length})</h2><p class="hint">Products you added to your basket. Edit the color/size/quantity or delete them.</p></div>${keys.map(k => {
    const s = d.stalls[k - 1], rows = groups[k]; let tot = 0, cnt = 0;
    return `<div class="panel"><h3>🏬 Stall #${s.n} — ${esc(s.name)}</h3>${rows.map(c => {
      const p = d.products.find(x => x.id === c.pid), ok = p && !p.archived && p.qty >= c.qty;
      if (ok) { tot += SW.finalPrice(p) * c.qty; cnt += c.qty; }
      return `<div class="crow"><img src="${SW.img(p)}"><div><b>${esc(p.name)}</b><div class="hint">${[c.color, c.size].filter(Boolean).join(' • ') || 'No variation'}</div>${ok ? badge(p) : '<span class="badge b-out">Not enough stock</span>'}</div><div>${peso(SW.finalPrice(p))}</div><div>Qty: <b>${c.qty}</b><div class="hint">${peso(SW.finalPrice(p) * c.qty)}</div></div><div><button class="sm sec" onclick="editCart('${c.id}')">Edit</button> <button class="sm gr" onclick="delCart('${c.id}')">Delete</button></div></div>`;
    }).join('')}<div class="mf" style="align-items:center"><span>Subtotal (${cnt} items): <b style="color:var(--p);font-size:18px">${peso(tot)}</b></span><button ${cnt ? '' : 'disabled'} onclick="cartCheckout(${k})">Checkout</button></div></div>`;
  }).join('') || '<div class="panel empty">Your cart is empty. <br><br><button onclick="location.hash=\'#/pick\'">Start shopping</button></div>'}</div>`;
}
function editCart(id) {
  const d = SW.load(), c = user(d).cart.find(x => x.id === id), p = d.products.find(x => x.id === c.pid);
  sel = { pid: p.id, color: c.color, size: c.size, qty: Math.min(c.qty, Math.max(1, p.qty)), cart: id };
  modal(`<h2>Edit item</h2><b>${esc(p.name)}</b><div class="hint">${badge(p)}</div>${optsHtml(p)}<div class="mf"><button class="gr" onclick="closeModals()">Cancel</button><button onclick="saveCart()">Save changes</button></div>`);
}
function saveCart() {
  const r = checkSel(); if (!r) return; const c = user(r.d).cart.find(x => x.id === sel.cart);
  c.color = sel.color; c.size = sel.size; c.qty = sel.qty; SW.save(r.d); closeModals(); toast('Item updated', 'ok'); vCart(); nav();
}
function delCart(id) { if (!confirm('Remove this item from your cart?')) return; const d = SW.load(); const u = user(d); u.cart = u.cart.filter(c => c.id !== id); SW.save(d); vCart(); nav(); }
function cartCheckout(stall) {
  const d = SW.load(), items = user(d).cart.filter(c => c.stall === stall).filter(c => { const p = d.products.find(x => x.id === c.pid); return p && !p.archived && p.qty >= c.qty; });
  if (!items.length) return toast('No available items.', 'er');
  co = { stall, from: 'cart', items: items.map(c => ({ cartId: c.id, pid: c.pid, qty: c.qty, color: c.color, size: c.size })), voucher: '', addr: null }; location.hash = '#/checkout';
}

/* ---------- checkout ---------- */
function calc(lines, code) {
  const orig = lines.reduce((a, l) => a + l.p.price * l.qty, 0), sub = lines.reduce((a, l) => a + SW.finalPrice(l.p) * l.qty, 0), n = lines.reduce((a, l) => a + l.qty, 0), c = (code || '').trim().toUpperCase();
  let v = 0, vm = '';
  if (c === 'SKY50') { if (sub >= 500) v = 50; else vm = 'Minimum spend of ₱500 for SKY50'; }
  else if (c === 'STALL10') { if (sub >= 300) v = Math.min(100, Math.round(sub * .1)); else vm = 'Minimum spend of ₱300 for STALL10'; }
  else if (c === 'WELCOME') { if (sub >= 200) v = 30; else vm = 'Minimum spend of ₱200 for WELCOME'; }
  else if (c) vm = 'Invalid voucher code';
  const ship = Math.min(49 + (n - 1) * 10, 150), sd = sub >= 1500 ? ship : sub >= 500 ? Math.min(30, ship) : 0;
  return { orig, pd: orig - sub, sub, v, vm, ship, sd, total: sub - v + ship - sd };
}
const shipRange = () => { const f = x => new Date(Date.now() + x * 864e5).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }); return `${f(3)} – ${f(5)}`; };
function coLines(d) { return co.items.map(i => ({ ...i, p: d.products.find(x => x.id === i.pid) })); }
function vCheckout() {
  if (!co) return location.hash = '#/cart';
  const d = SW.load(), s = d.stalls[co.stall - 1], lines = coLines(d), u = user(d); co.addr = co.addr || { ...u.addr };
  $('#view').innerHTML = `<div class="wrap"><div class="panel"><h2>Checkout — Stall #${s.n} ${esc(s.name)}</h2></div>
  <div class="panel"><h3>📍 Delivery address</h3><div class="row2"><div><label>Full name</label><input id="a1" value="${esc(co.addr.name)}"></div><div><label>Phone</label><input id="a2" value="${esc(co.addr.phone)}" placeholder="09xxxxxxxxx"></div></div><label>Street / Barangay / House no.</label><input id="a3" value="${esc(co.addr.line)}"><label>City / Province</label><input id="a4" value="${esc(co.addr.city)}"></div>
  <div class="panel"><h3>🛍️ Products ordered</h3>${lines.map(l => `<div class="crow co"><img src="${SW.img(l.p)}"><div><b>${esc(l.p.name)}</b><div class="hint">${[l.color, l.size].filter(Boolean).join(' • ') || 'No variation'}</div></div><div>${peso(SW.finalPrice(l.p))}</div><div>×${l.qty}</div></div>`).join('')}<p style="margin-top:10px">🚚 <b>Estimated shipping:</b> ${shipRange()}</p></div>
  <div class="panel sum"><h3>🧾 Order summary</h3><div id="sm"></div></div>
  <div class="panel"><h3>💳 Payment method</h3>
  <label class="pm"><input type="radio" name="pay" value="Cash on Delivery" checked onchange="payUI()">💵 Cash on Delivery</label>
  <label class="pm"><input type="radio" name="pay" value="Credit/Debit Card" onchange="payUI()">💳 Credit / Debit Card</label>
  <div id="cardf" style="display:none;padding:6px 4px"><input id="cn" placeholder="Card number (16 digits)" maxlength="19"><div class="row2" style="margin-top:8px"><input id="ce" placeholder="MM/YY" maxlength="5"><input id="cc" placeholder="CVV" maxlength="3" type="password"></div></div>
  ${Object.keys(LINK).map(k => `<label class="pm"><input type="radio" name="pay" value="${k}" onchange="payUI()">${LINK[k].icon} ${LINK[k].label}</label><div class="lk" id="lk-${LINK[k].id}" style="display:none"></div>`).join('')}
  <div class="err" id="err"></div><div class="mf"><button class="gr" onclick="history.back()">Back</button><button onclick="placeOrder()">Place order</button></div></div></div>`;
  ['a1', 'a2', 'a3', 'a4'].forEach((id, i) => $('#' + id).addEventListener('input', e => co.addr[['name', 'phone', 'line', 'city'][i]] = e.target.value));
  sumHtml();
}
function sumHtml() {
  const d = SW.load(), c = calc(coLines(d), co.voucher), r = (a, b, st = '') => `<div class="r" style="${st}"><span>${a}</span><span>${b}</span></div>`;
  $('#sm').innerHTML = r('Original price', peso(c.orig)) + r('Product discount', '−' + peso(c.pd)) +
    `<div class="r"><span>Seller voucher</span><span><input id="vc" placeholder="SKY50 / STALL10 / WELCOME" value="${esc(co.voucher)}" style="width:210px;display:inline-block"> <button class="sm sec" onclick="co.voucher=$('#vc').value;sumHtml()">Apply</button></span></div>${c.vm ? `<div class="err">${c.vm}</div>` : ''}` +
    r('Voucher discount', '−' + peso(c.v)) + `<hr style="margin:8px 0;border:0;border-top:1px solid #eee">` + r('Shipping fee', peso(c.ship)) + r('Shipping discount', '−' + peso(c.sd)) + r('Total', peso(c.total), 'font-size:20px;font-weight:800;color:var(--p);border-top:1px solid #eee;margin-top:6px;padding-top:10px');
}
// e-wallets and banks: customer must link an account before paying
const LINK = {   // url = the real website that opens in a new tab for linking / paying
  'GCash': { url: 'https://www.gcash.com', id: 'gcash', icon: '📱', label: 'GCash', field: 'GCash mobile number', ph: '09xxxxxxxxx', re: /^09\d{9}$/, err: 'Enter a valid 11-digit GCash number (09xxxxxxxxx).', mask: v => v.slice(0, 4) + '•••' + v.slice(-4) },
  'Maya': { url: 'https://www.maya.ph', id: 'maya', icon: '📱', label: 'Maya', field: 'Maya mobile number', ph: '09xxxxxxxxx', re: /^09\d{9}$/, err: 'Enter a valid 11-digit Maya number (09xxxxxxxxx).', mask: v => v.slice(0, 4) + '•••' + v.slice(-4) },
  'Bank Transfer - BDO': { url: 'https://www.bdo.com.ph', id: 'bdo', icon: '🏦', label: 'Bank — BDO', field: 'BDO account number', ph: '10–12 digit account number', re: /^\d{10,12}$/, err: 'Enter a valid BDO account number (10–12 digits).', mask: v => '••••' + v.slice(-4), bank: true },
  'Bank Transfer - BPI': { url: 'https://www.bpi.com.ph', id: 'bpi', icon: '🏦', label: 'Bank — BPI', field: 'BPI account number', ph: '10-digit account number', re: /^\d{10}$/, err: 'Enter a valid BPI account number (10 digits).', mask: v => '••••' + v.slice(-4), bank: true }
};
function payUI() {
  const v = document.querySelector('input[name=pay]:checked').value; if (co) co.paid = false;
  $('#cardf').style.display = v === 'Credit/Debit Card' ? 'block' : 'none';
  Object.keys(LINK).forEach(k => { const el = $('#lk-' + LINK[k].id); el.style.display = k === v ? 'block' : 'none'; if (k === v) linkUI(k); });
}
function linkUI(k) {
  const L = LINK[k], u = user(SW.load()), cur = (u.linked || {})[k], el = $('#lk-' + L.id);
  el.innerHTML = cur
    ? `<div class="linked">✅ <b>${L.label}</b> account linked: ${esc(cur.masked)}${cur.holder ? ' (' + esc(cur.holder) + ')' : ''}<div class="hint">The ${L.label} website will open so you can complete the payment when you place the order.</div><div class="pf-actions"><button class="sm gr" onclick="unlink('${k}')">Change / unlink account</button></div></div>`
    : `<div class="linkbox"><b>Link your ${L.label} account to pay</b><div class="hint">${L.bank ? 'Enter the bank account you will pay from.' : 'Enter the mobile number registered to your ' + L.label + ' wallet.'}</div>${L.bank ? '<label>Account name</label><input id="lkn" placeholder="Name on the account">' : ''}<label>${L.field}</label><input id="lkv" placeholder="${L.ph}" inputmode="numeric"><div class="err" id="lke"></div><button class="sm" onclick="doLink('${k}')">🔗 Link account</button></div>`;
}
function doLink(k) {
  const L = LINK[k], v = $('#lkv').value.replace(/\s|-/g, ''), nm = L.bank ? $('#lkn').value.trim() : '';
  if (L.bank && !nm) return $('#lke').textContent = 'Enter the account name.';
  if (!L.re.test(v)) return $('#lke').textContent = L.err;
  window.open(L.url, '_blank', 'noopener');   // opens the real website to log in / link
  const d = SW.load(), u = user(d); u.linked = u.linked || {}; u.linked[k] = { masked: L.mask(v), holder: nm, ts: Date.now() }; SW.save(d);
  toast(`${L.label} opened in a new tab. Account linked`, 'ok'); linkUI(k);
}
function unlink(k) { const d = SW.load(), u = user(d); if (u.linked) delete u.linked[k]; SW.save(d); linkUI(k); }
function payConfirm(pay) {
  const L = LINK[pay], d = SW.load(), tot = calc(coLines(d), co.voucher).total;
  modal(`<h2>${L.icon} Complete your payment</h2><p style="margin:8px 0">We opened the <b>${L.label}</b> website in a new tab. Log in there and pay <b>${peso(tot)}</b>, then come back here and confirm.</p><p class="hint">Nothing opened? Allow pop-ups, or <a href="${L.url}" target="_blank" rel="noopener">open ${L.label} here</a>. (Prototype: the payment itself is not verified.)</p>
  <div class="mf"><button class="gr" onclick="closeModals()">Cancel</button><button onclick="co.paid=true;closeModals();placeOrder()">✅ I've completed the payment</button></div>`);
}
function placeOrder() {
  const err = $('#err'), a = co.addr, pay = document.querySelector('input[name=pay]:checked').value;
  if (!a.name.trim() || !a.line.trim() || !a.city.trim()) return err.textContent = 'Please complete the delivery address.';
  if (!/^09\d{9}$/.test(a.phone.trim())) return err.textContent = 'Phone: 11 digits starting with 09.';
  if (pay === 'Credit/Debit Card') {
    if (!/^\d{16}$/.test($('#cn').value.replace(/\s/g, ''))) return err.textContent = 'Card number: 16 digits.';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test($('#ce').value)) return err.textContent = 'Expiry format: MM/YY.';
    if (!/^\d{3}$/.test($('#cc').value)) return err.textContent = 'CVV: 3 digits.';
  }
  const d = SW.load(), s = d.stalls[co.stall - 1];
  if (LINK[pay] && !(user(d).linked || {})[pay]) return err.textContent = `Please link your ${LINK[pay].label} account first.`;
  if (!s.open) return err.textContent = 'The store is closed right now.';
  const lines = coLines(d);
  for (const l of lines) { const p = d.products.find(x => x.id === l.pid); if (!p || p.archived || p.qty < l.qty) return err.textContent = `Not enough stock for "${l.p.name}". Go back to your cart and edit it.`; }
  if (LINK[pay] && !co.paid) { window.open(LINK[pay].url, '_blank', 'noopener'); return payConfirm(pay); }
  const c = calc(lines, co.voucher), id = SW.orderId(d, co.stall);
  // AUTO-DEDUCT STOCK
  lines.forEach(l => {
    const p = d.products.find(x => x.id === l.pid), before = p.qty; p.qty -= l.qty; SW.audit(d, co.stall, 'System', 'Stock deducted', `${p.name}: ${before} → ${p.qty} (order ${id}, ×${l.qty})`);
    const st = SW.stockStatus(p);
    if (st === 'out') SW.notifyOwner(d, co.stall, `⚠️ ${p.name} is now OUT OF STOCK.`); else if (st === 'low') SW.notifyOwner(d, co.stall, `⚠️ Low stock: ${p.name} (only ${p.qty} left).`);
  });
  const u = user(d);
  d.orders.unshift({ id, stall: co.stall, custEmail: me, custName: a.name.trim(), items: lines.map(l => ({ pid: l.pid, name: l.p.name, qty: l.qty, unit: SW.finalPrice(l.p), orig: l.p.price, color: l.color, size: l.size })), addr: { name: a.name.trim(), phone: a.phone.trim(), line: a.line.trim(), city: a.city.trim() }, pay, orig: c.orig, prodDisc: c.pd, voucher: c.v, voucherCode: co.voucher.toUpperCase(), ship: c.ship, shipDisc: c.sd, total: c.total, payRef: LINK[pay] ? user(d).linked[pay].masked : '', status: 'To Ship', reason: '', createdAt: Date.now(), addrChangedAt: 0 });
  if (co.from === 'cart') { const ids = co.items.map(i => i.cartId); u.cart = u.cart.filter(x => !ids.includes(x.id)); }
  u.addr = { ...a };
  SW.notifyOwner(d, co.stall, `🛒 New order ${id} from ${a.name}: ${lines.map(l => `${l.p.name} ×${l.qty}`).join(', ')} — ${peso(c.total)} (${pay}${LINK[pay] ? ', account linked' : ''}). Please prepare it for shipping.`); SW.notifyCust(d, me, `Thanks for your order! Order ${id} has been placed (${peso(c.total)}).`, id);
  SW.audit(d, co.stall, a.name.trim(), 'Online order', `${id} • ${lines.map(l => `${l.p.name} ×${l.qty}`).join(', ')} • ${peso(c.total)} • ${pay}${LINK[pay] ? ' (' + user(d).linked[pay].masked + ')' : ''} • ${a.line.trim()}, ${a.city.trim()}`); SW.save(d); co = null; nav();
  const o = modal(`<div style="text-align:center"><div style="font-size:50px">✅</div><h2>Thanks for your order!</h2><p class="hint" style="margin:8px 0 4px">You'll receive updates in the notifications inbox.</p><p><b>${id}</b></p></div><div class="mf" style="justify-content:center"><button class="gr" onclick="closeModals();location.hash='#/s/${s.n}'">Continue shopping</button><button onclick="closeModals();location.hash='#/order/${id}'">View order</button></div>`); o.dataset.lock = 1;
}

/* ---------- orders ---------- */
function vOrders() {
  const d = SW.load(), all = d.orders.filter(o => o.custEmail === me), l = all.filter(o => ordTab === 'All' || o.status === ordTab);
  $('#view').innerHTML = `<div class="wrap"><div class="panel"><h2>📦 My orders</h2><div class="tabs">${['All', 'To Ship', 'Shipped', 'Delivered', 'Cancelled'].map(t => `<button class="${ordTab === t ? 'on' : ''}" onclick="ordTab='${t}';vOrders()">${t}</button>`).join('')}</div></div>
  ${l.map(o => `<div class="panel"><div class="li" style="border:0;padding:0"><b>Stall #${o.stall} — ${esc(d.stalls[o.stall - 1].name)}</b><span class="badge b-${bClass(o.status)}" style="background:#eee">${o.status}</span></div>${o.items.map(i => `<div class="li"><span>${esc(i.name)} <span class="hint">${[i.color, i.size].filter(Boolean).join(' • ')}</span> ×${i.qty}</span><span>${peso(i.unit * i.qty)}</span></div>`).join('')}<div class="li"><span class="hint">${o.id} • ${SW.fmt(o.createdAt)}</span><span><b>${peso(o.total)}</b> <button class="sm" onclick="location.hash='#/order/${o.id}'">View order</button></span></div></div>`).join('') || '<div class="panel empty">No orders yet.</div>'}</div>`;
}
const canChange = o => (o.status === 'To Ship' || o.status === 'Shipped') && Date.now() - o.createdAt <= 2 * 864e5;
function vOrder(id) {
  const d = SW.load(), o = d.orders.find(x => x.id === id && x.custEmail === me); if (!o) return location.hash = '#/orders';
  const steps = ['Order placed', 'To Ship', 'Shipped', 'Delivered'], at = o.status === 'Cancelled' ? -1 : steps.indexOf(o.status === 'To Ship' ? 'To Ship' : o.status);
  $('#view').innerHTML = `<div class="wrap"><div class="panel"><div class="li" style="border:0;padding:0"><h2>Order ${o.id}</h2><button class="sm gr" onclick="location.hash='#/orders'">← Back</button></div><p class="hint">Placed ${SW.fmt(o.createdAt)} • Stall #${o.stall} ${esc(d.stalls[o.stall - 1].name)}</p>
  ${o.status === 'Cancelled' ? `<div class="panel" style="background:#fde0e2;margin-top:12px">❌ Order cancelled. Reason: ${esc(o.reason)}</div>` : `<div class="stp">${steps.map((s, i) => `<div class="${i <= at ? 'on' : ''}">${s}</div>`).join('')}</div>`}</div>
  <div class="panel"><h3>Products</h3>${o.items.map(i => `<div class="li"><span><b>${esc(i.name)}</b> <span class="hint">${[i.color, i.size].filter(Boolean).join(' • ')}</span> ×${i.qty}</span><span>${peso(i.unit * i.qty)}</span></div>`).join('')}
  <div class="sum" style="margin-top:10px">${[['Original price', peso(o.orig)], ['Product discount', '−' + peso(o.prodDisc)], ['Seller voucher', '−' + peso(o.voucher)], ['Shipping fee', peso(o.ship)], ['Shipping discount', '−' + peso(o.shipDisc)]].map(r => `<div class="r"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}<div class="r t"><span>Total</span><span>${peso(o.total)}</span></div><div class="r"><span>Payment</span><span>${o.pay}</span></div></div></div>
  <div class="panel"><h3>📍 Delivery address</h3><p>${esc(o.addr.name)} • ${esc(o.addr.phone)}<br>${esc(o.addr.line)}, ${esc(o.addr.city)}</p>
  <div class="mf" style="justify-content:flex-start"><button class="sec" ${canChange(o) ? '' : 'disabled'} onclick="chAddr('${o.id}')">Change address</button><button class="gr" ${o.status === 'To Ship' ? '' : 'disabled'} onclick="cancel1('${o.id}')">Cancel order</button></div>
  <p class="hint" style="margin-top:6px">You can change the address within 2 days of ordering. Orders can only be cancelled while they are "To Ship".</p></div></div>`;
}
function chAddr(id) {
  const d = SW.load(), o = d.orders.find(x => x.id === id);
  modal(`<h2>Change address</h2><label>Full name</label><input id="n1" value="${esc(o.addr.name)}"><label>Phone</label><input id="n2" value="${esc(o.addr.phone)}"><label>Street / Barangay</label><input id="n3" value="${esc(o.addr.line)}"><label>City / Province</label><input id="n4" value="${esc(o.addr.city)}"><div class="err" id="nerr"></div><div class="mf"><button class="gr" onclick="closeModals()">Cancel</button><button onclick="saveAddr('${id}')">Save address</button></div>`);
}
function saveAddr(id) {
  const d = SW.load(), o = d.orders.find(x => x.id === id), a = { name: $('#n1').value.trim(), phone: $('#n2').value.trim(), line: $('#n3').value.trim(), city: $('#n4').value.trim() };
  if (!a.name || !a.line || !a.city || !/^09\d{9}$/.test(a.phone)) return $('#nerr').textContent = 'Please complete the details (phone: 09xxxxxxxxx).';
  if (!canChange(o)) return $('#nerr').textContent = 'More than 2 days have passed or the order was already shipped.';
  o.addr = a; o.addrChangedAt = Date.now(); SW.notifyOwner(d, o.stall, `📍 Customer changed delivery address for ${o.id}.`); SW.notifyCust(d, me, `Address updated for order ${o.id}.`, o.id); SW.save(d); closeModals(); toast('Address updated', 'ok'); vOrder(id);
}
function cancel1(id) { modal(`<h2>Cancel this order?</h2><p class="hint" style="margin:8px 0">Once cancelled, this cannot be undone.</p><div class="mf"><button onclick="closeModals()">Keep order</button><button class="gr" onclick="closeModals();cancel2('${id}')">Cancel anyway</button></div>`); }
function cancel2(id) { modal(`<h2>Why are you cancelling?</h2>${REASONS.map(r => `<label class="pm"><input type="radio" name="rs" value="${r}" onchange="$('#cbtn').disabled=false">${r}</label>`).join('')}<div class="mf"><button class="gr" onclick="closeModals()">Back</button><button id="cbtn" disabled onclick="doCancel('${id}')">Cancel order</button></div>`); }
function doCancel(id) {
  const reason = document.querySelector('input[name=rs]:checked').value, d = SW.load(), o = d.orders.find(x => x.id === id);
  if (o.status !== 'To Ship') { closeModals(); return toast('This order can no longer be cancelled', 'er'); }
  o.status = 'Cancelled'; o.reason = reason;
  o.items.forEach(i => { const p = d.products.find(x => x.id === i.pid); if (p) { const b = p.qty; p.qty += i.qty; SW.audit(d, o.stall, 'System', 'Stock restored', `${p.name}: ${b} → ${p.qty} (order ${o.id} cancelled)`); } });   // restore the stock
  SW.notifyOwner(d, o.stall, `❌ Order ${o.id} was cancelled by the customer. Reason: ${reason}`); SW.notifyCust(d, me, `Order ${o.id} was cancelled.`, o.id); SW.audit(d, o.stall, o.custName, 'Order cancelled', `${o.id} — ${reason}`); SW.save(d); closeModals(); nav();
  const m = modal(`<div style="text-align:center"><div style="font-size:50px">🛑</div><h2>Order cancelled</h2><p class="hint">Order ${o.id} has been cancelled.</p></div><div class="mf" style="justify-content:center"><button onclick="closeModals();vOrder('${o.id}')">OK</button></div>`); m.dataset.lock = 1;
}

/* ---------- inbox / account ---------- */
function vInbox() {
  const d = SW.load(), l = d.cnotifs.filter(n => n.email === me);
  $('#view').innerHTML = `<div class="wrap"><div class="panel"><h2>🔔 Notifications inbox</h2>${l.map(n => `<div class="li ${n.read ? '' : 'un'}"><span>${esc(n.msg)}</span><span class="hint">${SW.fmt(n.ts)} ${n.orderId ? `<a onclick="location.hash='#/order/${n.orderId}'">View</a>` : ''}</span></div>`).join('') || '<div class="empty">No notifications.</div>'}</div></div>`;
  l.forEach(n => n.read = true); SW.save(d); nav();
}
let pPic, pAv;
function vAccount() {
  const d = SW.load(), u = user(d); pPic = undefined; pAv = undefined;
  $('#view').innerHTML = `<div class="wrap" style="max-width:700px"><div class="panel"><h2>👤 My account</h2>
  <div class="pf-head"><div id="pfav">${SW.avatar(u, 96)}</div><div><div class="hint" style="margin:0 0 6px">Profile picture</div><div class="pf-actions"><label style="margin:0"><span class="btn-like">📷 Upload photo</span><input type="file" id="pfile" accept="image/*" hidden onchange="pickPic(this)"></label><button class="gr sm" onclick="pickAv('', true)">Remove photo</button></div></div></div>
  <label>Or choose an avatar</label><div class="av-pick" id="avp">${SW.AVATARS.map(a => `<button type="button" class="${!u.pic && u.avatar === a ? 'on' : ''}" onclick="pickAv('${a}')">${a}</button>`).join('')}</div>
  <label>Name</label><input id="u1" value="${esc(u.name)}"><label>Email</label><input value="${esc(u.email)}" disabled><label>Phone</label><input id="u2" value="${esc(u.phone)}"><div class="mf"><button onclick="saveAcc()">Save</button></div></div>
  <div class="panel"><h3>Change password</h3><label>Current</label><input id="p1" type="password"><label>New</label><input id="p2" type="password"><div class="mf"><button onclick="chPw()">Update password</button></div></div></div>`;
}
function prevPic() {
  const u = { ...user(SW.load()) }; if (pPic !== undefined) u.pic = pPic; if (pAv !== undefined) u.avatar = pAv;
  $('#pfav').innerHTML = SW.avatar(u, 96);
  document.querySelectorAll('#avp button').forEach(b => b.classList.toggle('on', !u.pic && b.textContent === u.avatar));
}
function pickPic(inp) { const f = inp.files[0]; if (!f) return; SW.readPhoto(f, url => { pPic = url; pAv = ''; prevPic(); }); }
function pickAv(a, removePhoto) { pAv = removePhoto ? '' : a; pPic = ''; prevPic(); }
function saveAcc() {
  const d = SW.load(), u = user(d); if (!$('#u1').value.trim() || !/^09\d{9}$/.test($('#u2').value.trim())) return toast('Check your name and phone', 'er');
  u.name = $('#u1').value.trim(); u.phone = $('#u2').value.trim();
  if (pPic !== undefined) u.pic = pPic || null; if (pAv !== undefined) u.avatar = pAv || null;
  SW.save(d); toast('Saved', 'ok'); nav(); vAccount();
}
function chPw() { const d = SW.load(), u = user(d); if (u.pass !== SW.hash($('#p1').value)) return toast('Current password is incorrect', 'er'); if (!pwOk($('#p2').value)) return toast('Password: 8+ characters, letters and numbers', 'er'); u.pass = SW.hash($('#p2').value); SW.save(d); toast('Password changed', 'ok'); vAccount(); }

/* ---------- reviews ---------- */
let rv = { key: '', rating: 0, pics: [] };
function vReviews() {
  const d = SW.load(), rows = [];
  d.orders.filter(o => o.custEmail === me && o.status !== 'Cancelled').forEach(o => o.items.forEach((i, idx) => rows.push({ o, i, key: `${o.id}#${idx}` })));
  const mine = Object.fromEntries(d.reviews.filter(r => r.email === me).map(r => [r.key, r]));
  $('#view').innerHTML = `<div class="wrap"><div class="panel"><h2>⭐ Reviews</h2><p class="hint">Rate and comment on the products you bought. You can also add pictures of your purchase.</p></div>
  ${rows.map(({ o, i, key }) => {
    const p = d.products.find(x => x.id === i.pid), r = mine[key];
    return `<div class="panel rvrow"><img src="${p ? SW.img(p) : ''}" alt=""><div class="rvinfo"><b>${esc(i.name)}</b><div class="hint">${[i.color, i.size].filter(Boolean).join(' • ') || 'No variation'} • ×${i.qty}</div><div class="hint">Stall #${o.stall} ${esc(d.stalls[o.stall - 1].name)} • ${o.id} • ${SW.fmtD(o.createdAt)}</div>
    ${r ? `<div class="stars">${SW.stars(r.rating)}</div>${r.comment ? `<p class="rvc">${esc(r.comment)}</p>` : ''}${r.pics.length ? `<div class="rvpics">${r.pics.map(x => `<img src="${x}" onclick="zoomPic(this.src)" alt="Review picture">`).join('')}</div>` : ''}` : ''}</div>
    <div><button class="${r ? 'sec' : ''} sm" onclick="reviewForm('${key}')">${r ? '✏️ Edit review' : '⭐ Write a review'}</button></div></div>`;
  }).join('') || '<div class="panel empty">You have no purchases to review yet.<br><br><button onclick="location.hash=\'#/pick\'">Start shopping</button></div>'}</div>`;
}
function zoomPic(src) { modal(`<img src="${src}" style="width:100%;border-radius:10px" alt=""><div class="mf"><button class="gr" onclick="closeModals()">Close</button></div>`); }
function reviewForm(key) {
  const d = SW.load(), [oid, idx] = key.split('#'), o = d.orders.find(x => x.id === oid && x.custEmail === me); if (!o) return;
  const i = o.items[+idx], r = d.reviews.find(x => x.key === key && x.email === me);
  rv = { key, rating: r ? r.rating : 0, pics: r ? [...r.pics] : [] };
  modal(`<h2>Review: ${esc(i.name)}</h2><div class="hint">${[i.color, i.size].filter(Boolean).join(' • ') || 'No variation'} • ${o.id}</div>
  <label>Rating *</label><div class="starpick" id="sp"></div>
  <label>Comment</label><textarea id="rc" rows="4" maxlength="500" placeholder="Tell others what you think about this product...">${esc(r?.comment)}</textarea>
  <label>Upload picture <span class="hint">(optional, up to 3)</span></label><input type="file" id="rf" accept="image/*" multiple onchange="rvPick(this)"><div class="rvpics" id="rp"></div>
  <div class="err" id="rerr"></div><div class="mf"><button class="gr" onclick="closeModals()">Cancel</button><button onclick="saveReview()">${r ? 'Save changes' : 'Submit review'}</button></div>`);
  starUI(); picUI();
}
function starUI() { $('#sp').innerHTML = [1, 2, 3, 4, 5].map(n => `<button type="button" class="${n <= rv.rating ? 'on' : ''}" onclick="rv.rating=${n};starUI()" aria-label="${n} star">★</button>`).join(''); }
function picUI() { $('#rp').innerHTML = rv.pics.map((x, k) => `<div class="rvp"><img src="${x}" alt=""><button type="button" class="x" onclick="rv.pics.splice(${k},1);picUI()" aria-label="Remove picture">×</button></div>`).join(''); }
function rvPick(inp) {
  const files = [...inp.files].slice(0, 3 - rv.pics.length); if (!files.length) { $('#rerr').textContent = 'You can upload up to 3 pictures.'; inp.value = ''; return; }
  files.forEach(f => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 500 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); if (rv.pics.length < 3) { rv.pics.push(c.toDataURL('image/jpeg', .7)); picUI(); } }; im.src = r.result; }; r.readAsDataURL(f); });
  inp.value = '';
}
function saveReview() {
  if (!rv.rating) return $('#rerr').textContent = 'Please choose a star rating.';
  const d = SW.load(), [oid, idx] = rv.key.split('#'), o = d.orders.find(x => x.id === oid && x.custEmail === me); if (!o) return;
  const i = o.items[+idx], comment = $('#rc').value.trim();
  let r = d.reviews.find(x => x.key === rv.key && x.email === me), isNew = !r;
  const data = { rating: rv.rating, comment, pics: [...rv.pics], ts: Date.now() };
  if (r) Object.assign(r, data); else d.reviews.unshift({ id: SW.uid(), key: rv.key, orderId: o.id, stall: o.stall, pid: i.pid, pname: i.name, variant: [i.color, i.size].filter(Boolean).join(' • '), email: me, name: o.custName, ...data });
  SW.notifyOwner(d, o.stall, `⭐ ${o.custName} ${isNew ? 'reviewed' : 'updated a review for'} ${i.name}: ${SW.stars(rv.rating)}`);
  SW.audit(d, o.stall, o.custName, isNew ? 'Review added' : 'Review updated', `${i.name} • ${rv.rating}/5 • ${o.id}`);
  SW.save(d); closeModals(); toast(isNew ? 'Thanks for your review! ⭐' : 'Review updated', 'ok'); vReviews();
}

/* ---------- boot ---------- */
$('#view').innerHTML = '<div class="empty">Loading SkyWorld Shop…</div>';
SW.ready.then(() => {
  SW.load(); guestInit();
  if (!location.hash || /^#\/(auth|register)/.test(location.hash)) location.hash = '#/pick';
  booted = true; route();
}).catch(SW.showError);
// the shared database changed (another browser / the owner portal): refresh what is on screen without wiping forms
function refreshLive() {
  if (!booted || document.querySelector('.overlay')) return;
  const h = location.hash;
  if (/^#\/s\//.test(h)) stallList(+h.split('/')[2]);
  else if (/^#\/(orders|order\/|inbox|reviews)/.test(h)) route();
  else nav();
}
window.addEventListener('storage', e => { if (e.key === 'skyworld_db_v1') refreshLive(); });
window.addEventListener('sw-remote', refreshLive);
