self.addEventListener('install', (e) => {
  console.log('[Service Worker] Terinstal');
});

// Fetch listener kosong ini wajib ada agar Chrome menganggap aplikasi ini bisa offline (PWA)
self.addEventListener('fetch', (e) => {
  // Biarkan kosong
});