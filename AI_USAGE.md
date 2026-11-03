# AI Usage

Dokumen ini menjelaskan penggunaan AI selama proses pengerjaan Fullstack Order Service technical test.

## 1. AI Tools

| Tool | Penggunaan |
|---|---|
| ChatGPT | Membantu diskusi teknis, mengevaluasi pendekatan implementasi, dan debugging |
| Claude | Membantu eksplorasi dan pengerjaan kode |

## 2. Use Cases

AI digunakan sebagai alat bantu selama proses development, terutama untuk:

- **Technical discussion:** Mendiskusikan alternatif implementasi dan memahami trade-off keputusan teknis.
- **Debugging:** Membantu menganalisis error dan mengeksplorasi kemungkinan penyebab masalah.
- **Code review:** Meminta masukan terkait struktur kode, readability, dan potensi edge case.
- **Testing:** Mendiskusikan skenario pengujian dan kasus yang perlu diverifikasi.
- **Documentation:** Membantu menyusun dan memperjelas dokumentasi teknis.

AI tidak digunakan sebagai pengganti pemahaman dan pengambilan keputusan teknis. Setiap saran atau kode yang digunakan tetap ditinjau, disesuaikan dengan kebutuhan project, dan diverifikasi melalui pengujian.

## 3. Example Prompts

Berikut beberapa prompt yang digunakan selama proses development:

**1. Database Transaction & Stock Concurrency**

> Saya sedang mengimplementasikan fitur create order menggunakan PostgreSQL dan Drizzle ORM. Prosesnya mencakup validasi stok, pengurangan stok, serta penyimpanan order dan order items. Saya berencana menggunakan database transaction dan SELECT FOR UPDATE untuk mencegah race condition ketika beberapa request membuat order dengan produk yang sama secara bersamaan. Apakah pendekatan ini sudah tepat atau best practices? Adakah hal lain yang perlu diperhatikan, terutama terkait locking, deadlock, dan konsistensi stok?

**2. Debugging Response Serialization**

> Saya menemukan error FST_ERR_RESPONSE_SERIALIZATION pada endpoint POST /api/orders. Proses insert ke database sebenarnya berhasil, tapi Fastify mengembalikan HTTP 500 ketika mengirim response. Setelah saya telusuri, sepertinya ada mismatch antara tipe data yang dikembalikan service dengan response schema, khususnya pada field timestamp yang masih berupa JavaScript Date. Bagaimana best practice menangani hal ini? Apakah sebaiknya konversi Date ke ISO string dilakukan di response mapper atau ada pendekatan lain yang lebih tepat?

**3. Project Architecture & Code Organization**

> Saya sedang menyusun struktur backend untuk aplikasi Fullstack Order Service menggunakan Fastify, Drizzle ORM, dan PostgreSQL. Saya berencana menggunakan pendekatan Modular Monolith dengan pemisahan modul berdasarkan domain, lalu setiap modul memiliki route, controller, service, dan schema masing-masing. Menurut Anda, apakah struktur seperti ini sudah cukup baik untuk project dengan scope tersebut? Bagaimana sebaiknya pemisahan tanggung jawab antar layer dan dependencynya agar tetap maintainable tanpa overengineering?

**4. Automated Integration Testing**

> Saya menggunakan Vitest dan Fastify app.inject() untuk integration test pada backend. Saat ini saya udah menguji beberapa skenario seperti create order, insufficient stock, cancel order, dan invalid status transition. Saya juga ingin memastikan apakah pengujian concurrent request berjalan dengan benar, terutama untuk validasi konsistensi stok. Apa best practice untuk mengelola test data, isolasi antar-test suite, dan proses cleanup agar test tidak saling memengaruhi atau meninggalkan data yang tidak konsisten?

**5. JWT Authentication & Next.js BFF**

> Saya menggunakan Fastify sebagai backend dan Next.js sebagai frontend untuk technical test Fullstack Order Service. Menurut Anda, mana pendekatan autentikasi yang lebih sesuai dan tidak overengineering untuk scope project ini: tetap menggunakan HS256 dengan validasi token melalui endpoint /auth/me dan Next.js BFF, atau pindah ke RS256 dengan JWKS agar Next.js dapat memverifikasi JWT secara mandiri menggunakan public secret dan untuk kebutuhan SSR? Pertimbangkan juga kompleksitas implementasi, perubahan yang diperlukan pada backend dan frontend.

## 4. Code Ownership and Verification

Implementasi akhir merupakan hasil pengerjaan dan keputusan teknis saya sendiri. Bantuan AI digunakan sebagai referensi dan alat diskusi.

Kode yang digunakan telah ditinjau dan disesuaikan dengan kebutuhan aplikasi. Perilaku endpoint dan business logic diverifikasi melalui automated tests serta pengujian API secara langsung.