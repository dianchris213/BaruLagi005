# Pixel Perfect Replica

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/84323a7f-63a7-4174-9607-14701f06b675).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Pembaruan terbaru

- **Wawasan AI** di halaman Ringkasan: merangkum pemasukan & pengeluaran bulan aktif
  lewat Lovable AI Gateway (`src/lib/insights.functions.ts`) dari data lokal saja.
- **Zona waktu** dapat dipilih di Pengaturan (`src/lib/timezone.ts`). Reset harian
  (pendapatan driver) dan reset bulanan (arus kas dompet) dihitung dari zona ini,
  bukan jam perangkat, sehingga tidak rollover ganda antar perangkat.
- **Aksesibilitas notifikasi**: focus trap, navigasi panah/Home/End/Enter/Esc, dan
  pengumuman `aria-live` untuk jumlah notifikasi belum dibaca.
- **Tanpa peringatan hidrasi**: seluruh pembacaan `localStorage` ditunda sampai status
  `ready`, dan penulisan ke storage juga digerbangi status tersebut.

## Zona waktu, reset, dan Wawasan AI

- **Zona waktu** (Pengaturan): daftar kini mencakup `Asia/Bangkok` (UTC+7) dan zona
  UTC+7 lain; default mengikuti zona perangkat bila valid. Semua perhitungan hari/bulan
  memakai zona pilihan, bukan jam perangkat (`src/lib/timezone.ts`).
- **Uji reset** (Pengaturan → Uji Reset): menjalankan rollover harian/bulanan memakai
  zona aktif dan menampilkan tabel perbandingan arus kas dompet sebelum vs sesudah reset.
  Logika rollover murni ada di `src/lib/reset.ts`; UI di `src/components/ResetTester.tsx`.
- **Catat arus kas** (Ringkasan → Daftar Dompet): input tervalidasi (angka positif,
  maksimum Rp 1.000.000.000) yang langsung memperbarui arus kas dompet dan pendapatan
  bersih harian.
- **Kartu Wawasan AI** kini menyegarkan otomatis (debounce 800 ms) setiap kali data
  berubah — tidak lagi menunggu halaman dimuat ulang; permintaan lama dibatalkan agar
  hasil yang tampil selalu yang terbaru.
