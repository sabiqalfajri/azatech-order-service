# Technical Decisions

Dokumen ini berisi keputusan teknis, pertimbangan desain, serta evaluasi implementasi aplikasi Fullstack Order Service.

## 1. Stock Concurrency & Transaction Integrity

### Mencegah Stok Minus Saat Order Bersamaan

Pada fungsi `createOrder()` (`backend/src/modules/orders/service.ts`), seluruh proses pembuatan pesanan dijalankan dalam satu `db.transaction`.

Di awal transaksi, baris seluruh produk yang dipesan dikunci menggunakan `SELECT ... FOR UPDATE`. Jika transaksi lain mencoba mengunci produk yang sama, transaksi tersebut harus menunggu hingga transaksi pertama selesai (commit atau rollback), kemudian membaca kondisi stok terbaru.

Produk dikunci berdasarkan urutan ID secara ascending untuk menjaga konsistensi urutan penguncian dan mengurangi risiko deadlock ketika beberapa transaksi membutuhkan produk yang sama.

### Atomicity dan Konsistensi Stok

Seluruh produk dan ketersediaan stok divalidasi setelah row terkunci dan sebelum proses penyimpanan dimulai.

Jika satu item tidak valid atau stok tidak mencukupi, error dilempar sebelum perubahan data dilakukan. Jika terjadi kegagalan pada operasi database di tengah proses, seluruh perubahan dalam transaction akan di-rollback.

Dengan demikian, penyimpanan order, order items, dan pengurangan stok tidak dapat berhasil secara parsial.

### Pembatalan dan Transisi Status

Fungsi `cancelOrder()` menjalankan perubahan status menjadi `CANCELLED` dan pengembalian stok dalam satu database transaction.

Perubahan status dilakukan secara kondisional, hanya untuk order berstatus `PENDING` atau `PAID`. Jika dua pembatalan dilakukan bersamaan, hanya satu yang berhasil mengubah status dan mengembalikan stok. Request berikutnya akan ditolak dengan HTTP 409 karena status order sudah `CANCELLED`.

Fungsi `payOrder()` juga menggunakan conditional update agar perubahan status hanya dapat dilakukan dari `PENDING` menjadi `PAID`.

### Database Constraint dan Pengujian

Sebagai lapisan perlindungan tambahan, constraint `products_stock_check` pada tabel produk memastikan nilai stok tidak pernah kurang dari nol.

Pengujian concurrency pada `orders.test.ts` mengirimkan delapan request pembuatan order secara bersamaan untuk produk dengan stok tiga. Hasil yang diharapkan adalah tepat tiga order berhasil, lima order ditolak, dan stok akhir tetap nol.

### HTTP Status Code

Stok tidak mencukupi menghasilkan HTTP 409 karena merupakan konflik dengan kondisi stok saat ini. Sementara itu, payload yang tidak valid, seperti produk tidak ditemukan, produk duplikat, atau quantity yang tidak valid, menghasilkan HTTP 422.

Kedua jenis error tetap menyertakan detail `errors` agar frontend dapat menunjukkan masalah pada item yang bersangkutan.

## 2. Project Structure & Architecture

### Pendekatan Arsitektur

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
- **Common:** Menyediakan komponen lintas modul seperti schema umum, custom error (`AppError`), dan helper.
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

### Autentikasi di Frontend: BFF dengan Cookie httpOnly

Backend memakai JWT (Bearer token) sesuai soal. Pertanyaannya adalah di mana frontend menyimpan token itu. Ada tiga opsi yang saya pertimbangkan:

1. **localStorage atau cookie biasa yang diatur dari JavaScript.** Paling sederhana, tetapi token bisa dibaca JavaScript, sehingga satu celah XSS cukup untuk mencuri sesi. localStorage juga tidak terbaca di server, sehingga proteksi route hanya bisa dilakukan setelah halaman termuat.
2. **RS256 dengan JWKS.** Ini mengubah siapa yang dapat memverifikasi token, tetapi token tetap bisa dibaca JavaScript, jadi tidak menyelesaikan masalah XSS. Manfaatnya baru terasa ketika ada banyak service yang memverifikasi token, dan itu belum terjadi di sini.
3. **BFF (Backend for Frontend) dengan cookie httpOnly.** Opsi ini yang dipilih.

Cara kerjanya:

- `POST /api/auth/login` di Next (`frontend/src/app/api/auth/login/route.ts`) meneruskan kredensial ke backend, menyimpan `access_token` di cookie httpOnly, dan menghapus token dari respons, sehingga token tidak pernah sampai ke JavaScript browser.
- Endpoint lain melewati `frontend/src/app/api/[...path]/route.ts`, yang membaca cookie dan meneruskan request ke backend dengan header `Authorization: Bearer`. Jika backend menjawab 401, cookie dihapus dan `api-client.ts` mengarahkan pengguna ke `/login`.
- `frontend/src/proxy.ts` menolak akses ke halaman tanpa cookie sebelum halaman dirender.
- Umur cookie diambil dari klaim `exp` pada JWT (`lib/auth-cookie.ts`), sehingga tidak perlu disamakan secara manual dengan masa berlaku token di backend.

Dampak lainnya: browser hanya berkomunikasi dengan origin Next, jadi CORS tidak diperlukan. Alamat backend (`BACKEND_URL`) dibaca server saat runtime dan tidak tertanam di bundle, sehingga mudah diubah di Docker. Backend tidak berubah dan tetap menjadi REST API berbasis JWT standar.

Trade-off yang diterima: ada satu hop jaringan tambahan, perlindungan CSRF hanya mengandalkan `SameSite=Lax` (belum ada token CSRF), dan `proxy.ts` hanya memeriksa keberadaan cookie sedangkan keabsahan token tetap diperiksa backend pada setiap request.

### Struktur Frontend

Frontend memakai Next.js (App Router) dan TypeScript. Kode dikelompokkan per fitur (`src/features/<fitur>/` berisi `api.ts`, `hooks.ts`, `types.ts`, `schema.ts`, dan `components/`), sedangkan `app/` hanya berisi route dan layout, sehingga perubahan satu fitur terkumpul di satu folder.

- **Data dari server** dikelola dengan TanStack Query. Pencarian dan pagination dilakukan di server, hasilnya di-cache per halaman dan kata kunci. Hasil `pay` dan `cancel` langsung ditulis ke cache detail order, dan cache produk di-invalidate ketika stok berubah.
- **Form** memakai React Hook Form dengan Zod, dengan aturan yang sama seperti backend. Error server berkunci `items.N.quantity` dipetakan ke baris yang bersangkutan.
- **Validasi stok tidak diblokir di client.** Form hanya menampilkan peringatan jika jumlah melebihi stok yang terlihat, tetapi tetap mengirim request, karena stok bisa berubah kapan saja dan keputusan akhir ada di server.
- **Total di form hanyalah pratinjau** (`features/orders/calculate.ts`). Harga, diskon, dan total final selalu dihitung server, dan client tidak pernah mengirim harga.

### Authentication

Autentikasi JWT diterapkan menggunakan lifecycle hook `onRequest` pada level route plugin untuk seluruh endpoint yang membutuhkan autentikasi.

Pendekatan ini dipilih agar token diverifikasi sedini mungkin dalam request lifecycle, sebelum proses parsing dan validasi request dijalankan. Dengan demikian, request tanpa token atau token tidak valid dapat langsung ditolak tanpa melanjutkan validasi payload, query, maupun params.

Hook diterapkan pada level plugin agar seluruh endpoint dalam modul tersebut secara otomatis terlindungi tanpa perlu mendeklarasikan autentikasi secara berulang pada setiap route.

### Penanganan Error Terpusat

Semua error ditangani secara terpusat melalui `errorHandlerPlugin` (`backend/src/plugins/error-handler.ts`).

Route dan service menggunakan `AppError` (`backend/src/common/errors/app-error.ts`) untuk melempar error aplikasi yang sudah diketahui, termasuk HTTP status code dan field `errors` untuk detail validasi.

Error dari beberapa sumber diterjemahkan melalui handler khusus:

- Zod validation error.
- Fastify validation dan content type parser error.
- Drizzle/PostgreSQL error.

Response error mengikuti kontrak pada dokumen soal:

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "items.1.quantity": [
      "Stok Hydrococo 150ml tersisa 3, diminta 5"
    ]
  }
}
```

Error yang tidak dikenali akan menghasilkan HTTP 500 dengan pesan umum, sedangkan detail error dicatat melalui logger.

### Pengembangan Jika Aplikasi Membesar

Jika kebutuhan aplikasi bertambah, pengembangan dapat dilakukan secara bertahap tanpa harus langsung memecah backend menjadi microservices.

Beberapa hal yang dapat dikembangkan:

- Memperjelas batas tanggung jawab dan dependency antar modul.
- Menambahkan automated integration test untuk setiap modul dan alur transaksi.
- Memisahkan proses background yang membutuhkan eksekusi asynchronous ke worker tersendiri.
- Mempertimbangkan pemisahan service apabila terdapat kebutuhan scaling atau deployment independen yang memang membenarkannya.

Pendekatan Modular Monolith dipilih agar kompleksitas infrastruktur tetap terkendali selama kebutuhan aplikasi masih dapat ditangani oleh satu backend.

## 3. Known Issues & Bugs

### Bug: Response Serialization Error pada Create Order

**Masalah:**

Saat menjalankan automated integration test pada endpoint POST /api/orders, Vitest menerima HTTP 500 Internal Server Error. Sementara itu, ketika endpoint diuji melalui Postman, response menunjukkan bahwa customer tidak ditemukan. Hal ini awalnya membuat saya menganggap endpoint sudah berjalan sesuai ekspektasi.

**Cara menemukan:**

Saya melakukan beberapa langkah investigasi untuk mencari tahu penyebab perbedaan perilaku antara Postman dan Vitest:

Menguji endpoint POST /api/orders melalui Postman dan mendapatkan response bahwa customer tidak ditemukan.

Memeriksa apakah Vitest menggunakan database yang sama dengan Postman melalui query SQL.

Menambahkan logging pada order service untuk memeriksa proses eksekusi, tetapi belum berhasil menemukan penyebabnya.

Menambahkan console.error("UNHANDLED:", error) pada global error handler plugin agar detail error yang tidak tertangani dapat terlihat.

Dari logging tersebut, akhirnya ditemukan error FST_ERR_RESPONSE_SERIALIZATION dengan detail bahwa response tidak sesuai dengan schema yang didefinisikan.

**Penyebab:**

Fungsi toOrderResponse() mengembalikan objek JavaScript Date untuk field created_at dan updated_at, sedangkan response schema menggunakan z.iso.datetime() yang mengharapkan string ISO datetime.

**Perbaikan:**

Mengubah field created_at dan updated_at pada toOrderResponse() menggunakan .toISOString() agar tipe data yang dikembalikan sesuai dengan response schema.

**Verifikasi:**

Menjalankan kembali automated integration test pada Orders API. Setelah perbaikan, seluruh 15 test berhasil dilewati tanpa response serialization error.

## 4. Limitations & Future Improvements

Beberapa bagian yang belum diimplementasikan atau masih dapat dikembangkan lebih lanjut:

- **Idempotency:** `Idempotency-Key` pada `POST /api/orders` belum diimplementasikan. Pengembangan selanjutnya dapat menambahkan mekanisme ini untuk mencegah transaksi ganda ketika client mengirim ulang request akibat timeout atau gangguan jaringan.
- **Refresh Token:** Autentikasi saat ini menggunakan JWT access token tanpa mekanisme refresh token. Pengembangan selanjutnya dapat menambahkan refresh token dengan rotasi token untuk memperbarui access token tanpa mengharuskan pengguna login kembali.
- **Rate Limiting:** Endpoint login belum dilengkapi rate limiting untuk membatasi percobaan login berulang.
- **Database Testing:** Automated test masih menggunakan database yang sama dengan environment development. Ke depannya, database khusus testing dapat digunakan agar data pengujian terisolasi dari data development.
- **Penerbitan cookie sesi:** cookie `access_token` dibuat oleh route handler Next (`frontend/src/app/api/auth/login/route.ts`), bukan oleh backend. Umur cookie memang diambil dari klaim `exp` JWT dari backend, tetapi atribut cookie (`httpOnly`, `SameSite`, `Secure`) ditentukan di frontend. Akibatnya kebijakan sesi tersebar di dua tempat. Pendekatan yang lebih rapi adalah backend menerbitkan cookie sesi (misalnya lewat `@fastify/cookie`) dan BFF hanya meneruskan header `Set-Cookie`, sehingga backend menjadi satu-satunya sumber kebenaran. Itu tidak dilakukan karena soal mensyaratkan login mengembalikan token pada body respons, dan perubahan itu menyentuh kontrak API di backend yang sudah diuji.
- **Observability:** Monitoring dan observability masih dapat ditingkatkan, misalnya melalui structured logging, metrics, dan monitoring performa query.

## 5. Additional Technical Decisions

Bagian ini mencakup keputusan teknis tambahan yang tidak termasuk pertanyaan utama pada dokumen technical test.

### Monetary Value Representation

Nilai moneter disimpan menggunakan tipe integer dalam satuan Rupiah (IDR), karena aplikasi saat ini hanya mendukung transaksi Rupiah tanpa nilai pecahan. Pendekatan ini menghindari masalah presisi floating-point sekaligus menjaga perhitungan tetap sederhana.

Seluruh nilai yang berkaitan dengan transaksi, seperti harga produk, harga satuan, subtotal, diskon, dan total pesanan, menggunakan representasi integer dalam Rupiah.

### Database Design

Database menggunakan PostgreSQL dengan Drizzle ORM.

Beberapa pertimbangan desain:

- `users` dan `customers` dipisahkan karena memiliki tanggung jawab berbeda. Users merepresentasikan akun internal yang dapat mengakses aplikasi, sedangkan customers merepresentasikan pelanggan yang melakukan pemesanan.
- `orders` menyimpan informasi utama transaksi, termasuk status, subtotal, diskon, dan total akhir.
- `order_items` menyimpan snapshot nama produk, kode produk, dan harga satuan ketika pesanan dibuat. Dengan demikian, perubahan informasi produk tidak mengubah histori transaksi yang sudah tercatat.
- Satu produk hanya boleh muncul sekali dalam satu order. Aturan ini dijaga di dua lapisan:
  1. **Validasi aplikasi:** `superRefine` pada schema Zod `createOrderSchema` (`backend/src/modules/orders/schema.ts`) menolak item dengan `product_id` duplikat dan mengembalikan HTTP 422 dengan error pada `items.N.product_id`.
  2. **Constraint database:** unique constraint `order_items_order_product_uq` pada `(order_id, product_id)` di tabel `order_items`, sebagai jaring pengaman jika ada bug di service atau jalur lain yang menulis ke tabel ini.

Alternatif menggabungkan item duplikat di service tidak dipilih. Penggabungan dapat membuat pemetaan error stok menjadi ambigu karena beberapa baris request akan digabung menjadi satu jumlah. Dengan menolak duplikat, setiap error dapat menunjuk secara langsung ke item yang bermasalah.

Sebagai gantinya, frontend mencegah produk yang sama dipilih dua kali pada halaman Buat Order.

### Order Number Generation

Nomor invoice dibuat menggunakan PostgreSQL sequence `order_number_seq`, yang didefinisikan pada schema orders dan digunakan oleh helper `generate-invoice.ts`.

Sequence dipilih karena PostgreSQL menjamin setiap pemanggilan `nextval()` menghasilkan nilai yang berbeda, termasuk ketika beberapa order dibuat secara bersamaan.

Nomor invoice menggunakan format `INV-YYYYMMDD-XXXX`, dengan tanggal berdasarkan WIB. Nilai sequence menggunakan `padStart(4, "0")`, sehingga empat digit merupakan panjang minimum dan nomor dapat bertambah jika sequence melewati 9.999.

Sequence bersifat global, bukan di-reset setiap hari. Hal ini menghindari penggunaan ulang nomor sequence. Konsekuensinya, nomor dapat memiliki jeda karena sequence tidak di-rollback ketika database transaction gagal.