// ========================================
// Sedekah Subuh Haramain - Main JavaScript
// ========================================

// Configuration (Replace with your actual values)
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
    password: "admin123"
  }
};

// Initialize Firebase
let db = null;
try {
  if (CONFIG.firebase.apiKey !== "YOUR_FIREBASE_API_KEY" && typeof firebase !== 'undefined') {
    firebase.initializeApp(CONFIG.firebase);
    db = firebase.database();
    console.log('✅ Firebase initialized');
  } else {
    console.warn('⚠️ Firebase not configured - using demo mode');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// ========================================
// Utility Functions
// ========================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<p>${message}</p>`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========================================
// Navigation
// ========================================

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('active');
}

function closeMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.remove('active');
}

// ========================================
// Donation Form
// ========================================

let selectedFile = null;

function setAmount(amount) {
  document.getElementById('donorAmount').value = amount;
  
  // Update active state
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    selectedFile = file;
    const uploadArea = document.getElementById('uploadArea');
    const uploadContent = document.getElementById('uploadContent');
    
    uploadArea.classList.add('has-file');
    uploadContent.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <p>${file.name}</p>
      <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
    `;
  }
}

async function uploadToImgBB(file) {
  if (!CONFIG.imgbb.apiKey || CONFIG.imgbb.apiKey === "YOUR_IMGBB_API_KEY") {
    console.warn('ImgBB not configured, skipping upload');
    return '';
  }

  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'X-API-Key': CONFIG.imgbb.apiKey
      },
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    }
    throw new Error('Upload failed');
  } catch (error) {
    console.error('ImgBB upload error:', error);
    throw error;
  }
}

async function sendTelegramNotification(message) {
  if (!CONFIG.telegram.botToken || CONFIG.telegram.botToken === "YOUR_TELEGRAM_BOT_TOKEN") {
    console.warn('Telegram not configured');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.telegram.chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
}

async function sendEmailNotification(donation) {
  if (!CONFIG.email.serviceUrl || CONFIG.email.serviceUrl === "YOUR_EMAIL_SERVICE_URL") {
    console.warn('Email service not configured');
    return;
  }

  try {
    await fetch(CONFIG.email.serviceUrl, {
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
          <p><strong>Pesan:</strong> ${donation.message || '-'}</p>
          <p><strong>Bukti:</strong> <a href="${donation.proofUrl}">Lihat Bukti</a></p>
        `
      })
    });
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

async function handleDonation(event) {
  event.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const form = document.getElementById('donationForm');
  const successMessage = document.getElementById('successMessage');
  
  // Disable button
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="spinner-sm"></div><span>Mengirim...</span>';

  try {
    // Get form data
    const donation = {
      name: document.getElementById('donorName').value,
      email: document.getElementById('donorEmail').value,
      amount: parseInt(document.getElementById('donorAmount').value),
      paymentMethod: document.getElementById('paymentMethod').value,
      message: document.getElementById('donorMessage').value,
      proofUrl: '',
      status: 'pending',
      timestamp: Date.now()
    };

    // Upload proof to ImgBB
    if (selectedFile) {
      donation.proofUrl = await uploadToImgBB(selectedFile);
    }

    // Save to Firebase
    if (db) {
      const donationsRef = db.ref('donations');
      const newRef = donationsRef.push();
      await newRef.set(donation);

      // Send Telegram notification
      const telegramMessage = 
        `🕌 <b>Donasi Baru - Sedekah Subuh Haramain</b>\n\n` +
        `👤 <b>Nama:</b> ${donation.name}\n` +
        `💰 <b>Jumlah:</b> ${formatCurrency(donation.amount)}\n` +
        `🏦 <b>Metode:</b> ${donation.paymentMethod}\n` +
        `💬 <b>Pesan:</b> ${donation.message || '-'}\n` +
        `📎 <b>Bukti:</b> ${donation.proofUrl || 'Tidak ada'}\n\n` +
        `⏳ Status: <b>Menunggu Verifikasi</b>\n` +
        `🆔 ID: ${newRef.key}`;
      
      await sendTelegramNotification(telegramMessage);

      // Send email notification
      await sendEmailNotification(donation);
    } else {
      console.log('Demo mode - donation data:', donation);
      showToast('Demo mode: Donasi berhasil (simulasi)', 'success');
    }

    // Show success message
    form.style.display = 'none';
    successMessage.style.display = 'block';
    
    showToast('Donasi berhasil dikirim!', 'success');

  } catch (error) {
    console.error('Donation error:', error);
    showToast('Gagal mengirim donasi. Silakan coba lagi.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Kirim Donasi</span>';
  }
}

function resetForm() {
  const form = document.getElementById('donationForm');
  const successMessage = document.getElementById('successMessage');
  
  form.reset();
  form.style.display = 'block';
  successMessage.style.display = 'none';
  
  // Reset file upload
  selectedFile = null;
  const uploadArea = document.getElementById('uploadArea');
  const uploadContent = document.getElementById('uploadContent');
  uploadArea.classList.remove('has-file');
  uploadContent.innerHTML = `
    <i class="fas fa-cloud-upload-alt"></i>
    <p>Klik atau drag file untuk upload bukti transfer</p>
    <span>Format: JPG, PNG (Max 5MB)</span>
  `;
  
  // Reset preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.remove('active');
  });
}

// ========================================
// Load Donations
// ========================================

function loadDonations() {
  const donorsGrid = document.getElementById('donorsGrid');
  
  if (!db) {
    // Demo mode
    donorsGrid.innerHTML = `
      <div class="empty-donors">
        <i class="fas fa-hand-holding-heart"></i>
        <p>Belum ada donasi. Jadilah yang pertama!</p>
      </div>
    `;
    updateStats(0, 0);
    return;
  }

  const donationsRef = db.ref('donations');
  
  donationsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    
    if (!data) {
      donorsGrid.innerHTML = `
        <div class="empty-donors">
          <i class="fas fa-hand-holding-heart"></i>
          <p>Belum ada donasi. Jadilah yang pertama!</p>
        </div>
      `;
      updateStats(0, 0);
      return;
    }

    // Filter approved donations
    const donations = Object.entries(data)
      .map(([id, value]) => ({ id, ...value }))
      .filter(d => d.status === 'approved')
      .sort((a, b) => b.timestamp - a.timestamp);

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    
    updateStats(donations.length, totalAmount);

    if (donations.length === 0) {
      donorsGrid.innerHTML = `
        <div class="empty-donors">
          <i class="fas fa-hand-holding-heart"></i>
          <p>Belum ada donasi. Jadilah yang pertama!</p>
        </div>
      `;
      return;
    }

    // Render donor cards
    donorsGrid.innerHTML = donations.slice(0, 9).map(donation => `
      <div class="donor-card">
        <div class="donor-header">
          <div class="donor-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="donor-info">
            <h4>${donation.name}</h4>
            <p class="donor-amount">${formatCurrency(donation.amount)}</p>
            ${donation.message ? `<p class="donor-message">"${donation.message}"</p>` : ''}
            <p class="donor-date">${formatDate(donation.timestamp)}</p>
          </div>
        </div>
      </div>
    `).join('');
  });
}

function updateStats(count, total) {
  document.getElementById('totalAmount').textContent = formatCurrency(total);
  document.getElementById('totalDonors').textContent = count;
  document.getElementById('statDonors').textContent = count + '+';
  document.getElementById('statAmount').textContent = formatCurrency(total);
}

// ========================================
// Admin Panel
// ========================================

function showAdmin() {
  document.getElementById('adminOverlay').style.display = 'block';
  document.getElementById('adminLogin').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
  document.body.style.overflow = 'hidden';
}

function closeAdmin() {
  document.getElementById('adminOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

function handleAdminLogin(event) {
  event.preventDefault();
  
  const password = document.getElementById('adminPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  if (password === CONFIG.admin.password) {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadAdminDonations();
    updateConfigStatus();
  } else {
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 3000);
  }
}

function loadAdminDonations() {
  if (!db) {
    document.getElementById('adminDonationList').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>Demo mode - Firebase belum dikonfigurasi</p>
      </div>
    `;
    return;
  }

  const donationsRef = db.ref('donations');
  
  donationsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    const listBody = document.getElementById('adminDonationList');
    
    if (!data) {
      listBody.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>Belum ada donasi masuk</p>
        </div>
      `;
      updateAdminStats(0, 0, 0);
      return;
    }

    const donations = Object.entries(data)
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.timestamp - a.timestamp);

    const pending = donations.filter(d => d.status === 'pending').length;
    const approved = donations.filter(d => d.status === 'approved').length;
    const rejected = donations.filter(d => d.status === 'rejected').length;

    updateAdminStats(pending, approved, rejected);

    if (donations.length === 0) {
      listBody.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>Belum ada donasi masuk</p>
        </div>
      `;
      return;
    }

    listBody.innerHTML = donations.map(donation => `
      <div class="admin-donation-item">
        <div class="admin-item-top">
          <div class="admin-item-info">
            <h4>
              ${donation.name}
              <span class="status-badge status-${donation.status}">
                ${donation.status === 'pending' ? 'Pending' : donation.status === 'approved' ? 'Approved' : 'Rejected'}
              </span>
            </h4>
            <p class="admin-item-amount">${formatCurrency(donation.amount)}</p>
            <p class="admin-item-meta">
              <i class="fas fa-university"></i> ${donation.paymentMethod} • 
              <i class="fas fa-clock"></i> ${formatDate(donation.timestamp)}
            </p>
            ${donation.message ? `<p class="admin-item-message">"${donation.message}"</p>` : ''}
            ${donation.proofUrl ? `<a href="${donation.proofUrl}" target="_blank" class="admin-item-proof"><i class="fas fa-image"></i> Lihat Bukti Transfer</a>` : ''}
          </div>
          
          ${donation.status === 'pending' ? `
            <div class="admin-item-actions">
              <button class="btn-approve" onclick="approveDonation('${donation.id}')">
                <i class="fas fa-check"></i> Approve
              </button>
              <button class="btn-reject" onclick="rejectDonation('${donation.id}')">
                <i class="fas fa-times"></i> Tolak
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  });
}

function updateAdminStats(pending, approved, rejected) {
  document.getElementById('adminPending').textContent = pending;
  document.getElementById('adminApproved').textContent = approved;
  document.getElementById('adminRejected').textContent = rejected;
  document.getElementById('pendingCount').textContent = pending;
}

async function approveDonation(donationId) {
  if (!db) return;

  try {
    const donationRef = db.ref(`donations/${donationId}`);
    const snapshot = await donationRef.once('value');
    const donation = snapshot.val();

    await donationRef.update({ status: 'approved' });

    // Send Telegram notification
    const message = 
      `✅ <b>Donasi Disetujui</b>\n\n` +
      `👤 Nama: ${donation.name}\n` +
      `💰 Jumlah: ${formatCurrency(donation.amount)}\n` +
      `🆔 ID: ${donationId}`;
    
    await sendTelegramNotification(message);
    
    showToast('Donasi berhasil disetujui', 'success');
  } catch (error) {
    console.error('Approve error:', error);
    showToast('Gagal menyetujui donasi', 'error');
  }
}

async function rejectDonation(donationId) {
  if (!db) return;

  try {
    const donationRef = db.ref(`donations/${donationId}`);
    const snapshot = await donationRef.once('value');
    const donation = snapshot.val();

    await donationRef.update({ status: 'rejected' });

    // Send Telegram notification
    const message = 
      `❌ <b>Donasi Ditolak</b>\n\n` +
      `👤 Nama: ${donation.name}\n` +
      `💰 Jumlah: ${formatCurrency(donation.amount)}\n` +
      `🆔 ID: ${donationId}`;
    
    await sendTelegramNotification(message);
    
    showToast('Donasi ditolak', 'info');
  } catch (error) {
    console.error('Reject error:', error);
    showToast('Gagal menolak donasi', 'error');
  }
}

function updateConfigStatus() {
  document.getElementById('configTelegram').textContent = 
    CONFIG.telegram.botToken && CONFIG.telegram.botToken !== "YOUR_TELEGRAM_BOT_TOKEN" 
      ? '✅ Terhubung' 
      : '⚠️ Belum dikonfigurasi';
  
  document.getElementById('configFirebase').textContent = 
    CONFIG.firebase.apiKey && CONFIG.firebase.apiKey !== "YOUR_FIREBASE_API_KEY" 
      ? '✅ Terhubung' 
      : '⚠️ Belum dikonfigurasi';
  
  document.getElementById('configImgbb').textContent = 
    CONFIG.imgbb.apiKey && CONFIG.imgbb.apiKey !== "YOUR_IMGBB_API_KEY" 
      ? '✅ Terhubung' 
      : '⚠️ Belum dikonfigurasi';
  
  document.getElementById('configEmail').textContent = 
    CONFIG.email.serviceUrl && CONFIG.email.serviceUrl !== "YOUR_EMAIL_SERVICE_URL" 
      ? '✅ Terhubung' 
      : '⚠️ Belum dikonfigurasi';
}

// ========================================
// Initialize
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  loadDonations();
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Navbar scroll effect
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
      navbar.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
    }
    
    lastScroll = currentScroll;
  });
});

// Expose functions to global scope for HTML onclick handlers
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.setAmount = setAmount;
window.handleFileSelect = handleFileSelect;
window.handleDonation = handleDonation;
window.resetForm = resetForm;
window.showAdmin = showAdmin;
window.closeAdmin = closeAdmin;
window.handleAdminLogin = handleAdminLogin;
window.approveDonation = approveDonation;
window.rejectDonation = rejectDonation;

console.log('🕌 Sedekah Subuh Haramain loaded successfully');
console.log('📝 Configure your services in the CONFIG object at the top of main.js');
