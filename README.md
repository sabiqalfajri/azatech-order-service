# Fullstack Order Service

Aplikasi layanan pemesanan untuk toko online yang dikembangkan sebagai bagian dari Technical Test Fullstack Developer PT Laksmada Aza Simetri (Azatech).

Aplikasi ini menyediakan pengelolaan produk, pelanggan, dan pesanan, termasuk proses pembayaran, pembatalan pesanan, serta pengelolaan stok.

## Teknologi

### Backend
- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Drizzle ORM
- JWT Authentication

### Frontend
- Next.js
- React
- TypeScript

### Infrastructure & Testing
- Docker & Docker Compose
- Vitest
- Fastify Inject (HTTP integration testing)

## Fitur

- Login admin dengan JWT; semua endpoint selain login memerlukan token.
- Produk: daftar dengan pagination dan pencarian nama/kode, tambah, dan ubah.
- Pelanggan: daftar dan tambah.
- Order: satu atau lebih produk; harga, subtotal, diskon, dan total dihitung di server.
- Diskon bertingkat (Varian A) dengan batas maksimal; angka order tidak berubah walau harga produk diubah kemudian.
- Status order PENDING, PAID, dan CANCELLED; transisi tidak valid ditolak dengan 409.
- Stok berkurang saat order dibuat dan dikembalikan saat order dibatalkan, tanpa risiko stok minus pada order bersamaan.
- Riwayat order dengan filter status dan rentang tanggal, serta detail order beserta item.

## Struktur Repository

```
.
├── backend/              # REST API (Fastify + Drizzle)
├── frontend/             # Next.js
├── docker-compose.yaml
├── README.md
├── DECISIONS.md
└── AI_USAGE.md
```

## Persyaratan

Pastikan perangkat sudah memiliki:
- Git
- Docker dan Docker Compose
- Node.js dan npm

## Menjalankan Aplikasi

### 1. Clone Repository

```bash
git clone https://github.com/sabiqalfajri/azatech-order-service.git
cd azatech-order-service
```

### 2. Konfigurasi Environment

Salin file environment untuk backend:

```bash
cp backend/.env.example backend/.env
```

Sesuaikan konfigurasi `DATABASE_URL` dengan konfigurasi PostgreSQL pada `docker-compose.yaml`.

### 3. Jalankan PostgreSQL

```bash
docker compose up -d
```

Docker Compose hanya digunakan untuk menjalankan PostgreSQL. Backend dan frontend dijalankan secara lokal.

### 4. Install Dependencies

Backend:

```bash
cd backend
npm install
```

Frontend, dari root repository:

```bash
cd frontend
npm install
```

### 5. Inisialisasi Database

Jalankan dari direktori `backend`:

```bash
npm run db:migrate
npm run db:seed
```

Proses ini menjalankan database migration dan menyediakan data awal untuk pengujian.

### 6. Jalankan Backend dan Frontend

Jalankan backend dari direktori `backend`:

```bash
npm run dev
```

Jalankan frontend dari terminal terpisah, dari direktori `frontend`:

```bash
npm run dev
```

## Akses Aplikasi

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |
| PostgreSQL | localhost:5435 |

## Akun Admin

Akun berikut disediakan untuk keperluan pengujian:

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `Admin123!` |

## Database

PostgreSQL dengan Drizzle ORM. Migrasi ada di `backend/drizzle/` dan dijalankan
dengan `npm run db:migrate`; `npm run db:seed` mengisi data awal (idempotent,
aman dijalankan berulang):

- 1 akun admin
- 15 produk
- 10 pelanggan

## API

Semua endpoint selain login memerlukan header `Authorization: Bearer <access_token>`.

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/login` | Login, mengembalikan token |
| GET | `/api/products` | Daftar produk (`page`, `per_page`, `search`) |
| POST | `/api/products` | Buat produk |
| PUT | `/api/products/{id}` | Perbarui produk |
| GET | `/api/customers` | Daftar pelanggan |
| POST | `/api/customers` | Buat pelanggan |
| POST | `/api/orders` | Buat order |
| GET | `/api/orders` | Riwayat order (`status`, `date_from`, `date_to`, `page`, `per_page`) |
| GET | `/api/orders/{id}` | Detail order beserta item |
| PATCH | `/api/orders/{id}/pay` | PENDING → PAID |
| PATCH | `/api/orders/{id}/cancel` | PENDING atau PAID → CANCELLED, stok dikembalikan |

Nama field JSON memakai snake_case (`product_code`, `per_page`, `discount_amount`) sesuai contoh di soal.

Response sukses:

```json
{ "success": true, "message": "OK", "data": {}, "meta": { "page": 1, "per_page": 10, "total": 57 } }
```

`meta` hanya ada pada endpoint daftar. Response gagal:

```json
{
  "success": false,
  "message": "Stok tidak mencukupi",
  "errors": { "items.1.quantity": ["Stok Hydrococo 150ml tersisa 3, diminta 5"] }
}
```

Status code yang dipakai: 200, 201, 401 (token tidak ada atau tidak valid), 404, 409 (transisi status tidak valid, stok tidak mencukupi, kode produk duplikat), dan 422 (validasi).

Contoh request order (harga dan total tidak dikirim oleh client):

```json
{
  "customer_id": "<uuid pelanggan>",
  "items": [
    { "product_id": "<uuid produk>", "quantity": 2 }
  ]
}
```

## Aturan Diskon (Varian A)

| Subtotal order | Diskon |
|---|---|
| Rp 500.000 ke atas | 5% |
| Rp 1.000.000 ke atas | 10% |

Diskon dibatasi maksimal Rp 150.000 dan dibulatkan ke bawah. Order menyimpan `subtotal`, `discount_amount`, dan `grand_total`, serta snapshot nama, kode, dan harga satuan tiap item.

## Alur `POST /api/orders`

1. **Route** (`backend/src/modules/orders/routes.ts`): hook `onRequest` memverifikasi JWT. Tanpa token atau dengan token salah, request ditolak 401 sebelum validasi apa pun.
2. **Validasi**: body diperiksa oleh `createOrderSchema` (Zod): `customer_id` UUID, minimal satu item, quantity bilangan bulat minimal 1, dan tidak ada produk duplikat. Gagal menghasilkan 422 dengan `errors` per field, misalnya `items.1.quantity`. Field harga atau total dari client tidak dikenali dan dibuang.
3. **Controller** mengambil id user dari token dan memanggil `orderService.createOrder`.
4. **Service** (`createOrder` di `service.ts`) menjalankan satu `db.transaction`:
   1. memeriksa pelanggan ada;
   2. mengunci baris produk dengan `SELECT ... FOR UPDATE`, diurutkan menurut `id`;
   3. memeriksa semua item (produk ada dan stok cukup). Jika ada yang gagal, seluruh order ditolak dan belum ada data yang berubah;
   4. menghitung subtotal, diskon, dan grand total dari harga di database (`helpers/calculate-order.ts`);
   5. membuat nomor `INV-YYYYMMDD-XXXX` dari sequence Postgres (`helpers/generate-invoice.ts`);
   6. menyimpan `orders` dan `order_items`, lalu mengurangi stok.
5. Setelah commit, order dimuat ulang beserta item dan pelanggan, lalu dikirim sebagai 201.

Error di langkah mana pun dilempar sebagai `AppError`, transaksi di-rollback, dan `errorHandlerPlugin` mengubahnya menjadi format `{ success: false, message, errors }`.

## Pengujian

Prasyarat: database sudah berjalan, sudah di-migrate, dan sudah di-seed (lihat bagian Menjalankan Aplikasi). Test login memakai akun admin seeder dan menulis ke database yang sama. Data test memakai kode unik dan dibersihkan sendiri setelah selesai.

```bash
cd backend
npm install
npm test
```

Cakupan test:

- order sukses, dengan total dihitung server dan stok berkurang
- stok tidak cukup (error di item yang bermasalah, stok tidak berubah)
- pembatalan mengembalikan stok
- transisi status tidak valid (409)
- aturan diskon Varian A, termasuk batas tiap tingkat dan batas maksimal
- angka order tidak berubah setelah harga produk diubah
- produk duplikat dalam satu order ditolak
- banyak order bersamaan tidak membuat stok minus
- filter status dan tanggal pada riwayat order
- akses tanpa token (401)