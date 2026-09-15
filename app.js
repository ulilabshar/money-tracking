// ============================================================
//  app.js — DompetKu PWA
//  Stack: Vanilla JS + Supabase JS v2 (ESM CDN)
// ============================================================

// ── 1. SUPABASE CONFIGURATION ────────────────────────────────
// Ganti dua nilai di bawah ini dengan kredensial dari dashboard Supabase Anda.
// Settings > API > Project URL & anon public key
const SUPABASE_URL      = 'https://opslmnkzfctqvolikhxy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Vnt6JGZrg86G1lANpo676A_bNw3OUyC';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── 2. DOM REFERENCES ─────────────────────────────────────────
const balanceEl      = document.getElementById('balance-amount');
const totalIncomeEl  = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const txList         = document.getElementById('transaction-list');
const txCountEl      = document.getElementById('tx-count');
const emptyState     = document.getElementById('empty-state');
const form           = document.getElementById('transaction-form');
const txTypeInput    = document.getElementById('tx-type');
const amountInput    = document.getElementById('tx-amount');
const categoryInput  = document.getElementById('tx-category');
const dateInput      = document.getElementById('tx-date');
const noteInput      = document.getElementById('tx-note');
const submitBtn      = document.getElementById('submit-btn');
const btnIncome      = document.getElementById('btn-income');
const btnExpense     = document.getElementById('btn-expense');
const toast          = document.getElementById('toast');
const modalOverlay   = document.getElementById('modal-overlay');
const modalCancel    = document.getElementById('modal-cancel');
const modalConfirm   = document.getElementById('modal-confirm');
const pwaInstallBtn  = document.getElementById('pwa-install-btn');

// ── 3. UTILS ──────────────────────────────────────────────────
const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

let toastTimer = null;
function showToast(msg, type = 'success') {
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-primary-500' };
  const icons  = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className = toast.className.replace(/bg-\S+/g, '');
  toast.classList.add(colors[type] ?? 'bg-primary-500');
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
    toast.classList.remove('opacity-100');
  }, 3000);
}

// Category emoji map
const categoryIcon = {
  'Makanan & Minuman': '🍜', 'Transportasi': '🚌', 'Belanja': '🛍️',
  'Kesehatan': '💊', 'Hiburan': '🎮', 'Tagihan': '📱', 'Pendidikan': '📚',
  'Gaji': '💼', 'Freelance': '💻', 'Bisnis': '🏪', 'Investasi': '📈',
  'Hadiah': '🎁', 'Lainnya': '✨',
};

// ── 4. TYPE TOGGLE ────────────────────────────────────────────
function setType(type) {
  txTypeInput.value = type;
  if (type === 'income') {
    btnIncome.classList.add('bg-income', 'text-white', 'shadow-sm');
    btnIncome.classList.remove('text-slate-500');
    btnExpense.classList.remove('bg-expense', 'text-white', 'shadow-sm');
    btnExpense.classList.add('text-slate-500');
  } else {
    btnExpense.classList.add('bg-expense', 'text-white', 'shadow-sm');
    btnExpense.classList.remove('text-slate-500');
    btnIncome.classList.remove('bg-income', 'text-white', 'shadow-sm');
    btnIncome.classList.add('text-slate-500');
  }
}

btnIncome.addEventListener('click', () => setType('income'));
btnExpense.addEventListener('click', () => setType('expense'));

// Set today's date as default
dateInput.value = new Date().toISOString().split('T')[0];

// ── 5. FETCH & RENDER ALL TRANSACTIONS ────────────────────────
async function loadTransactions() {
  try {
    const { data: rows, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    renderSummary(rows);
    renderList(rows);
  } catch (err) {
    console.error('Load error:', err);
    showToast('Gagal memuat data. Cek koneksi & konfigurasi Supabase.', 'error');
    txList.innerHTML = '';
    emptyState.classList.remove('hidden');
  }
}

function renderSummary(rows) {
  const totalIncome  = rows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0);
  const totalExpense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0);
  const balance      = totalIncome - totalExpense;

  balanceEl.textContent      = formatRupiah(balance);
  totalIncomeEl.textContent  = formatRupiah(totalIncome);
  totalExpenseEl.textContent = formatRupiah(totalExpense);

  // Color balance
  balanceEl.className = 'text-3xl font-extrabold mt-1 tracking-tight';
  if (balance < 0) balanceEl.classList.add('text-red-200');
  else balanceEl.classList.add('text-white');
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

  rows.forEach((tx, index) => {
    const isIncome = tx.type === 'income';
    const li = document.createElement('li');
    li.className = 'px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 fade-in group';
    li.style.animationDelay = `${index * 40}ms`;
    li.innerHTML = `
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg
                  ${isIncome ? 'bg-income/10' : 'bg-expense/10'}">
        ${categoryIcon[tx.category] ?? '💸'}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-slate-800 font-semibold text-sm truncate">
          ${escapeHtml(tx.category)}
        </p>
        <p class="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
          <span>${formatDate(tx.date)}</span>
          ${tx.note ? `<span class="text-slate-300">·</span><span class="truncate max-w-[120px]">${escapeHtml(tx.note)}</span>` : ''}
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="font-bold text-sm ${isIncome ? 'text-income' : 'text-expense'}">
          ${isIncome ? '+' : '-'} ${formatRupiah(tx.amount)}
        </span>
        <button data-id="${tx.id}"
          class="delete-btn opacity-0 group-hover:opacity-100 focus:opacity-100
                 w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500
                 flex items-center justify-center text-xs transition-all" title="Hapus">
          🗑
        </button>
      </div>
    `;
    txList.appendChild(li);
  });

  // Attach delete listeners
  txList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

// ── 6. ADD TRANSACTION ────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const amount   = parseFloat(amountInput.value);
  const type     = txTypeInput.value;
  const category = categoryInput.value;
  const date     = dateInput.value;
  const note     = noteInput.value.trim();

  if (!amount || amount <= 0) {
    showToast('Nominal harus lebih dari 0', 'error');
    amountInput.focus();
    return;
  }
  if (!date) {
    showToast('Pilih tanggal transaksi', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Menyimpan...';

  try {
    const { error } = await supabase.from('transactions').insert([
      { type, amount, category, date, note: note || null }
    ]);

    if (error) throw error;

    showToast('Transaksi berhasil disimpan! 🎉', 'success');
    form.reset();
    setType('income');
    dateInput.value = new Date().toISOString().split('T')[0];
    await loadTransactions();
  } catch (err) {
    console.error('Insert error:', err);
    showToast('Gagal menyimpan. ' + (err.message ?? ''), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Simpan Transaksi';
  }
});

// ── 7. DELETE TRANSACTION ─────────────────────────────────────
let pendingDeleteId = null;

function confirmDelete(id) {
  pendingDeleteId = id;
  modalOverlay.classList.remove('hidden');
}

modalCancel.addEventListener('click', () => {
  pendingDeleteId = null;
  modalOverlay.classList.add('hidden');
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    pendingDeleteId = null;
    modalOverlay.classList.add('hidden');
  }
});

modalConfirm.addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  modalOverlay.classList.add('hidden');
  modalConfirm.disabled = true;

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', pendingDeleteId);

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

// ── 8. PWA: SERVICE WORKER REGISTRATION ──────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Registered:', reg.scope);
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
  });
}

// ── 9. PWA: INSTALL PROMPT ────────────────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  pwaInstallBtn.classList.remove('hidden');
});

pwaInstallBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    showToast('DompetKu berhasil diinstall! 🎉', 'success');
    pwaInstallBtn.classList.add('hidden');
  }
  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
  pwaInstallBtn.classList.add('hidden');
  deferredPrompt = null;
});

// ── 10. INITIALISE ────────────────────────────────────────────
loadTransactions();
