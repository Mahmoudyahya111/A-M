/* =========================================================
   TELEGANT — shared commerce logic (client-side / localStorage demo)
   No backend: order counts, accounts and tracking only persist on
   this browser/device. Swap the *_KEY read/writes below for real
   API calls whenever a backend is ready.
   ========================================================= */
window.TelegantShop = (function () {
  const CART_KEY   = 'telegant-cart';
  const ORDERS_KEY = 'telegant-orders';
  const COUNTS_KEY = 'telegant-order-counts';
  const USERS_KEY  = 'telegant-users';
  const SESSION_KEY= 'telegant-current-user';

  const EXPRESS_FEE = 100;       // EGP surcharge for next-day shipping
  const MIN_LEAD_DAYS = 2;       // standard delivery: earliest is order date + 2
  const DAILY_CAP = 5;           // a day is dimmed once it already has more than this many orders

  // Standard mock-neck sizing (cm). "custom" is filled in by the shopper.
  const SIZE_CHART = {
    s:   { label: 'S',   length: 66, chest: 48, shoulder: 43 },
    m:   { label: 'M',   length: 68, chest: 51, shoulder: 45 },
    l:   { label: 'L',   length: 70, chest: 54, shoulder: 47 },
    xl:  { label: 'XL',  length: 72, chest: 57, shoulder: 49 },
    xxl: { label: 'XXL', length: 74, chest: 60, shoulder: 51 }
  };

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (e) { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  function fmtDate(d) {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  /* ---------------- Cart ---------------- */
  const Cart = {
    all() { return read(CART_KEY, []); },
    save(items) { write(CART_KEY, items); Cart.renderBadge(); },
    add(item) {
      const items = Cart.all();
      items.push(item);
      Cart.save(items);
    },
    removeAt(index) {
      const items = Cart.all();
      items.splice(index, 1);
      Cart.save(items);
    },
    setQty(index, qty) {
      const items = Cart.all();
      if (items[index]) items[index].qty = Math.max(1, qty);
      Cart.save(items);
    },
    clear() { Cart.save([]); },
    subtotal() {
      return Cart.all().reduce((sum, it) => sum + it.price * it.qty, 0);
    },
    count() {
      return Cart.all().reduce((n, it) => n + it.qty, 0);
    },
    renderBadge() {
      const n = Cart.count();
      document.querySelectorAll('#cart-count').forEach(el => {
        el.textContent = n;
        el.style.display = n > 0 ? 'flex' : 'none';
      });
    }
  };

  /* ---------------- Order counts / delivery dates ---------------- */
  const Delivery = {
    getCounts() { return read(COUNTS_KEY, {}); },
    increment(dateStr) {
      const counts = Delivery.getCounts();
      counts[dateStr] = (counts[dateStr] || 0) + 1;
      write(COUNTS_KEY, counts);
    },
    // Returns candidate standard delivery dates starting MIN_LEAD_DAYS out.
    // Each entry: { date, label, count, full }
    candidates(daysToShow = 10) {
      const counts = Delivery.getCounts();
      const out = [];
      const today = new Date();
      for (let i = MIN_LEAD_DAYS; out.length < daysToShow && i < MIN_LEAD_DAYS + 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const key = fmtDate(d);
        const count = counts[key] || 0;
        out.push({
          date: key,
          label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
          count,
          full: count > DAILY_CAP
        });
      }
      return out;
    },
    expressDate() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return fmtDate(d);
    },
    EXPRESS_FEE, MIN_LEAD_DAYS, DAILY_CAP
  };

  /* ---------------- Orders ---------------- */
  const Orders = {
    all() { return read(ORDERS_KEY, []); },
    place(order) {
      const orders = Orders.all();
      order.id = 'TLG-' + Date.now().toString(36).toUpperCase();
      order.placedAt = new Date().toISOString();
      order.status = 'placed';
      orders.push(order);
      write(ORDERS_KEY, orders);
      Delivery.increment(order.deliveryDate);
      Cart.clear();
      return order;
    },
    findById(id) { return Orders.all().find(o => o.id === id.trim().toUpperCase()); },
    findByEmail(email) {
      return Orders.all().filter(o => (o.customer?.email || '').toLowerCase() === email.trim().toLowerCase());
    },
    // Simulated progress: 5 stages spread between placedAt and deliveryDate.
    stage(order) {
      const stages = ['placed', 'confirmed', 'production', 'shipped', 'delivered'];
      const placed = new Date(order.placedAt).getTime();
      const due = new Date(order.deliveryDate + 'T18:00:00').getTime();
      const now = Date.now();
      if (now >= due) return stages.length - 1;
      const pct = Math.max(0, Math.min(1, (now - placed) / (due - placed)));
      return Math.min(stages.length - 2, Math.floor(pct * (stages.length - 1)));
    },
    STAGES: ['placed', 'confirmed', 'production', 'shipped', 'delivered']
  };

  /* ---------------- Users (demo only — do not use this pattern for real auth) ---------------- */
  const Users = {
    all() { return read(USERS_KEY, []); },
    signUp(user) {
      const users = Users.all();
      if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        return { ok: false, error: 'exists' };
      }
      users.push(user);
      write(USERS_KEY, users);
      write(SESSION_KEY, { name: user.name, email: user.email });
      return { ok: true };
    },
    signIn(email, password) {
      const user = Users.all().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!user) return { ok: false, error: 'invalid' };
      write(SESSION_KEY, { name: user.name, email: user.email });
      return { ok: true };
    },
    current() { return read(SESSION_KEY, null); },
    signOut() { localStorage.removeItem(SESSION_KEY); }
  };

  return { Cart, Delivery, Orders, Users, SIZE_CHART, fmtDate };
})();

document.addEventListener('DOMContentLoaded', () => window.TelegantShop.Cart.renderBadge());
