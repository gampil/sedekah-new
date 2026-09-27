# 🕌 Sedekah Subuh Haramain

Website donasi Sedekah Subuh untuk pembangunan dan operasional di Masjidil Haram & Masjid Nabawi.

## ✨ Fitur

- 🎨 **Clean & Responsive Design** - Tampilan profesional dengan aksen warna biru
- 💳 **Form Donasi** - Upload bukti transfer, pilih metode pembayaran
- 🔥 **Firebase RTDB** - Database real-time untuk menyimpan data donasi
- 🤖 **Telegram Bot** - Notifikasi otomatis & approval via BotFather
- 📧 **Email Notification** - Notifikasi via webmail
- 🖼️ **ImgBB API** - Upload bukti transfer ke ImgBB
- 🔐 **Admin Panel** - Dashboard untuk approve/reject donasi
- 📱 **Mobile First** - Responsive di semua perangkat

## 🚀 Setup & Konfigurasi

### 1. Firebase Realtime Database

1. Buat project di [Firebase Console](https://console.firebase.google.com/)
2. Aktifkan **Realtime Database**
3. Set rules:
```json
{
  "rules": {
    "donations": {
      ".read": true,
      ".write": true
    }
  }
}
```
4. Salin konfigurasi Firebase ke `.env`

### 2. Telegram Bot (BotFather)

1. Buka Telegram, cari **@BotFather**
2. Kirim `/newbot` dan ikuti instruksi
3. Catat **Bot Token** yang diberikan
4. Untuk mendapatkan **Chat ID**:
   - Kirim pesan ke bot Anda
   - Buka: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Cari `"chat":{"id": XXXXXXX}`
5. Masukkan token dan chat ID ke `.env`

### 3. ImgBB API

1. Daftar di [ImgBB](https://imgbb.com/)
2. Dapatkan API Key dari dashboard
3. Masukkan ke `.env` sebagai `VITE_IMGBB_API_KEY`

### 4. Email Notification (Webmail)

Untuk notifikasi email, Anda bisa menggunakan:
- **EmailJS** (https://www.emailjs.com/)
- **Custom backend** dengan endpoint POST
- **Formspree** atau layanan serupa

Setup endpoint email di `.env` sebagai `VITE_EMAIL_SERVICE_URL`

### 5. Environment Variables

Copy `.env.example` ke `.env` dan isi semua variabel:

```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_DATABASE_URL=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_TELEGRAM_BOT_TOKEN=xxx
VITE_TELEGRAM_CHAT_ID=xxx
VITE_IMGBB_API_KEY=xxx
VITE_EMAIL_SERVICE_URL=xxx
VITE_ADMIN_PASSWORD=your_secure_password
```

## 🏗️ Development

```bash
npm install
npm run dev
```

## 📦 Build

```bash
npm run build
```

## 📋 Struktur Database Firebase

```
donations/
  ├── {auto_id_1}/
  │   ├── name: "John Doe"
  │   ├── amount: 100000
  │   ├── message: "Semoga berkah"
  │   ├── paymentMethod: "BSI"
  │   ├── proofUrl: "https://i.ibb.co/xxx.jpg"
  │   ├── email: "john@example.com"
  │   ├── status: "pending" | "approved" | "rejected"
  │   └── timestamp: 1700000000000
  └── {auto_id_2}/
      └── ...
```

## 🔐 Admin Panel

Akses admin panel melalui tombol gembok di navigasi.
- Default password: `admin123` (ubah di `.env`)
- Fitur: Approve/Reject donasi, lihat bukti transfer

## 📱 Telegram Commands

Bot akan otomatis mengirim notifikasi saat:
- Ada donasi baru masuk (status: pending)
- Donasi di-approve
- Donasi di-reject

Format notifikasi:
```
🕌 Donasi Baru - Sedekah Subuh Haramain

👤 Nama: [nama]
💰 Jumlah: Rp [amount]
🏦 Metode: [method]
💬 Pesan: [message]
📎 Bukti: [url]

⏳ Status: Menunggu Verifikasi
🆔 ID: [id]
```

## 🛠️ Tech Stack

- React 18 + TypeScript
- Tailwind CSS v4
- Firebase Realtime Database
- Telegram Bot API
- ImgBB API
- Vite

## 📄 License

MIT License

---

Dibuat dengan ❤️ untuk kebaikan umat
