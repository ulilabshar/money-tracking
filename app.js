// ============================================================
//  app.js - DompetKu PWA
//  Stack: Vanilla JS + Supabase JS v2 (ESM CDN)
// ============================================================

// -- 1. SUPABASE CONFIG ---------------------------------------
const SUPABASE_URL      = 'https://opslmnkzfctqvolikhxy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Vnt6JGZrg86G1lANpo676A_bNw3OUyC';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -- 2. APP STATE ---------------------------------------------
let currentUser     = null;
let allTransactions = [];
let selectedYear    = new Date().getFullYear();
let selectedMonth   = new Date().getMonth() + 1; // 1-12
let pendingDeleteId = null;

// -- 3. DOM REFS ----------------------------------------------
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

const txList      = document.getElementById('transaction-list');
const txCountEl   = document.getElementById('tx-count');
const emptyState  = document.getElementById('empty-state');
const form        = document.getElementById('transaction-form');
const txTypeInput = document.getElementById('tx-type');
const amountInput = document.getElementById('tx-amount');
const categoryInput = document.getElementById('tx-category');
const dateInput   = document.getElementById('tx-date');
const noteInput   = document.getElementById('tx-note');
const submitBtn   = document.getElementById('submit-btn');
const btnIncome   = document.getElementById('btn-income');
const btnExpense  = document.getElementById('btn-expense');
const toast       = document.getElementById('toast');
const modalOverlay  = document.getElementById('modal-overlay');
const modalCancel   = document.getElementById('modal-cancel');
const modalConfirm  = document.getElementById('modal-confirm');
const pwaInstallBtn = document.getElementById('pwa-install-btn');

// -- 4. UTILS -------------------------------------------------
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
  'Gaji':'💼','Freelance':'💻','Bisnis':'🏪','Investasi':'📈','Hadiah':'🎁','Lainnya':'✨'
};

let toastTimer = null;
function showToast(msg, type = 'success') {
  const colors = { success:'bg-emerald-500', error:'bg-red-500', info:'bg-primary-500' };
  const icons  = { success:'✅', error:'❌', info:'ℹ️' };
  toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 max-w-xs ${colors[type]||'bg-primary-500'}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// -- 5. AUTH --------------------------------------------------
function showLogin() {
  loginPage.classList.remove('hidden');
  loginPage.style.display = '';
}

function showApp(user) {
  loginPage.classList.add('hidden');
  loginPage.style.display = 'none';
  userEmailEl.textContent = user.email;
}

// Login submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginBtn.disabled    = true;
  loginBtn.textContent = 'Memuat...';
  loginError.classList.add('hidden');

  const { error } = await supabase.auth.signInWithPassword({
    email:    loginEmailEl.value.trim(),
    password: loginPassEl.value,
  });

  if (error) {
    loginError.textContent = 'Email atau password salah. Coba lagi.';
    loginError.classList.remove('hidden');
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Masuk';
  }
  // success -> onAuthStateChange handles the rest
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  allTransactions = [];
  balanceEl.innerHTML      = '<span class="skeleton h-8 w-36 rounded-lg inline-block"></span>';
  totalIncomeEl.innerHTML  = '<span class="skeleton h-4 w-14 rounded inline-block"></span>';
  totalExpenseEl.innerHTML = '<span class="skeleton h-4 w-20 rounded inline-block"></span>';
});

// Auth state listener - single source of truth
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

// -- 6. TYPE TOGGLE -------------------------------------------
function setType(type) {
  txTypeInput.value = type;
  if (type === 'income') {
    btnIncome.classList.add('bg-income','text-white','shadow-sm');
    btnIncome.classList.remove('text-slate-500');
    btnExpense.classList.remove('bg-expense','text-white','shadow-sm');
    btnExpense.classList.add('text-slate-500');
  } else {
    btnExpense.classList.add('bg-expense','text-white','shadow-sm');
    btnExpense.classList.remove('text-slate-500');
    btnIncome.classList.remove('bg-income','text-white','shadow-sm');
    btnIncome.classList.add('text-slate-500');
  }
}
btnIncome.addEventListener('click', () => setType('income'));
btnExpense.addEventListener('click', () => setType('expense'));
dateInput.value = new Date().toISOString().split('T')[0];

// -- 7. MONTH NAVIGATION --------------------------------------
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

// -- 8. LOAD ALL TRANSACTIONS ---------------------------------
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

// All-time summary (header cards)
function renderSummaryAll(rows) {
  const inc = rows.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0);
  const exp = rows.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0);
  const bal = inc - exp;
  balanceEl.textContent      = formatRupiah(bal);
  balanceEl.className        = `text-3xl font-extrabold mt-1 tracking-tight ${bal < 0 ? 'text-red-200' : 'text-white'}`;
  totalIncomeEl.textContent  = formatRupiah(inc);
  totalExpenseEl.textContent = formatRupiah(exp);
}

// Filter by selected month then render
function renderFiltered() {
  const rows = allTransactions.filter(r => {
    const d = new Date(r.date + 'T00:00:00');
    return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
  });
  renderMonthlySummary(rows);
  renderList(rows);
}

// Monthly summary cards
function renderMonthlySummary(rows) {
  const inc = rows.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0);
  const exp = rows.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0);
  const bal = inc - exp;
  monthlyIncEl.textContent = formatRupiah(inc);
  monthlyExpEl.textContent = formatRupiah(exp);
  monthlyBalEl.textContent = formatRupiah(bal);
  monthlyBalEl.className   = `font-extrabold text-xs leading-tight ${bal < 0 ? 'text-red-600' : 'text-primary-700'}`;
}

// Render transaction list rows
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
    li.className = 'px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 fade-in group';
    li.style.animationDelay = `${i * 40}ms`;
    li.innerHTML = `
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${isIncome ? 'bg-emerald-50' : 'bg-red-50'}">
        ${catIcon[tx.category] ?? '💸'}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-slate-800 font-semibold text-sm truncate">${escapeHtml(tx.category)}</p>
        <p class="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
          <span>${formatDate(tx.date)}</span>
          ${tx.note ? `<span class="text-slate-300">·</span><span class="truncate max-w-[100px]">${escapeHtml(tx.note)}</span>` : ''}
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-red-500'}">
          ${isIncome ? '+' : '-'}${formatRupiah(tx.amount)}
        </span>
        <button data-id="${tx.id}"
          class="delete-btn opacity-0 group-hover:opacity-100 focus:opacity-100 w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center text-xs transition-all"
          title="Hapus">🗑</button>
      </div>`;
    txList.appendChild(li);
  });

  txList.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id))
  );
}

// -- 9. ADD TRANSACTION ---------------------------------------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount   = parseFloat(amountInput.value);
  const type     = txTypeInput.value;
  const category = categoryInput.value;
  const date     = dateInput.value;
  const note     = noteInput.value.trim();

  if (!amount || amount <= 0) { showToast('Nominal harus lebih dari 0', 'error'); amountInput.focus(); return; }
  if (!date) { showToast('Pilih tanggal transaksi', 'error'); return; }

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Menyimpan...';

  try {
    const { error } = await supabase.from('transactions').insert([
      { type, amount, category, date, note: note || null, user_id: currentUser.id }
    ]);
    if (error) throw error;

    // Navigate to the month of the new transaction
    const txDate = new Date(date + 'T00:00:00');
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

// -- 10. DELETE TRANSACTION -----------------------------------
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
    console.error('Delete error:', err);
    showToast('Gagal menghapus transaksi', 'error');
  } finally {
    pendingDeleteId = null;
    modalConfirm.disabled = false;
  }
});

// -- 11. PWA --------------------------------------------------
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

// -- 12. INIT: check session on load --------------------------
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