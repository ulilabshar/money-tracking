// ============================================================
//  app.js - DompetKu PWA
//  Stack: Vanilla JS + Supabase JS v2 (ESM CDN)
// ============================================================

// -- 1. SUPABASE CONFIG ---------------------------------------
const SUPABASE_URL      = 'https://opslmnkzfctqvolikhxy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Vnt6JGZrg86G1lANpo676A_bNw3OUyC';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -- 2. THEME TOGGLE ------------------------------------------
const html       = document.documentElement;
const themeBtn   = document.getElementById('theme-toggle');

function applyThemeIcon() {
  themeBtn.textContent = html.classList.contains('dark') ? '☀️' : '🌙';
  themeBtn.title       = html.classList.contains('dark') ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode';
}

themeBtn.addEventListener('click', () => {
  html.classList.toggle('dark');
  localStorage.setItem('dk-theme', html.classList.contains('dark') ? 'dark' : 'light');
  applyThemeIcon();
});

// Set initial icon
applyThemeIcon();

// -- 3. APP STATE ---------------------------------------------
let currentUser     = null;
let allTransactions = [];
let selectedYear    = new Date().getFullYear();
let selectedMonth   = new Date().getMonth() + 1;
let pendingDeleteId = null;

// -- 4. DOM REFS ----------------------------------------------
const loginPage    = document.getElementById('login-page');
const loginForm    = document.getElementById('login-form');
const loginEmailEl = document.getElementById('login-email');
const loginPassEl  = document.getElementById('login-password');
const loginBtn     = document.getElementById('login-btn');
const loginError   = document.getElementById('login-error');
const logoutBtn    = document.getElementById('logout-btn');
const userEmailEl  = document.getElementById('user-email');

const balanceEl      = document.getElementById('balance-amount');
const totalIncomeEl  = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');

const monthLabelEl = document.getElementById('month-label');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const monthlyIncEl = document.getElementById('monthly-income');
const monthlyExpEl = document.getElementById('monthly-expense');
const monthlyBalEl = document.getElementById('monthly-balance');

const txList        = document.getElementById('transaction-list');
const txCountEl     = document.getElementById('tx-count');
const emptyState    = document.getElementById('empty-state');
const form          = document.getElementById('transaction-form');
const txTypeInput   = document.getElementById('tx-type');
const amountInput   = document.getElementById('tx-amount');
const categoryInput = document.getElementById('tx-category');
const dateInput     = document.getElementById('tx-date');
const noteInput     = document.getElementById('tx-note');
const submitBtn     = document.getElementById('submit-btn');
const btnIncome     = document.getElementById('btn-income');
const btnExpense    = document.getElementById('btn-expense');
const toast         = document.getElementById('toast');
const modalOverlay  = document.getElementById('modal-overlay');
const modalCancel   = document.getElementById('modal-cancel');
const modalConfirm  = document.getElementById('modal-confirm');
const pwaInstallBtn = document.getElementById('pwa-install-btn');
const catExpenseGroup = document.getElementById('cat-expense');
const catIncomeGroup  = document.getElementById('cat-income');

// -- 5. UTILS -------------------------------------------------
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(n);

const formatDate = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

const catIcon = {
  'Makanan & Minuman':'🍜','Transportasi':'🚌','Belanja':'🛍️',
  'Kesehatan':'💊','Hiburan':'🎮','Tagihan':'📱','Pendidikan':'📚',
  'Gaji':'💼','Freelance':'💻','Bisnis':'🏪','Investasi':'📈',
  'Hadiah':'🎁','Lainnya':'✨',
};

let toastTimer = null;
function showToast(msg, type = 'success') {
  const cfg = {
    success: { bg:'bg-emerald-500', icon:'✅' },
    error:   { bg:'bg-red-500',     icon:'❌' },
    info:    { bg:'bg-primary-500', icon:'ℹ️' },
  };
  const c = cfg[type] ?? cfg.info;
  toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold flex items-center gap-2.5 max-w-xs backdrop-blur-sm ${c.bg}`;
  toast.innerHTML = `<span>${c.icon}</span><span>${escapeHtml(msg)}</span>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// -- 6. AUTH --------------------------------------------------
function showLogin() {
  loginPage.classList.remove('hidden');
  loginPage.style.display = '';
}

function showApp(user) {
  loginPage.classList.add('hidden');
  loginPage.style.display = 'none';
  userEmailEl.textContent  = user.email;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginBtn.disabled    = true;
  loginBtn.textContent = 'Memuat...';
  loginError.classList.add('hidden');

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email:    loginEmailEl.value.trim(),
      password: loginPassEl.value,
    });

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      let display = 'Login gagal. Coba lagi.';
      if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong'))
        display = 'Email atau password salah.';
      else if (msg.includes('email not confirmed'))
        display = 'Email belum dikonfirmasi. Cek inbox Anda.';
      else if (msg.includes('user not found'))
        display = 'Akun tidak ditemukan di Supabase.';
      else if (msg.includes('network') || msg.includes('fetch'))
        display = 'Tidak ada koneksi internet.';
      else
        display = error.message;

      loginError.textContent = display;
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Login exception:', err);
    loginError.textContent = 'Error: ' + (err.message ?? 'coba lagi.');
    loginError.classList.remove('hidden');
  } finally {
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Masuk';
  }
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  allTransactions = [];
  balanceEl.innerHTML      = '<span class="skeleton h-10 w-44 inline-block rounded-xl"></span>';
  totalIncomeEl.innerHTML  = '<span class="skeleton h-4 w-20 inline-block"></span>';
  totalExpenseEl.innerHTML = '<span class="skeleton h-4 w-20 inline-block"></span>';
});

supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    currentUser = session.user;
    showApp(currentUser);
    updateMonthLabel();
    await loadTransactions();
  } else {
    currentUser = null;
    showLogin();
  }
});

// -- 7. TYPE TOGGLE -------------------------------------------
function setType(type) {
  txTypeInput.value = type;

  if (type === 'income') {
    btnIncome.classList.add('bg-emerald-500','text-white','shadow-sm','shadow-emerald-500/30');
    btnIncome.classList.remove('text-slate-400','dark:text-slate-500');
    btnExpense.classList.remove('bg-red-500','text-white','shadow-sm','shadow-red-500/30');
    btnExpense.classList.add('text-slate-400','dark:text-slate-500');
    catIncomeGroup.hidden  = false;
    catExpenseGroup.hidden = true;
    categoryInput.value = catIncomeGroup.querySelector('option').value;
  } else {
    btnExpense.classList.add('bg-red-500','text-white','shadow-sm','shadow-red-500/30');
    btnExpense.classList.remove('text-slate-400','dark:text-slate-500');
    btnIncome.classList.remove('bg-emerald-500','text-white','shadow-sm','shadow-emerald-500/30');
    btnIncome.classList.add('text-slate-400','dark:text-slate-500');
    catExpenseGroup.hidden = false;
    catIncomeGroup.hidden  = true;
    categoryInput.value = catExpenseGroup.querySelector('option').value;
  }
}

btnIncome.addEventListener('click', () => setType('income'));
btnExpense.addEventListener('click', () => setType('expense'));
setType('income');
dateInput.value = new Date().toISOString().split('T')[0];

// -- 8. MONTH NAVIGATION --------------------------------------
function updateMonthLabel() {
  monthLabelEl.textContent = `${MONTHS_ID[selectedMonth - 1]} ${selectedYear}`;
  renderFiltered();
}

prevMonthBtn.addEventListener('click', () => {
  selectedMonth--;
  if (selectedMonth < 1) { selectedMonth = 12; selectedYear--; }
  updateMonthLabel();
});
nextMonthBtn.addEventListener('click', () => {
  selectedMonth++;
  if (selectedMonth > 12) { selectedMonth = 1; selectedYear++; }
  updateMonthLabel();
});

// -- 9. LOAD TRANSACTIONS -------------------------------------
async function loadTransactions() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date',       { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    allTransactions = data || [];
    renderSummaryAll(allTransactions);
    renderFiltered();
  } catch (err) {
    console.error('Load error:', err);
    showToast('Gagal memuat data. Cek Supabase.', 'error');
    txList.innerHTML = '';
    emptyState.classList.remove('hidden');
  }
}

function renderSummaryAll(rows) {
  const inc = rows.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0);
  const exp = rows.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0);
  const bal = inc - exp;
  balanceEl.textContent      = formatRupiah(bal);
  balanceEl.className        = `text-4xl font-black tracking-tight ${bal < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`;
  totalIncomeEl.textContent  = formatRupiah(inc);
  totalExpenseEl.textContent = formatRupiah(exp);
}

function renderFiltered() {
  const rows = allTransactions.filter(r => {
    const d = new Date(r.date + 'T00:00:00');
    return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
  });
  renderMonthlySummary(rows);
  renderList(rows);
}

function renderMonthlySummary(rows) {
  const inc = rows.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0);
  const exp = rows.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0);
  const bal = inc - exp;
  monthlyIncEl.textContent = formatRupiah(inc);
  monthlyExpEl.textContent = formatRupiah(exp);
  monthlyBalEl.textContent = formatRupiah(bal);
  monthlyBalEl.className   = `font-extrabold text-xs leading-tight ${bal < 0 ? 'text-red-500 dark:text-red-400' : 'text-primary-700 dark:text-primary-300'}`;
}

function renderList(rows) {
  txList.innerHTML = '';

  if (!rows || rows.length === 0) {
    emptyState.classList.remove('hidden');
    txCountEl.textContent = '0 transaksi';
    return;
  }

  emptyState.classList.add('hidden');
  txCountEl.textContent = `${rows.length} transaksi`;

  rows.forEach((tx, i) => {
    const isIncome = tx.type === 'income';
    const li = document.createElement('li');
    li.className = 'px-5 py-4 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 fade-in group cursor-default';
    li.style.animationDelay = `${i * 35}ms`;
    li.innerHTML = `
      <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl
                  ${isIncome ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'bg-red-50 dark:bg-red-950/50'}">
        ${catIcon[tx.category] ?? '💸'}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-slate-800 dark:text-slate-100 font-bold text-sm truncate">${escapeHtml(tx.category)}</p>
        <div class="flex items-center gap-1.5 mt-0.5">
          <span class="text-slate-400 dark:text-slate-500 text-xs">${formatDate(tx.date)}</span>
          ${tx.note ? `<span class="text-slate-300 dark:text-slate-600 text-xs">·</span><span class="text-slate-400 dark:text-slate-500 text-xs truncate max-w-[90px]">${escapeHtml(tx.note)}</span>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="font-extrabold text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
          ${isIncome ? '+' : '-'}${formatRupiah(tx.amount)}
        </span>
        <button data-id="${tx.id}"
          class="delete-btn opacity-0 group-hover:opacity-100 focus:opacity-100
                 w-7 h-7 rounded-xl text-xs transition-all
                 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500
                 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-500 dark:hover:text-red-400
                 flex items-center justify-center"
          title="Hapus">🗑</button>
      </div>`;
    txList.appendChild(li);
  });

  txList.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id))
  );
}

// -- 10. ADD TRANSACTION --------------------------------------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount   = parseFloat(amountInput.value);
  const type     = txTypeInput.value;
  const category = categoryInput.value;
  const date     = dateInput.value;
  const note     = noteInput.value.trim();

  if (!amount || amount <= 0) { showToast('Nominal harus lebih dari 0', 'error'); amountInput.focus(); return; }
  if (!date)                  { showToast('Pilih tanggal transaksi', 'error'); return; }

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Menyimpan...';

  try {
    const { error } = await supabase.from('transactions').insert([
      { type, amount, category, date, note: note || null, user_id: currentUser.id }
    ]);
    if (error) throw error;

    const txDate  = new Date(date + 'T00:00:00');
    selectedYear  = txDate.getFullYear();
    selectedMonth = txDate.getMonth() + 1;

    showToast('Transaksi berhasil disimpan! 🎉', 'success');
    form.reset();
    setType('income');
    dateInput.value = new Date().toISOString().split('T')[0];
    await loadTransactions();
    updateMonthLabel();
  } catch (err) {
    console.error('Insert error:', err);
    showToast('Gagal menyimpan: ' + (err.message ?? ''), 'error');
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Simpan Transaksi';
  }
});

// -- 11. DELETE TRANSACTION -----------------------------------
function confirmDelete(id) {
  pendingDeleteId = id;
  modalOverlay.classList.remove('hidden');
}

modalCancel.addEventListener('click', () => {
  pendingDeleteId = null;
  modalOverlay.classList.add('hidden');
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) { pendingDeleteId = null; modalOverlay.classList.add('hidden'); }
});

modalConfirm.addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  modalOverlay.classList.add('hidden');
  modalConfirm.disabled = true;
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', pendingDeleteId);
    if (error) throw error;
    showToast('Transaksi dihapus', 'info');
    await loadTransactions();
  } catch (err) {
    showToast('Gagal menghapus transaksi', 'error');
  } finally {
    pendingDeleteId = null;
    modalConfirm.disabled = false;
  }
});

// -- 12. PWA --------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try { await navigator.serviceWorker.register('/sw.js'); }
    catch (err) { console.warn('[SW] Failed:', err); }
  });
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e;
  pwaInstallBtn.classList.remove('hidden');
});
pwaInstallBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') { showToast('DompetKu berhasil diinstall! 🎉', 'success'); pwaInstallBtn.classList.add('hidden'); }
  deferredPrompt = null;
});
window.addEventListener('appinstalled', () => { pwaInstallBtn.classList.add('hidden'); deferredPrompt = null; });

// -- 13. INIT -------------------------------------------------
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    showApp(currentUser);
    updateMonthLabel();
    await loadTransactions();
  } else {
    showLogin();
  }
})();