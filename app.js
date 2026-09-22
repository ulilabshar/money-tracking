// ============================================================
//  app.js - DompetKu PWA
// ============================================================

const SUPABASE_URL      = 'https://opslmnkzfctqvolikhxy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Vnt6JGZrg86G1lANpo676A_bNw3OUyC';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── THEME TOGGLE ─────────────────────────────────────────────
const html     = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');
function applyThemeIcon() {
  themeBtn.textContent = html.classList.contains('dark') ? '☀️' : '🌙';
  themeBtn.title       = html.classList.contains('dark') ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode';
}
themeBtn.addEventListener('click', () => {
  html.classList.toggle('dark');
  localStorage.setItem('dk-theme', html.classList.contains('dark') ? 'dark' : 'light');
  applyThemeIcon();
});
applyThemeIcon();

// ── APP STATE ─────────────────────────────────────────────────
let currentUser     = null;
let allTransactions = [];
let selectedYear    = new Date().getFullYear();
let selectedMonth   = new Date().getMonth() + 1;
let pendingDeleteId = null;

// ── DOM REFS ──────────────────────────────────────────────────
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

// Edit modal refs
const editModalOverlay = document.getElementById('edit-modal-overlay');
const editForm         = document.getElementById('edit-form');
const editTxId         = document.getElementById('edit-tx-id');
const editTxType       = document.getElementById('edit-tx-type');
const editTxAmount     = document.getElementById('edit-tx-amount');
const editTxCategory   = document.getElementById('edit-tx-category');
const editTxDate       = document.getElementById('edit-tx-date');
const editTxNote       = document.getElementById('edit-tx-note');
const editBtnIncome    = document.getElementById('edit-btn-income');
const editBtnExpense   = document.getElementById('edit-btn-expense');
const editCancelBtn    = document.getElementById('edit-cancel-btn');
const editModalClose   = document.getElementById('edit-modal-close');
const editSaveBtn      = document.getElementById('edit-save-btn');

// ── CATEGORY DATA ─────────────────────────────────────────────
const INCOME_CATS = [
  { val:'Gaji',      label:'💼 Gaji' },
  { val:'Freelance', label:'💻 Freelance' },
  { val:'Bisnis',    label:'🏪 Bisnis' },
  { val:'Investasi', label:'📈 Investasi' },
  { val:'Hadiah',    label:'🎁 Hadiah' },
  { val:'Lainnya',   label:'✨ Lainnya' },
];
const EXPENSE_CATS = [
  { val:'Makanan & Minuman', label:'🍜 Makanan' },
  { val:'Transportasi',      label:'🚌 Transportasi' },
  { val:'Belanja',           label:'🛍️ Belanja' },
  { val:'Kesehatan',         label:'💊 Kesehatan' },
  { val:'Hiburan',           label:'🎮 Hiburan' },
  { val:'Tagihan',           label:'📱 Tagihan' },
  { val:'Pendidikan',        label:'📚 Pendidikan' },
  { val:'Lainnya',           label:'✨ Lainnya' },
];

// Rebuild <select> options – works on all mobile browsers
function buildOptions(selectEl, cats, selectedVal = null) {
  selectEl.innerHTML = '';
  cats.forEach(({ val, label }) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    if (selectedVal && selectedVal === val) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

// ── UTILS ─────────────────────────────────────────────────────
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];

// Numbers only — no "Rp" prefix
const formatNumber = (n) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);

const formatDate = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });

const formatDateHeader = (s) => {
  const d   = new Date(s + 'T00:00:00');
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())       return 'Hari Ini';
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
};

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
    success:{ bg:'bg-emerald-500', icon:'✅' },
    error:  { bg:'bg-red-500',     icon:'❌' },
    info:   { bg:'bg-primary-500', icon:'ℹ️' },
  };
  const c = cfg[type] ?? cfg.info;
  toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold flex items-center gap-2.5 max-w-xs ${c.bg}`;
  toast.innerHTML = `<span>${c.icon}</span><span>${escapeHtml(msg)}</span>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ── AUTH ──────────────────────────────────────────────────────
function showLogin() {
  loginPage.classList.remove('hidden');
  loginPage.style.display = '';
}
function showApp(user) {
  loginPage.classList.add('hidden');
  loginPage.style.display = 'none';
  userEmailEl.textContent = user.email;
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
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) display = 'Email atau password salah.';
      else if (msg.includes('email not confirmed')) display = 'Email belum dikonfirmasi.';
      else if (msg.includes('user not found')) display = 'Akun tidak ditemukan di Supabase.';
      else display = error.message;
      loginError.textContent = display;
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    loginError.textContent = 'Error: ' + (err.message ?? 'coba lagi.');
    loginError.classList.remove('hidden');
  } finally {
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Masuk';
  }
});

// Demo account auto-fill & login
document.getElementById('demo-login-btn').addEventListener('click', () => {
  loginEmailEl.value = 'admin@test.com';
  loginPassEl.value  = '12345678';
  loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
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

// ── TYPE TOGGLE (Add Form) ────────────────────────────────────
function setType(type) {
  txTypeInput.value = type;
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  buildOptions(categoryInput, cats); // rebuild options for this type
  if (type === 'income') {
    btnIncome.classList.add('bg-emerald-500','text-white','shadow-sm');
    btnIncome.classList.remove('text-slate-400','dark:text-zinc-500');
    btnExpense.classList.remove('bg-red-500','text-white','shadow-sm');
    btnExpense.classList.add('text-slate-400','dark:text-zinc-500');
  } else {
    btnExpense.classList.add('bg-red-500','text-white','shadow-sm');
    btnExpense.classList.remove('text-slate-400','dark:text-zinc-500');
    btnIncome.classList.remove('bg-emerald-500','text-white','shadow-sm');
    btnIncome.classList.add('text-slate-400','dark:text-zinc-500');
  }
}
btnIncome.addEventListener('click', () => setType('income'));
btnExpense.addEventListener('click', () => setType('expense'));
setType('expense'); // default
dateInput.value = new Date().toISOString().split('T')[0];

// ── TYPE TOGGLE (Edit Modal) ──────────────────────────────────
function setEditType(type, selectedCat = null) {
  editTxType.value = type;
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  buildOptions(editTxCategory, cats, selectedCat); // rebuild & select
  if (type === 'income') {
    editBtnIncome.classList.add('bg-emerald-500','text-white','shadow-sm');
    editBtnIncome.classList.remove('text-slate-400','dark:text-zinc-500');
    editBtnExpense.classList.remove('bg-red-500','text-white','shadow-sm');
    editBtnExpense.classList.add('text-slate-400','dark:text-zinc-500');
  } else {
    editBtnExpense.classList.add('bg-red-500','text-white','shadow-sm');
    editBtnExpense.classList.remove('text-slate-400','dark:text-zinc-500');
    editBtnIncome.classList.remove('bg-emerald-500','text-white','shadow-sm');
    editBtnIncome.classList.add('text-slate-400','dark:text-zinc-500');
  }
}
// When toggling type in edit modal, keep current category if it exists in new list
editBtnIncome.addEventListener('click', () => {
  setEditType('income');
});
editBtnExpense.addEventListener('click', () => {
  setEditType('expense');
});

function openEditModal(id) {
  const tx = allTransactions.find(t => t.id === id);
  if (!tx) return;
  editTxId.value     = tx.id;
  editTxAmount.value = tx.amount;
  editTxDate.value   = tx.date;
  editTxNote.value   = tx.note ?? '';
  setEditType(tx.type, tx.category); // pass category to pre-select correctly
  editModalOverlay.classList.remove('hidden');
}

function closeEditModal() {
  editModalOverlay.classList.add('hidden');
}
editCancelBtn.addEventListener('click', closeEditModal);
editModalClose.addEventListener('click', closeEditModal);
editModalOverlay.addEventListener('click', (e) => {
  if (e.target === editModalOverlay) closeEditModal();
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id       = editTxId.value;
  const amount   = parseFloat(editTxAmount.value);
  const type     = editTxType.value;
  const category = editTxCategory.value;
  const date     = editTxDate.value;
  const note     = editTxNote.value.trim();

  if (!amount || amount <= 0) { showToast('Nominal harus lebih dari 0', 'error'); editTxAmount.focus(); return; }
  if (!date)                  { showToast('Pilih tanggal transaksi', 'error'); return; }

  editSaveBtn.disabled    = true;
  editSaveBtn.textContent = 'Menyimpan...';
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ type, amount, category, date, note: note || null })
      .eq('id', id);
    if (error) throw error;

    const txDate  = new Date(date + 'T00:00:00');
    selectedYear  = txDate.getFullYear();
    selectedMonth = txDate.getMonth() + 1;

    showToast('Transaksi diperbarui! ✨', 'success');
    closeEditModal();
    await loadTransactions();
    updateMonthLabel();
  } catch (err) {
    showToast('Gagal menyimpan: ' + (err.message ?? ''), 'error');
  } finally {
    editSaveBtn.disabled    = false;
    editSaveBtn.textContent = 'Simpan';
  }
});

// ── MONTH NAVIGATION ──────────────────────────────────────────
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

// ── LOAD & RENDER ─────────────────────────────────────────────
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
    showToast('Gagal memuat data.', 'error');
    txList.innerHTML = '';
    emptyState.classList.remove('hidden');
  }
}

function renderSummaryAll(rows) {
  const inc = rows.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0);
  const exp = rows.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0);
  const bal = inc - exp;
  balanceEl.textContent      = formatNumber(bal);
  balanceEl.className        = `text-4xl font-black tracking-tight ${bal < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`;
  totalIncomeEl.textContent  = formatNumber(inc);
  totalExpenseEl.textContent = formatNumber(exp);
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
  monthlyIncEl.textContent = formatNumber(inc);
  monthlyExpEl.textContent = formatNumber(exp);
  monthlyBalEl.textContent = formatNumber(bal);
  monthlyBalEl.className   = `font-extrabold text-xs leading-tight ${bal < 0 ? 'text-red-500 dark:text-red-400' : 'text-primary-700 dark:text-primary-300'}`;
}

// ── RENDER LIST (daily grouping) ──────────────────────────────
function renderList(rows) {
  txList.innerHTML = '';
  if (!rows || rows.length === 0) {
    emptyState.classList.remove('hidden');
    txCountEl.textContent = '0 transaksi';
    return;
  }
  emptyState.classList.add('hidden');
  txCountEl.textContent = `${rows.length} transaksi`;

  const groups = {};
  const dateOrder = [];
  rows.forEach(tx => {
    if (!groups[tx.date]) { groups[tx.date] = []; dateOrder.push(tx.date); }
    groups[tx.date].push(tx);
  });

  dateOrder.forEach(date => {
    const dayRows = groups[date];
    const dayInc  = dayRows.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0);
    const dayExp  = dayRows.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0);
    const dayBal  = dayInc - dayExp;

    // Date header
    const header = document.createElement('li');
    header.className = 'px-4 py-2.5 flex items-center justify-between sticky top-0 z-10 ' +
                       'bg-slate-50 dark:bg-zinc-900 ' +
                       'border-t border-slate-100 dark:border-zinc-800 first:border-t-0';
    header.innerHTML = `
      <p class="text-slate-500 dark:text-zinc-400 font-bold text-xs capitalize">${escapeHtml(formatDateHeader(date))}</p>
      <div class="flex items-center gap-2">
        ${dayInc > 0 ? `<span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">+${formatNumber(dayInc)}</span>` : ''}
        ${dayExp > 0 ? `<span class="text-xs font-bold text-red-500 dark:text-red-400">−${formatNumber(dayExp)}</span>` : ''}
        <span class="text-xs font-extrabold ${dayBal >= 0 ? 'text-slate-400 dark:text-zinc-500' : 'text-red-400 dark:text-red-500'}">
          = ${formatNumber(dayBal)}
        </span>
      </div>`;
    txList.appendChild(header);

    dayRows.forEach((tx, i) => {
      const isIncome = tx.type === 'income';
      const li = document.createElement('li');
      li.className = 'px-5 py-3.5 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-zinc-900/50 fade-in group cursor-default';
      li.style.animationDelay = `${i * 30}ms`;
      li.innerHTML = `
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg
                    ${isIncome ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'bg-red-50 dark:bg-red-950/50'}">
          ${catIcon[tx.category] ?? '💸'}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-slate-800 dark:text-zinc-100 font-bold text-sm truncate">${escapeHtml(tx.category)}</p>
          ${tx.note ? `<p class="text-slate-400 dark:text-zinc-500 text-xs mt-0.5 truncate">${escapeHtml(tx.note)}</p>` : ''}
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <span class="font-extrabold text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
            ${isIncome ? '+' : '−'}${formatNumber(tx.amount)}
          </span>
          <button data-id="${tx.id}"
            class="edit-btn opacity-0 group-hover:opacity-100 focus:opacity-100
                   w-7 h-7 rounded-xl text-xs transition-all
                   bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500
                   hover:bg-primary-100 dark:hover:bg-primary-950/50 hover:text-primary-500
                   flex items-center justify-center" title="Edit">✏️</button>
          <button data-id="${tx.id}"
            class="delete-btn opacity-0 group-hover:opacity-100 focus:opacity-100
                   w-7 h-7 rounded-xl text-xs transition-all
                   bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500
                   hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-500
                   flex items-center justify-center" title="Hapus">🗑</button>
        </div>`;
      txList.appendChild(li);
    });
  });

  txList.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', () => openEditModal(btn.dataset.id))
  );
  txList.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id))
  );
}

// ── ADD TRANSACTION ───────────────────────────────────────────
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
    showToast('Gagal menyimpan: ' + (err.message ?? ''), 'error');
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Simpan Transaksi';
  }
});

// ── DELETE ────────────────────────────────────────────────────
function confirmDelete(id) { pendingDeleteId = id; modalOverlay.classList.remove('hidden'); }
modalCancel.addEventListener('click', () => { pendingDeleteId = null; modalOverlay.classList.add('hidden'); });
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
  } catch { showToast('Gagal menghapus', 'error'); }
  finally { pendingDeleteId = null; modalConfirm.disabled = false; }
});

// ── PWA ───────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try { await navigator.serviceWorker.register('/sw.js'); } catch {}
  });
}
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e; pwaInstallBtn.classList.remove('hidden');
});
pwaInstallBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') { showToast('DompetKu berhasil diinstall! 🎉', 'success'); pwaInstallBtn.classList.add('hidden'); }
  deferredPrompt = null;
});
window.addEventListener('appinstalled', () => { pwaInstallBtn.classList.add('hidden'); deferredPrompt = null; });

// ── INIT ──────────────────────────────────────────────────────
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