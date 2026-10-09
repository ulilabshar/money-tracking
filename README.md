# 💰 DompetKu — Pencatat Keuangan Pribadi

> Aplikasi PWA modern untuk mencatat pemasukan dan pengeluaran pribadi secara real-time, dengan sinkronisasi cloud via Supabase.

🌐 **Live:** [dompetku-orcin-psi.vercel.app](https://dompetku-orcin-psi.vercel.app)

---

## Fitur Utama

### Autentikasi
- Login dengan email & password via Supabase Auth
- Persistent session (tetap login setelah refresh)
- Auto-redirect ke login saat session habis
- **Akun demo** tersedia: `admin@test.com` / `12345678`
- Tombol "Isi Otomatis & Masuk" untuk login demo satu klik

### Manajemen Transaksi
| Fitur | Detail |
|---|---|
| Tambah transaksi | Input nominal, tipe, kategori, tanggal, catatan |
| Edit transaksi | Modal edit dengan form pre-filled, tombol pencil saat hover |
| Hapus transaksi | Konfirmasi modal sebelum penghapusan permanen |
| Default pengeluaran | Form selalu reset ke mode Pengeluaran setelah submit |
| Desimal | Mendukung input nominal desimal |

### Ringkasan & Statistik
| Komponen | Detail |
|---|---|
| Saldo Keseluruhan | Total semua waktu (pemasukan - pengeluaran) |
| Saldo Bulan Ini | Sisa bulan sebelumnya + net bulan ini (carryover) |
| Ringkasan Bulanan | Pemasukan, pengeluaran, dan saldo per bulan |

### Riwayat Transaksi
- Pengelompokan per hari dengan label "Hari Ini" / "Kemarin" / tanggal lengkap
- Ringkasan harian: total masuk, keluar, dan net per hari
- Navigasi bulan dengan tombol prev/next
- Animasi masuk smooth dengan stagger delay

### Tema
- Light Mode (default) / Dark Mode toggle
- Anti-flash script sebelum first paint
- Preferensi disimpan di localStorage

### PWA
- Installable ke homescreen (Android & iOS)
- Offline support via Service Worker (Network-first, cache fallback)
- Logo icon & manifest lengkap

---

## Arsitektur & Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | Vanilla HTML5, CSS3, JavaScript ES Modules |
| Styling | Tailwind CSS v3 (CDN) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel (static deploy, zero build step) |
| PWA | Native Service Worker + Web App Manifest |

---

## Struktur Proyek

```
money-tracking/
├── index.html       # Single-page app shell
├── app.js           # Seluruh logic aplikasi
├── sw.js            # Service Worker - offline caching
├── manifest.json    # PWA manifest
├── logo.png         # App icon (transparent PNG)
├── vercel.json      # Konfigurasi deploy Vercel
└── README.md        # Dokumentasi ini
```

---

## Database Schema

```sql
CREATE TABLE transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount     NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  category   TEXT NOT NULL,
  date       DATE NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Keamanan (RLS Supabase)

Jalankan di Supabase SQL Editor:

```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE POLICY "owner_select" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "owner_insert" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_update" ON transactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_delete" ON transactions
  FOR DELETE USING (auth.uid() = user_id);
```

> PENTING: Tanpa `owner_update` policy, fitur edit transaksi tidak akan bekerja (silent fail).

---

## Panduan Deployment

```bash
# Clone
git clone https://github.com/ulilabshar/money-tracking.git
cd money-tracking

# Login Vercel
vercel login --github

# Deploy
vercel deploy --prod --yes
```

---

## Changelog

| Versi | Perubahan |
|---|---|
| v1.8 | Code review & bug fixes: double init, security guards, SW v2 |
| v1.7 | Saldo bulan termasuk carryover dari bulan sebelumnya |
| v1.6 | Default & reset form ke Pengeluaran |
| v1.5 | Header dan main digabung - background seamless |
| v1.4 | Akun demo dengan auto-fill di login page |
| v1.3 | Logo transparan PNG, favicon, PWA icon |
| v1.2 | Edit transaksi, pengelompokan harian, ringkasan bulanan |
| v1.1 | Desimal, pill dropdown, hapus prefix Rp |
| v1.0 | Launch: auth, CRUD transaksi, light/dark mode |

---

*DompetKu - Dibuat dengan Supabase + Tailwind CSS + Vercel*
