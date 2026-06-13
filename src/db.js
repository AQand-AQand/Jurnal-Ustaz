import Dexie from 'dexie';

export const db = new Dexie('DatabaseBukuUstaz');

// Skema tabel database (id otomatis bertambah)
db.version(1).stores({
  murid: '++id, nama, kelas',
  absensi: '++id, murid_id, tanggal, status, is_synced',
  jurnal: '++id, kelas, materi, tanggal, is_synced'
});
