import Dexie from 'dexie';

export const db = new Dexie('BukuUstazDB');

// Naik ke versi 5 untuk menambahkan tabel jurnal materi mengajar
db.version(5).stores({
  kelas: '++id, nama',
  murid: '++id, nama, kelas',
  absensi: '++id, murid_id, status, tanggal',
  jurnal: '++id, kelas, tanggal, materi' 
});
