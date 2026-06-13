import Dexie from 'dexie';

export const db = new Dexie('DatabaseBukuUstaz');

// Skema tabel database diperbarui ke versi 2
db.version(2).stores({
  murid: '++id, nama, kelas',
  absensi: '++id, murid_id, tanggal, status, is_synced',
  jurnal: '++id, kategori, mapel, isi, tanggal, is_synced', // kategori: batas, perilaku, pr, dll
  soal: '++id, judul, isi, tipe, tanggal',
  nilai: '++id, murid_id, ulangan, tulis, lisan, is_synced'
});
