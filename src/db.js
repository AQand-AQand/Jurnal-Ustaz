import Dexie from 'dexie';

export const db = new Dexie('BukuUstazProV2');

// Registrasi seluruh tabel yang dibutuhkan sistem (Versi 1)
db.version(1).stores({
  kelas: '++id, nama',
  murid: '++id, nama, kelas, alamat, domisili',
  absensiv2: '++id, murid_id, status, tanggal',
  nilai: '++id, murid_id, ulangan, ujian_tulis, ujian_lisan, akhlaq, total',
  bank_soal: '++id, kelas, fan_pelajaran, teks_soal',
  batas_pelajaran: '++id, kelas, mata_pelajaran, bab, halaman, pr_target, catatan',
  muhafadhoh: '++id, murid_id, setoran_terakhir, target_berikutnya, status_lancar',
  undangan_rapat: '++id, acara, tanggal, jam, tempat',
  jadwal_mengajar: '++id, hari, jam, kelas, mata_pelajaran'
});
