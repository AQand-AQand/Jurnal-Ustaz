self.addEventListener('install', (e) => {
  console.log('[Service Worker] Terinstal. Aplikasi siap offline sebagian.');
});

self.addEventListener('fetch', (e) => {
  // Biarkan kosong. Ini adalah syarat wajib Google Chrome agar aplikasi dianggap PWA.
});
