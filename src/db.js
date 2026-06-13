import Dexie from 'dexie';

export const db = new Dexie('BukuUstazDB');

// Versi ditingkatkan ke 3 untuk memastikan tabel baru terbuat dengan bersih
db.version(3).stores({
  murid: '++id, nama, kelas',
  absensi: '++id, murid_id, status, tanggal'
});
