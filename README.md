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
- Status order PENDING, PAID, dan CANCELLED; transisi tidak valid ditolak dengan HTTP 409.
- Stok berkurang saat order dibuat dan dikembalikan saat order dibatalkan, dengan perlindungan terhadap stok minus pada order bersamaan.
- Riwayat order dengan filter status dan rentang tanggal, serta detail order beserta item.
- Frontend: login admin, proteksi halaman, pengelolaan produk, pembuatan order, serta daftar dan detail order dengan aksi pembayaran dan pembatalan.

## Struktur Repository

```text
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

Jalankan dari root repository:

```bash
docker compose up -d
```

Docker Compose hanya digunakan untuk menjalankan PostgreSQL. Backend dan frontend dijalankan secara lokal.

### 4. Install Dependencies

Jalankan dari root repository:

```bash
npm --prefix backend install
npm --prefix frontend install
```

### 5. Inisialisasi Database

Jalankan dari root repository:

```bash
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
```

Proses ini menjalankan database migration dan menyediakan data awal untuk pengujian.

### 6. Jalankan Backend dan Frontend

Jalankan backend dari root repository:

```bash
npm --prefix backend run dev
```

Jalankan frontend dari terminal terpisah, juga dari root repository:

```bash
npm --prefix frontend run dev
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

Aplikasi menggunakan PostgreSQL dengan Drizzle ORM.

File migration berada di `backend/drizzle/` dan dijalankan menggunakan `npm run db:migrate`. Seeder dijalankan menggunakan `npm run db:seed` untuk mengisi data awal.

Seeder bersifat idempotent dan menyediakan:

- 1 akun admin
- 15 produk
- 10 pelanggan

## API

Semua endpoint selain login memerlukan header:

```http
Authorization: Bearer <access_token>
```

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

Nama field JSON menggunakan snake_case (`product_code`, `per_page`, `discount_amount`) sesuai contoh di soal.

### Format Response

Response sukses:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 57
  }
}
```

Field `meta` hanya tersedia pada endpoint daftar.

Response gagal:

```json
{
  "success": false,
  "message": "Stok tidak mencukupi",
  "errors": {
    "items.1.quantity": [
      "Stok Hydrococo 150ml tersisa 3, diminta 5"
    ]
  }
}
```

Status code yang digunakan:

- `200`: Request berhasil.
- `201`: Resource berhasil dibuat.
- `401`: Token tidak ada atau tidak valid.
- `404`: Resource tidak ditemukan.
- `409`: Konflik dengan kondisi resource saat ini, seperti transisi status tidak valid, stok tidak mencukupi, atau kode produk duplikat.
- `422`: Validasi request gagal.

### Contoh Request Order

Harga dan total tidak dikirim oleh client karena seluruh perhitungan transaksi dilakukan di backend menggunakan data produk dari database.

```json
{
  "customer_id": "<uuid pelanggan>",
  "items": [
    {
      "product_id": "<uuid produk>",
      "quantity": 2
    }
  ]
}
```

## Aturan Diskon (Varian A)

| Subtotal Order | Diskon |
|---|---|
| Rp500.000 ke atas | 5% |
| Rp1.000.000 ke atas | 10% |

Diskon dibatasi maksimal Rp150.000 dan dibulatkan ke bawah.

Order menyimpan `subtotal`, `discount_amount`, dan `grand_total`, serta snapshot nama, kode, dan harga satuan tiap item. Dengan demikian, perubahan harga produk tidak mengubah nilai transaksi yang sudah tercatat.

## Nomor Invoice

Nomor invoice menggunakan format `INV-YYYYMMDD-XXXX`.

Tanggal invoice menggunakan zona waktu WIB, sedangkan nomor urut dihasilkan menggunakan PostgreSQL sequence yang bersifat global.

Nomor urut memiliki minimal empat digit dan dapat bertambah jika melewati 9.999. Sequence tidak di-reset setiap hari dan dapat memiliki nomor yang terlewat apabila transaksi mengalami rollback.

## Alur `POST /api/orders`

1. **Route** (`backend/src/modules/orders/routes.ts`): Hook `onRequest` memverifikasi JWT. Tanpa token atau dengan token tidak valid, request ditolak dengan HTTP 401 sebelum validasi request dijalankan.
2. **Validasi**: Body diperiksa oleh `createOrderSchema` menggunakan Zod:
   - `customer_id` harus berupa UUID.
   - Order minimal berisi satu item.
   - Quantity harus berupa bilangan bulat minimal 1.
   - Produk yang sama tidak boleh muncul lebih dari sekali dalam satu order.

   Jika validasi gagal, request menghasilkan HTTP 422 dengan detail error per field, misalnya `items.1.quantity`. Field harga atau total dari client tidak digunakan oleh backend.
3. **Controller**: Mengambil ID user dari token dan memanggil `orderService.createOrder`.
4. **Service** (`createOrder` di `service.ts`): Menjalankan seluruh proses dalam satu `db.transaction`:
   1. Memeriksa keberadaan pelanggan.
   2. Mengunci baris produk menggunakan `SELECT ... FOR UPDATE`, diurutkan berdasarkan ID.
   3. Memeriksa keberadaan produk dan ketersediaan seluruh stok. Jika ada item yang gagal, transaksi dibatalkan tanpa perubahan data.
   4. Menghitung subtotal, diskon, dan grand total berdasarkan harga produk di database (`helpers/calculate-order.ts`).
   5. Membuat nomor invoice `INV-YYYYMMDD-XXXX` menggunakan PostgreSQL sequence (`helpers/generate-invoice.ts`).
   6. Menyimpan data `orders` dan `order_items`, kemudian mengurangi stok produk.
5. **Response**: Setelah transaksi berhasil di-commit, order dimuat ulang beserta item dan pelanggan, kemudian dikirim sebagai response HTTP 201.

Error yang terjadi selama proses transaksi menyebabkan rollback. `errorHandlerPlugin` menangani error dan mengubahnya menjadi format response yang konsisten:

```json
{
  "success": false,
  "message": "Stok tidak mencukupi",
  "errors": {
    "items.1.quantity": [
      "Stok Hydrococo 150ml tersisa 3, diminta 5"
    ]
  }
}
```

## Alur Pembatalan Order

Endpoint `PATCH /api/orders/:id/cancel` menangani pembatalan order.

1. Service memeriksa keberadaan order dan statusnya.
2. Hanya order berstatus `PENDING` atau `PAID` yang dapat dibatalkan.
3. Perubahan status menjadi `CANCELLED` dilakukan dalam satu database transaction bersama pengembalian stok seluruh item.
4. Jika proses gagal, seluruh perubahan akan di-rollback.
5. Order yang sudah `CANCELLED` tidak dapat dibatalkan kembali, sehingga stok tidak dikembalikan dua kali.

## Pengujian

Prasyarat: PostgreSQL sudah berjalan, database sudah di-migrate, dan sudah di-seed (lihat bagian Menjalankan Aplikasi).

Automated test menggunakan Vitest dan Fastify `app.inject()`. Test login menggunakan akun admin dari seeder.

Test menggunakan database development yang sama dan membuat data dengan identifier unik. Data yang dibuat selama pengujian dibersihkan setelah test selesai.

Jalankan dari root repository:

```bash
npm --prefix backend test
```

### Cakupan Test

- Order berhasil dibuat, total dihitung oleh server, dan stok berkurang.
- Stok tidak mencukupi: error ditampilkan pada item yang bermasalah dan stok tidak berubah.
- Pembatalan order mengembalikan stok.
- Transisi status tidak valid ditolak dengan HTTP 409.
- Aturan diskon Varian A, termasuk batas setiap tingkat diskon dan batas maksimal.
- Nilai order tidak berubah setelah harga produk diubah.
- Produk duplikat dalam satu order ditolak.
- Concurrent order tidak menyebabkan stok menjadi negatif.
- Filter status dan tanggal pada riwayat order.
- Akses tanpa token ditolak dengan HTTP 401.