# DompetKu PWA

Aplikasi pencatat keuangan (Expense & Income Tracker) berbasis PWA.

## Tech Stack
- HTML5 + Tailwind CSS (CDN)
- Vanilla JavaScript (ES Modules)
- Supabase (backend/database)
- Vercel (hosting)

## Setup

### 1. Konfigurasi Supabase
Buka `app.js` dan ganti:
```js
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 2. Buat Tabel di Supabase
Jalankan SQL ini di Supabase SQL Editor:
```sql
create table transactions (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('income', 'expense')),
  amount     numeric(15,2) not null check (amount > 0),
  category   text not null,
  date       date not null,
  note       text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS) — untuk production tambahkan auth
alter table transactions enable row level security;

-- Policy sementara (semua bisa baca/tulis — ganti dengan auth di production)
create policy "public access" on transactions for all using (true) with check (true);
```

### 3. Deploy ke Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

Atau drag & drop folder ini ke https://vercel.com/new

## File Structure
```
/
├── index.html      # Halaman utama PWA
├── app.js          # Logic JS + Supabase integration
├── sw.js           # Service Worker
├── manifest.json   # PWA Manifest
├── vercel.json     # Vercel config
└── icons/          # App icons (tambahkan icon-192.png & icon-512.png)
```
