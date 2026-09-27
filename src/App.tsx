import { useState, useEffect } from 'react';
import { database, ref, push, onValue, set, get } from './firebase';

// Types
interface Donation {
  id?: string;
  name: string;
  amount: number;
  message: string;
  paymentMethod: string;
  proofUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  email?: string;
}

interface Config {
  telegramBotToken: string;
  telegramChatId: string;
  imgbbApiKey: string;
  emailServiceUrl: string;
  adminPassword: string;
}

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Upload to ImgBB
const uploadToImgBB = async (file: File, apiKey: string): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
    },
    body: formData,
  });
  
  const data = await response.json();
  if (data.success) {
    return data.data.url;
  }
  throw new Error('Upload failed');
};

// Send Telegram notification
const sendTelegramNotification = async (botToken: string, chatId: string, message: string) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Telegram notification failed:', error);
  }
};

// Send email notification
const sendEmailNotification = async (serviceUrl: string, donation: Donation) => {
  try {
    await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'admin@sedekahsubuhharamain.com',
        subject: `Donasi Baru - ${donation.name}`,
        body: `
          <h2>Donasi Baru Diterima</h2>
          <p><strong>Nama:</strong> ${donation.name}</p>
          <p><strong>Jumlah:</strong> ${formatCurrency(donation.amount)}</p>
          <p><strong>Metode:</strong> ${donation.paymentMethod}</p>
          <p><strong>Pesan:</strong> ${donation.message}</p>
          <p><strong>Bukti:</strong> <a href="${donation.proofUrl}">Lihat Bukti</a></p>
        `,
      }),
    });
  } catch (error) {
    console.error('Email notification failed:', error);
  }
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'admin'>('home');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load donations from Firebase
    const donationsRef = ref(database, 'donations');
    const unsubscribe = onValue(donationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const donationsList: Donation[] = Object.entries(data).map(([id, value]) => ({
          ...(value as Donation),
          id,
        }));
        const approved = donationsList.filter(d => d.status === 'approved');
        setDonations(approved.sort((a, b) => b.timestamp - a.timestamp));
        setTotalDonations(approved.reduce((sum, d) => sum + d.amount, 0));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (currentPage === 'admin') {
    return <AdminPanel onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <i className="fas fa-mosque text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-800">Sedekah Subuh</h1>
                <p className="text-xs text-gray-500 -mt-1">Haramain</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="#donasi" className="hidden sm:inline-block text-sm font-medium text-gray-600 hover:text-primary-600 transition">
                Donasi
              </a>
              <a href="#donatur" className="hidden sm:inline-block text-sm font-medium text-gray-600 hover:text-primary-600 transition">
                Donatur
              </a>
              <button 
                onClick={() => setCurrentPage('admin')}
                className="text-sm text-gray-400 hover:text-primary-600 transition"
              >
                <i className="fas fa-lock"></i>
              </button>
              <a 
                href="#donasi" 
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200"
              >
                Donasi Sekarang
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 islamic-pattern">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1920&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <i className="fas fa-star text-gold-400 text-sm"></i>
                <span className="text-white/90 text-sm font-medium">Program Sedekah Subuh</span>
              </div>
              
              <p className="font-arabic text-2xl sm:text-3xl text-gold-400 mb-4 leading-relaxed">
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
              </p>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Sedekah Subuh
                <span className="block text-gold-400">Haramain</span>
              </h1>
              
              <p className="text-lg text-white/80 mb-8 max-w-lg">
                Mari amalkan sedekah subuh untuk pembangunan dan operasional di dua tanah suci, 
                Masjidil Haram & Masjid Nabawi. Setiap subuh, setiap kebaikan dicatat.
              </p>

              <div className="flex flex-wrap gap-4">
                <a 
                  href="#donasi" 
                  className="bg-gold-500 hover:bg-gold-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-xl shadow-gold-500/30 flex items-center gap-2"
                >
                  <i className="fas fa-hand-holding-heart"></i>
                  Donasi Sekarang
                </a>
                <a 
                  href="#tentang" 
                  className="glass text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition flex items-center gap-2"
                >
                  <i className="fas fa-info-circle"></i>
                  Pelajari Lebih
                </a>
              </div>
            </div>

            <div className="hidden lg:block animate-float">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-400/20 to-primary-400/20 rounded-3xl blur-2xl"></div>
                <div className="relative glass rounded-3xl p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-mosque text-white text-3xl"></i>
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">Total Terkumpul</h3>
                    <p className="text-gold-400 text-3xl font-bold">{loading ? '...' : formatCurrency(totalDonations)}</p>
                    <p className="text-white/60 mt-2">{donations.length} Donatur</p>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-mosque text-primary-300"></i>
                      </div>
                      <p className="text-white/70 text-xs">Masjidil Haram</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-mosque text-primary-300"></i>
                      </div>
                      <p className="text-white/70 text-xs">Masjid Nabawi</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-quran text-primary-300"></i>
                      </div>
                      <p className="text-white/70 text-xs">Wakaf Quran</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-2xl bg-primary-50 border border-primary-100">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-users text-primary-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-primary-800">{donations.length}+</p>
              <p className="text-sm text-gray-500">Donatur</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-green-50 border border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-hand-holding-usd text-green-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-green-800">{loading ? '...' : formatCurrency(totalDonations)}</p>
              <p className="text-sm text-gray-500">Terkumpul</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gold-400/10 border border-gold-400/20">
              <div className="w-12 h-12 bg-gold-400/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-mosque text-gold-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-gold-600">2</p>
              <p className="text-sm text-gray-500">Masjid Target</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-purple-50 border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-calendar-check text-purple-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-purple-800">365</p>
              <p className="text-sm text-gray-500">Hari/Tahun</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-20 bg-gradient-to-b from-white to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary-100 text-primary-700 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Tentang Program
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Mengapa Sedekah Subuh?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Sedekah subuh adalah amalan yang sangat istimewa. Rasulullah SAW bersabda bahwa 
              sedekah di pagi hari memiliki keutamaan yang besar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg shadow-primary-100/50 border border-primary-50 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mb-6">
                <i className="fas fa-sun text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Keutamaan Subuh</h3>
              <p className="text-gray-600">
                "Ya Allah, berkahilah umatku di waktu paginya" (HR. Abu Dawud). Sedekah di waktu subuh 
                mendapat keberkahan khusus dari Allah SWT.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg shadow-primary-100/50 border border-primary-50 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fas fa-mosque text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Tanah Suci</h3>
              <p className="text-gray-600">
                Donasi disalurkan untuk pembangunan dan operasional di Masjidil Haram (Makkah) 
                dan Masjid Nabawi (Madinah) - dua masjid terbaik di dunia.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg shadow-primary-100/50 border border-primary-50 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center mb-6">
                <i className="fas fa-hand-holding-heart text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Transparan</h3>
              <p className="text-gray-600">
                Setiap donasi tercatat dan dilaporkan secara transparan. Bukti penyaluran 
                akan diupdate secara berkala untuk para donatur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Form Section */}
      <section id="donasi" className="py-20 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary-100 text-primary-700 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Form Donasi
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Sudah Berbagi Hari Ini?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Isi form di bawah ini untuk menyalurkan sedekah subuh Anda. 
              Setelah transfer, upload bukti pembayaran untuk verifikasi.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white rounded-2xl p-8 shadow-xl shadow-primary-100/50">
              <DonationForm />
            </div>

            {/* Payment Methods */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-xl shadow-primary-100/50">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <i className="fas fa-university text-primary-600"></i>
                  Metode Pembayaran
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">Bank Syariah Indonesia (BSI)</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Aktif</span>
                    </div>
                    <p className="text-primary-700 font-mono text-lg font-bold">7123 4567 890</p>
                    <p className="text-sm text-gray-500 mt-1">a.n. Yayasan Sedekah Subuh Haramain</p>
                  </div>

                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">Bank Muamalat</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Aktif</span>
                    </div>
                    <p className="text-primary-700 font-mono text-lg font-bold">3012 3456 789</p>
                    <p className="text-sm text-gray-500 mt-1">a.n. Yayasan Sedekah Subuh Haramain</p>
                  </div>

                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">QRIS</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Aktif</span>
                    </div>
                    <p className="text-sm text-gray-500">Scan QR Code untuk pembayaran digital</p>
                    <div className="mt-3 w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                      <i className="fas fa-qrcode text-gray-400 text-4xl"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <i className="fas fa-shield-alt text-gold-400 text-xl"></i>
                  <h4 className="font-bold">Konfirmasi Donasi</h4>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  Setelah melakukan transfer, silakan upload bukti pembayaran melalui form di samping. 
                  Admin akan memverifikasi dalam 1x24 jam.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <i className="fab fa-whatsapp text-green-400"></i>
                  <span>Konfirmasi via WhatsApp: 0812-xxxx-xxxx</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donors Section */}
      <section id="donatur" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary-100 text-primary-700 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Donatur
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Doa-Doa Orang Baik
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Terima kasih kepada seluruh donatur yang telah berpartisipasi dalam program Sedekah Subuh Haramain.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 mt-4">Memuat data donatur...</p>
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-12 bg-primary-50 rounded-2xl">
              <i className="fas fa-hand-holding-heart text-primary-300 text-5xl mb-4"></i>
              <p className="text-gray-500">Belum ada donasi. Jadilah yang pertama!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {donations.slice(0, 9).map((donation) => (
                <div key={donation.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-user text-primary-600"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">{donation.name}</h4>
                      <p className="text-primary-600 font-bold text-sm">{formatCurrency(donation.amount)}</p>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{donation.message || 'Tanpa pesan'}</p>
                      <p className="text-gray-400 text-xs mt-2">{formatDate(donation.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-800 to-primary-900 islamic-pattern relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl"></div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="font-arabic text-2xl text-gold-400 mb-4">
            مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا فَيُضَاعِفَهُ لَهُ أَضْعَافًا كَثِيرَةً
          </p>
          <p className="text-white/70 text-sm mb-6">
            "Siapakah yang mau memberi pinjaman kepada Allah, pinjaman yang baik (menafkahkan hartanya di jalan Allah), 
            maka Allah akan meperlipat gandakan pembayaran kepadanya dengan lipat ganda yang banyak." (QS. Al-Baqarah: 245)
          </p>
          <a 
            href="#donasi" 
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-xl shadow-gold-500/30"
          >
            <i className="fas fa-hand-holding-heart"></i>
            Donasi Sekarang
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <i className="fas fa-mosque text-white"></i>
                </div>
                <div>
                  <h3 className="font-bold">Sedekah Subuh Haramain</h3>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Program sedekah subuh untuk pembangunan dan operasional di dua tanah suci.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Kontak</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p><i className="fas fa-envelope mr-2 text-primary-400"></i>info@sedekahsubuhharamain.com</p>
                <p><i className="fas fa-phone mr-2 text-primary-400"></i>0812-xxxx-xxxx</p>
                <p><i className="fab fa-whatsapp mr-2 text-primary-400"></i>0812-xxxx-xxxx</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Ikuti Kami</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition">
                  <i className="fab fa-telegram"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition">
                  <i className="fab fa-youtube"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition">
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 Sedekah Subuh Haramain. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Donation Form Component
function DonationForm() {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
    paymentMethod: 'BSI',
    email: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const presetAmounts = [25000, 50000, 100000, 250000, 500000, 1000000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let proofUrl = '';
      
      // Upload proof to ImgBB if file exists
      if (proofFile) {
        const apiKey = import.meta.env.VITE_IMGBB_API_KEY || 'YOUR_IMGBB_KEY';
        proofUrl = await uploadToImgBB(proofFile, apiKey);
      }

      const donation: Donation = {
        name: formData.name,
        amount: parseInt(formData.amount),
        message: formData.message,
        paymentMethod: formData.paymentMethod,
        proofUrl,
        email: formData.email,
        status: 'pending',
        timestamp: Date.now(),
      };

      // Save to Firebase
      const donationsRef = ref(database, 'donations');
      const newRef = push(donationsRef);
      await set(newRef, donation);

      // Send Telegram notification
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';
      if (botToken && chatId) {
        await sendTelegramNotification(botToken, chatId, 
          `🕌 <b>Donasi Baru - Sedekah Subuh Haramain</b>\n\n` +
          `👤 <b>Nama:</b> ${donation.name}\n` +
          `💰 <b>Jumlah:</b> ${formatCurrency(donation.amount)}\n` +
          `🏦 <b>Metode:</b> ${donation.paymentMethod}\n` +
          `💬 <b>Pesan:</b> ${donation.message || '-'}\n` +
          `📎 <b>Bukti:</b> ${proofUrl || 'Tidak ada'}\n\n` +
          `⏳ Status: <b>Menunggu Verifikasi</b>\n` +
          `🆔 ID: ${newRef.key}`
        );
      }

      // Send email notification
      const emailServiceUrl = import.meta.env.VITE_EMAIL_SERVICE_URL || '';
      if (emailServiceUrl) {
        await sendEmailNotification(emailServiceUrl, donation);
      }

      setSuccess(true);
      setFormData({ name: '', amount: '', message: '', paymentMethod: 'BSI', email: '' });
      setProofFile(null);
    } catch (err) {
      setError('Gagal mengirim donasi. Silakan coba lagi.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check text-green-600 text-2xl"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Donasi Berhasil Dikirim!</h3>
        <p className="text-gray-600 mb-6">
          Terima kasih atas donasi Anda. Admin akan memverifikasi dalam 1x24 jam.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="text-primary-600 font-medium hover:text-primary-700"
        >
          Kirim Donasi Lagi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <i className="fas fa-exclamation-circle mr-2"></i>{error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition outline-none"
          placeholder="Masukkan nama lengkap"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition outline-none"
          placeholder="email@contoh.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Donasi *</label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setFormData({...formData, amount: amount.toString()})}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                formData.amount === amount.toString()
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {formatCurrency(amount)}
            </button>
          ))}
        </div>
        <input
          type="number"
          required
          min="1000"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition outline-none"
          placeholder="Atau masukkan jumlah lain (min. Rp 1.000)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran *</label>
        <select
          value={formData.paymentMethod}
          onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition outline-none"
        >
          <option value="BSI">Bank Syariah Indonesia (BSI)</option>
          <option value="Muamalat">Bank Muamalat</option>
          <option value="QRIS">QRIS</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Doa / Pesan</label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition outline-none resize-none"
          placeholder="Tuliskan doa atau pesan Anda (opsional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Transfer *</label>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-400 transition cursor-pointer relative">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            required
          />
          {proofFile ? (
            <div>
              <i className="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
              <p className="text-sm text-gray-600">{proofFile.name}</p>
            </div>
          ) : (
            <div>
              <i className="fas fa-cloud-upload-alt text-gray-400 text-2xl mb-2"></i>
              <p className="text-sm text-gray-500">Klik atau drag file untuk upload bukti transfer</p>
              <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG (Max 5MB)</p>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-primary-800 transition shadow-xl shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Mengirim...
          </>
        ) : (
          <>
            <i className="fas fa-paper-plane"></i>
            Kirim Donasi
          </>
        )}
      </button>
    </form>
  );
}

// Admin Panel Component
function AdminPanel({ onBack }: { onBack: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingDonations, setPendingDonations] = useState<Donation[]>([]);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const donationsRef = ref(database, 'donations');
      const unsubscribe = onValue(donationsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const donationsList: Donation[] = Object.entries(data).map(([id, value]) => ({
            ...(value as Donation),
            id,
          }));
          setPendingDonations(donationsList.sort((a, b) => b.timestamp - a.timestamp));
        }
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      setIsAuthenticated(true);
    } else {
      setAuthError('Password salah!');
    }
  };

  const handleApprove = async (donation: Donation) => {
    const donationRef = ref(database, `donations/${donation.id}`);
    await set(donationRef, { ...donation, status: 'approved' });

    // Send Telegram approval notification
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';
    if (botToken && chatId) {
      await sendTelegramNotification(botToken, chatId,
        `✅ <b>Donasi Disetujui</b>\n\n` +
        `👤 Nama: ${donation.name}\n` +
        `💰 Jumlah: ${formatCurrency(donation.amount)}\n` +
        `🆔 ID: ${donation.id}`
      );
    }
  };

  const handleReject = async (donation: Donation) => {
    const donationRef = ref(database, `donations/${donation.id}`);
    await set(donationRef, { ...donation, status: 'rejected' });

    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';
    if (botToken && chatId) {
      await sendTelegramNotification(botToken, chatId,
        `❌ <b>Donasi Ditolak</b>\n\n` +
        `👤 Nama: ${donation.name}\n` +
        `💰 Jumlah: ${formatCurrency(donation.amount)}\n` +
        `🆔 ID: ${donation.id}`
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lock text-primary-600 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
            <p className="text-gray-500 text-sm mt-1">Masukkan password untuk mengakses</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {authError}
              </div>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition outline-none"
              placeholder="Password admin"
            />
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition"
            >
              Masuk
            </button>
          </form>

          <button onClick={onBack} className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm">
            <i className="fas fa-arrow-left mr-2"></i>Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-mosque text-white"></i>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
                <p className="text-xs text-gray-500">Sedekah Subuh Haramain</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                <i className="fas fa-bell mr-1"></i>
                {pendingDonations.filter(d => d.status === 'pending').length} pending
              </span>
              <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">
                <i className="fas fa-external-link-alt mr-1"></i>Lihat Website
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {pendingDonations.filter(d => d.status === 'pending').length}
                </p>
                <p className="text-xs text-gray-500">Menunggu</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-green-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {pendingDonations.filter(d => d.status === 'approved').length}
                </p>
                <p className="text-xs text-gray-500">Disetujui</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-times text-red-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {pendingDonations.filter(d => d.status === 'rejected').length}
                </p>
                <p className="text-xs text-gray-500">Ditolak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Donations */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-5 border-b">
            <h2 className="text-lg font-bold text-gray-800">
              <i className="fas fa-list mr-2 text-primary-600"></i>
              Daftar Donasi
            </h2>
          </div>
          
          <div className="divide-y">
            {pendingDonations.length === 0 ? (
              <div className="p-12 text-center">
                <i className="fas fa-inbox text-gray-300 text-4xl mb-3"></i>
                <p className="text-gray-500">Belum ada donasi masuk</p>
              </div>
            ) : (
              pendingDonations.map((donation) => (
                <div key={donation.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{donation.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          donation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          donation.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {donation.status === 'pending' ? 'Pending' : 
                           donation.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </div>
                      <p className="text-primary-600 font-bold">{formatCurrency(donation.amount)}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        <i className="fas fa-university mr-1"></i>{donation.paymentMethod} • 
                        <i className="fas fa-clock ml-2 mr-1"></i>{formatDate(donation.timestamp)}
                      </p>
                      {donation.message && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{donation.message}"</p>
                      )}
                      {donation.proofUrl && (
                        <a href={donation.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline mt-1 inline-block">
                          <i className="fas fa-image mr-1"></i>Lihat Bukti Transfer
                        </a>
                      )}
                    </div>
                    
                    {donation.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(donation)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-1"
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button
                          onClick={() => handleReject(donation)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-1"
                        >
                          <i className="fas fa-times"></i> Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Config Info */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">
            <i className="fas fa-cog mr-2 text-gray-500"></i>
            Konfigurasi Integrasi
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <i className="fab fa-telegram text-blue-500"></i>
              <span className="text-gray-600">Telegram Bot: {import.meta.env.VITE_TELEGRAM_BOT_TOKEN ? '✅ Terhubung' : '⚠️ Belum dikonfigurasi'}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-database text-green-500"></i>
              <span className="text-gray-600">Firebase RTDB: {import.meta.env.VITE_FIREBASE_DATABASE_URL ? '✅ Terhubung' : '⚠️ Belum dikonfigurasi'}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-image text-purple-500"></i>
              <span className="text-gray-600">ImgBB API: {import.meta.env.VITE_IMGBB_API_KEY ? '✅ Terhubung' : '⚠️ Belum dikonfigurasi'}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-envelope text-red-500"></i>
              <span className="text-gray-600">Email Service: {import.meta.env.VITE_EMAIL_SERVICE_URL ? '✅ Terhubung' : '⚠️ Belum dikonfigurasi'}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
