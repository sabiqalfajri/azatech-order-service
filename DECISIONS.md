# Technical Decisions

Dokumen ini berisi beberapa keputusan teknis dan pertimbangan desain yang digunakan dalam pengembangan aplikasi Fullstack Order Service.

## 1. Monetary Value Representation

Nilai moneter disimpan menggunakan tipe integer dalam satuan Rupiah (IDR), karena aplikasi saat ini hanya mendukung transaksi Rupiah tanpa nilai pecahan. Pendekatan ini menghindari masalah presisi floating-point sekaligus menjaga perhitungan tetap sederhana.

Seluruh nilai yang berkaitan dengan transaksi, seperti harga produk, harga satuan, subtotal, diskon, dan total pesanan, menggunakan representasi integer dalam Rupiah.

## 2. Stock Concurrency & Transaction Integrity

**Mencegah stok minus saat order bersamaan.** Di `createOrder` (`src/modules/orders/service.ts`), seluruh proses berjalan dalam satu `db.transaction`. Di awal transaksi, baris semua produk dalam order dikunci dengan `SELECT ... FOR UPDATE`. Order kedua untuk produk yang sama menunggu sampai order pertama commit atau rollback, lalu membaca stok terbaru, sehingga dua order tidak bisa "menjual" stok yang sama. Produk dikunci dalam urutan `id` yang tetap supaya dua transaksi dengan urutan produk berbeda tidak saling menunggu (deadlock).

**Atomik dan tanpa perubahan sebagian.** Semua item divalidasi setelah baris dikunci dan sebelum ada data yang ditulis. Jika satu item gagal, error dilempar sebelum insert pertama, sehingga stok semua item tidak berubah. Jika ada kegagalan di tengah (misalnya insert), rollback membatalkan semuanya.

**Pembatalan.** `cancelOrder` memakai satu `UPDATE ... WHERE status IN ('PENDING','PAID')` dalam transaksi yang sama dengan pengembalian stok. Dua pembatalan bersamaan tidak bisa mengembalikan stok dua kali: yang kedua menunggu row lock, melihat status sudah `CANCELLED`, tidak mengenai baris, dan dijawab 409. `payOrder` memakai pola yang sama.

**Lapisan terakhir.** Constraint `products_stock_check` (`stock >= 0`) di database menolak stok minus walaupun ada bug di service. Test `stok tidak minus saat banyak order masuk bersamaan` (`orders.test.ts`) mengirim 8 order serentak untuk stok 3 dan memeriksa tepat 3 yang berhasil dan stok akhir 0.

**Status code.** Stok tidak cukup dijawab 409 karena merupakan konflik dengan kondisi data saat ini, sedangkan payload yang cacat (produk tidak ada, duplikat, quantity salah) dijawab 422. Keduanya tetap membawa `errors` per item.

## 3. Project Structure & Architecture

Aplikasi menggunakan pendekatan Modular Monolith pada sisi backend, dengan pemisahan modul berdasarkan domain dan tanggung jawab masing-masing.

Backend dan frontend ditempatkan dalam satu repository dengan direktori terpisah:

- `backend/`: Menangani REST API, autentikasi, validasi, business logic, dan akses database.
- `frontend/`: Menangani antarmuka pengguna dan interaksi dengan backend.
- `docker-compose.yaml`: Mengelola layanan PostgreSQL menggunakan Docker Compose. Backend dan frontend dijalankan secara lokal selama pengembangan.

Backend dibangun menggunakan TypeScript, Fastify, PostgreSQL, dan Drizzle ORM.

### Pemisahan Tanggung Jawab

Backend menggunakan pemisahan tanggung jawab untuk menjaga agar setiap bagian memiliki fungsi yang jelas:

- **Routes:** Mendefinisikan endpoint, HTTP method, schema request/response, dan menghubungkan request ke controller.
- **Controllers:** Menangani HTTP request dan response, serta meneruskan proses ke service.
- **Services:** Menangani business logic dan aturan aplikasi tanpa bergantung langsung pada mekanisme penyusunan HTTP response.
- **Database:** Menangani konfigurasi koneksi, schema, migration, dan akses data menggunakan Drizzle ORM.
- **Common:** Menyediakan komponen lintas module seperti schema umum, custom error (`AppError`), dan helper.
- **Plugins:** Menangani integrasi dan konfigurasi plugin Fastify, termasuk database, JWT, autentikasi, dan error handler.

### Dependency Management

Dependency antarbagian aplikasi dikelola menggunakan manual dependency injection melalui factory function.

Service dan controller menerima dependency melalui parameter factory, sehingga implementasinya tidak harus bergantung langsung pada instance Fastify.

Route berperan sebagai composition point yang menginisialisasi dan menghubungkan dependency tersebut.

Pendekatan ini digunakan tanpa DI container tambahan karena kebutuhan aplikasi saat ini masih relatif sederhana.

### Database Connection Lifecycle

Koneksi PostgreSQL dan instance Drizzle dibuat sebagai singleton pada modul database, kemudian didaftarkan ke Fastify melalui database plugin.

Plugin bertanggung jawab untuk:
- Mendaftarkan database instance melalui `app.decorate`.
- Memeriksa koneksi database ketika aplikasi siap dijalankan.
- Menutup koneksi ketika aplikasi melakukan shutdown.

Dengan pendekatan ini, koneksi database tidak dibuat ulang untuk setiap request.

### Authentication

Autentikasi JWT diterapkan menggunakan lifecycle hook `onRequest` pada level route plugin untuk seluruh endpoint yang membutuhkan autentikasi.

Pendekatan ini dipilih agar token diverifikasi sedini mungkin dalam request lifecycle, sebelum proses parsing dan validasi request dijalankan. Dengan demikian, request tanpa token atau token tidak valid dapat langsung ditolak tanpa melanjutkan validasi payload, query, maupun params.

Hook diterapkan pada level plugin agar seluruh endpoint dalam modul tersebut secara otomatis terlindungi tanpa perlu mendeklarasikan autentikasi secara berulang pada setiap route.

### Penanganan Error Terpusat

Semua error ditangani secara terpusat melalui `errorHandlerPlugin` (`src/plugins/error-handler.ts`).

Route dan service menggunakan `AppError` (`src/common/errors/app-error.ts`) untuk melempar error aplikasi yang sudah diketahui, termasuk HTTP status code dan field `errors` untuk detail validasi.

Error dari beberapa sumber diterjemahkan melalui handler khusus:
- Zod validation error.
- Fastify validation dan content type parser error.
- Drizzle/PostgreSQL error.

Response error mengikuti kontrak pada dokumen soal:

\`\`\`json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "items.1.quantity": [
      "Stok Hydrococo 150ml tersisa 3, diminta 5"
    ]
  }
}
\`\`\`

Error yang tidak dikenali akan menghasilkan HTTP 500 dengan pesan umum, sedangkan detail error dicatat melalui logger.

## 4. Database Design

Database menggunakan PostgreSQL dengan Drizzle ORM.

Beberapa pertimbangan desain:
- `users` dan `customers` dipisahkan karena memiliki tanggung jawab berbeda. Users merepresentasikan akun internal yang dapat mengakses aplikasi, sedangkan customers merepresentasikan pelanggan yang melakukan pemesanan.
- `orders` menyimpan informasi utama transaksi, termasuk status, subtotal, diskon, dan total akhir.
- `order_items` menyimpan snapshot nama produk, kode produk, dan harga satuan ketika pesanan dibuat. Dengan demikian, perubahan informasi produk tidak mengubah histori transaksi yang sudah tercatat.
- Satu produk hanya boleh muncul sekali dalam satu order. Aturan ini dijaga di dua lapisan:
  1. **Validasi aplikasi**: `superRefine` pada schema Zod `createOrderSchema` (`src/modules/orders/schema.ts`) menolak item dengan `product_id` duplikat dan mengembalikan HTTP 422 dengan error pada `items.N.productId`, sehingga pesan error jelas dan sesuai indeks item di request.
  2. **Constraint database**: unique constraint `order_items_order_product_uq` pada `(order_id, product_id)` di tabel `order_items`, sebagai jaring pengaman jika ada bug di service atau jalur lain yang menulis ke tabel ini.
  
  Alternatif menggabungkan item duplikat di service (misalnya produk A qty 2 dan qty 3 menjadi qty 5) tidak dipilih. Penggabungan memang membuat API lebih toleran, tetapi membuat pemetaan error menjadi ambigu. Contohnya, jika stok produk A tersisa 4 dan request berisi dua baris A dengan total 5, error stok tidak jelas harus ditempelkan ke baris yang mana. Solusinya adalah memilih salah satu baris (misalnya baris pertama) dan memberi pesan "gabungan 2 baris", tetapi itu menambah logika pemetaan yang harus dijaga, dan user melihat error pada baris yang jumlahnya sendiri sebenarnya tidak melebihi stok. Dengan menolak duplikat (422), setiap error selalu menunjuk tepat satu item di request, sesuai format error `items.N.quantity` pada soal.
  
  Sebagai gantinya, toleransi ditangani di sisi frontend dengan mencegah produk yang sama dipilih dua kali pada halaman Buat Order.

## 5. Known Issues & Bugs

*Bagian ini akan dilengkapi setelah proses implementasi dan pengujian.*

Akan mencakup bug yang ditemukan, penyebabnya, serta solusi yang diterapkan.

## 6. Limitations & Future Improvements

- Nomor order memakai sequence global tanpa reset harian, dan menjadi lebih dari 4 digit setelah 9999 order. Alternatif: counter per hari.
- Idempotency-Key pada `POST /api/orders` belum diimplementasikan.
- Produk duplikat dalam satu order ditolak, belum digabung.
- Login tidak ada rate limiting dan waktu respons berbeda untuk email yang tidak terdaftar.
- Test dijalankan terhadap database yang sama dengan development, belum ada database test terpisah.