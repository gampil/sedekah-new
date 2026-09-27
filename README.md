# 🕌 Sedekah Subuh Haramain

Website donasi Sedekah Subuh untuk pembangunan dan operasional di Masjidil Haram & Masjid Nabawi.

**Dibuat dengan HTML, CSS, dan JavaScript murni (vanilla) - tanpa framework!**

## ✨ Fitur

- 🎨 **Clean & Responsive Design** - Tampilan profesional dengan aksen warna biru
- 💳 **Form Donasi** - Upload bukti transfer, pilih metode pembayaran
- 🔥 **Firebase RTDB** - Database real-time untuk menyimpan data donasi
- 🤖 **Telegram Bot** - Notifikasi otomatis & approval via BotFather
- 📧 **Email Notification** - Notifikasi via webmail
- 🖼️ **ImgBB API** - Upload bukti transfer ke ImgBB
- 🔐 **Admin Panel** - Dashboard untuk approve/reject donasi
- 📱 **Mobile First** - Responsive di semua perangkat

## 📁 Struktur File

```
├── index.html          # Halaman utama (HTML)
├── src/
│   ├── style.css       # Semua styling (CSS)
│   └── main.js         # Semua logic & integrasi (JavaScript)
├── .env.example        # Template konfigurasi
└── README.md           # Dokumentasi
```

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
4. Salin konfigurasi Firebase ke `src/main.js` di bagian `CONFIG.firebase`

### 2. Telegram Bot (BotFather)

1. Buka Telegram, cari **@BotFather**
2. Kirim `/newbot` dan ikuti instruksi
3. Catat **Bot Token** yang diberikan
4. Untuk mendapatkan **Chat ID**:
   - Kirim pesan ke bot Anda
   - Buka: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Cari `"chat":{"id": XXXXXXX}`
5. Masukkan token dan chat ID ke `CONFIG.telegram` di `src/main.js`

### 3. ImgBB API

1. Daftar di [ImgBB](https://imgbb.com/)
2. Dapatkan API Key dari dashboard
3. Masukkan ke `CONFIG.imgbb.apiKey` di `src/main.js`

### 4. Email Notification (Webmail)

Untuk notifikasi email, Anda bisa menggunakan:
- **EmailJS** (https://www.emailjs.com/)
- **Custom backend** dengan endpoint POST
- **Formspree** atau layanan serupa

Setup endpoint email di `CONFIG.email.serviceUrl` di `src/main.js`

### 5. Konfigurasi

Edit file `src/main.js` dan ubah bagian `CONFIG`:

```javascript
const CONFIG = {
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },
  telegram: {
    botToken: "YOUR_TELEGRAM_BOT_TOKEN",
    chatId: "YOUR_TELEGRAM_CHAT_ID"
  },
  imgbb: {
    apiKey: "YOUR_IMGBB_API_KEY"
  },
  email: {
    serviceUrl: "YOUR_EMAIL_SERVICE_URL"
  },
  admin: {
    password: "admin123"  // Ganti password admin
  }
};
```

## 🏗️ Development

Cukup buka `index.html` di browser, atau gunakan local server:

```bash
# Dengan Python
python -m http.server 8000

# Dengan Node.js
npx serve .

# Dengan PHP
php -S localhost:8000
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
- Default password: `admin123` (ubah di CONFIG)
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

- HTML5
- CSS3 (Custom, tanpa framework CSS)
- JavaScript ES6+ (Vanilla JS, tanpa framework)
- Firebase Realtime Database (Modular SDK)
- Telegram Bot API
- ImgBB API
- Font Awesome (Icons)
- Google Fonts (Plus Jakarta Sans & Amiri)

## 📄 License

MIT License

---

Dibuat dengan ❤️ untuk kebaikan umat
