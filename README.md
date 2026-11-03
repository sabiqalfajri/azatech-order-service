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
- Vitest / Jest
- Supertest

## Fitur

- Autentikasi admin menggunakan JWT.
- Pengelolaan produk, termasuk pencarian dan pagination.
- Pengelolaan data pelanggan.
- Pembuatan pesanan dengan satu atau lebih produk.
- Perhitungan subtotal, diskon, dan total pesanan di sisi backend.
- Pengelolaan status pesanan: PENDING, PAID, dan CANCELLED.
- Pengurangan stok ketika pesanan dibuat.
- Pengembalian stok ketika pesanan dibatalkan.
- Riwayat dan detail pesanan.

## Persyaratan

Pastikan perangkat sudah memiliki:
- Git
- Docker
- Docker Compose
- Node.js dan npm

## Menjalankan Aplikasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd fullstack-order-service
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
| Password | `<seeded-admin-password>` |

## Database

Database menggunakan PostgreSQL dengan Drizzle ORM sebagai ORM dan migration tool.

Database dijalankan melalui Docker Compose, sedangkan migration dan seeding dilakukan menggunakan script yang tersedia di backend.

Data awal yang disediakan:
- 1 akun admin.
- Minimal 15 produk.
- 10 pelanggan.

## Alur Pembuatan Pesanan

Endpoint `POST /orders` menangani pembuatan pesanan dengan alur berikut:

1. Memvalidasi data pesanan dan memastikan produk yang diminta tersedia.
2. Mengambil harga produk langsung dari database, bukan mempercayai harga yang dikirim oleh client.
3. Memvalidasi ketersediaan stok untuk seluruh item pesanan.
4. Menghitung subtotal, diskon, dan total akhir di backend.
5. Menyimpan pesanan beserta item dan snapshot informasi produk.
6. Mengurangi stok produk dalam satu database transaction.

Jika salah satu produk memiliki stok yang tidak mencukupi, seluruh proses dibatalkan sehingga tidak terjadi perubahan stok sebagian.

## API

Backend menyediakan REST API untuk:
- Autentikasi
- Produk
- Pelanggan
- Pesanan

Dokumentasi endpoint, parameter, dan contoh request tersedia melalui dokumentasi API jika Swagger/OpenAPI telah diimplementasikan.

## Pengujian

Automated tests mencakup skenario utama, termasuk:
- Pembuatan pesanan berhasil.
- Penanganan stok tidak mencukupi.
- Pengembalian stok ketika pesanan dibatalkan.
- Penolakan transisi status pesanan yang tidak valid.
- Validasi aturan bisnis pada varian yang dipilih.
- Penolakan akses tanpa autentikasi.

Jalankan automated tests dari direktori backend:

```bash
npm test
```

## Catatan

Dokumentasi ini akan diperbarui mengikuti perkembangan implementasi aplikasi.