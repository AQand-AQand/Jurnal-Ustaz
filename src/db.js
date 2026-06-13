import Dexie from 'dexie';

export const db = new Dexie('BukuUstazDB');

// Naik ke versi 4 untuk memastikan pembaruan sistem berjalan lancar di browser
db.version(4).stores({
  murid: '++id, nama, kelas',
  absensi: '++id, murid_id, status, tanggal'
});
