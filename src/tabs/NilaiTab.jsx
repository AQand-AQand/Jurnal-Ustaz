// File: src/tabs/NilaiTab.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function NilaiTab({ listNilai, setListNilai, muridList, listJadwal, user, isOffline }) {
  // === STATE INTERNAL NILAI ===
  const [filterKelas, setFilterKelas] = useState('');
  const [filterPelajaran, setFilterPelajaran] = useState('');
  const [jenisUjian, setJenisUjian] = useState('Harian'); // Pilihan: Harian, UTS, UAS
  const [tempNilai, setTempNilai] = useState({}); // Menyimpan input angka sementara sebelum disimpan

  // Sinkronisasi data unik untuk Dropdown
  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))].filter(Boolean).sort();
  const listPelajaranUnik = [...new Set(listJadwal.map(j => j.pelajaran))].filter(Boolean).sort();

  const checkConnection = () => {
    if (isOffline) {
      alert("Aplikasi offline! Nilai disimpan di HP sementara waktu.");
      return false;
    }
    return true;
  };

  // === FUNGSI SIMPAN NILAI MASAL (BULK SAVE) ===
  const handleSimpanNilaiBulk = async () => {
    if (!filterKelas || !filterPelajaran || !jenisUjian) {
      return alert("Lengkapi pilihan Kelas, Mata Pelajaran, dan Jenis Ujian terlebih dahulu!");
    }

    const muridDiKelas = muridList.filter(m => m.kelas === filterKelas);
    if (muridDiKelas.length === 0) return alert("Tidak ada santri di kelas ini!");

    const dataToSave = [];

    muridDiKelas.forEach(m => {
      // Cek apakah nilai lama dengan parameter yang sama sudah ada (untuk mode edit otomatis)
      const existing = listNilai.find(n => 
        n.murid_id === m.id && 
        n.pelajaran === filterPelajaran && 
        n.jenis_ujian === jenisUjian
      );

      // Ambil nilai baru dari input, jika kosong gunakan nilai lama, jika benar-benar kosong set ke 0
      const nilaiInput = tempNilai[m.id] !== undefined ? tempNilai[m.id] : (existing ? existing.nilai : '');
      const safeId = existing ? existing.id : Math.floor(Math.random() * 10000000);

      // Hanya simpan jika nilai tidak kosong
      if (nilaiInput !== '') {
        dataToSave.push({
          id: safeId,
          murid_id: m.id,
          pelajaran: filterPelajaran,
          jenis_ujian: jenisUjian,
          nilai: parseFloat(nilaiInput) || 0,
          ustadz_email: user?.email,
          created_at: existing ? existing.created_at : new Date().toISOString()
        });
      }
    });

    if (dataToSave.length === 0) return alert("Silakan isi minimal satu nilai santri!");

    // Bersihkan data lama di lokal agar tidak duplikat koordinatnya
    const filteredOld = listNilai.filter(n => {
      const isSameMurid = muridDiKelas.some(m => m.id === n.murid_id);
      const isSameConfig = n.pelajaran === filterPelajaran && n.jenis_ujian === jenisUjian;
      return !(isSameMurid && isSameConfig);
    });

    // Perbarui state lokal
    const updatedNilai = [...dataToSave, ...filteredOld];
    setListNilai(updatedNilai);
    alert("Berhasil menyimpan rapot nilai akademik santri!");
    setTempNilai({}); // Reset form input sementara

    // Sinkronisasi ke Supabase Cloud jika Online
    if (checkConnection()) {
      try {
        const muridIds = muridDiKelas.map(m => m.id);
        // Hapus data lama di cloud yang bentrok, lalu insert ulang bulk yang baru
        await supabase.from('nilai_ujian').delete()
          .in('murid_id', muridIds).eq('pelajaran', filterPelajaran).eq('jenis_ujian', jenisUjian);
        
        await supabase.from('nilai_ujian').insert(dataToSave);
      } catch (err) {
        console.error("Gagal sinkron cloud nilai:", err);
      }
    }
  };

  // Ambil daftar murid sesuai filter kelas
  const muridTersaring = muridList.filter(m => m.kelas === filterKelas).sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* PANEL ATAS: CONFIG FILTER */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm text-emerald-600 uppercase tracking-wide">Input Nilai Akademik</h3>
          <p className="text-[10px] text-slate-400">Kelola nilai ujian, ujian tengah semester, dan capaian harian.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t pt-2">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Pilih Kelas</label>
            <select 
              className="border p-2.5 rounded-xl text-xs w-full outline-none bg-slate-50 text-slate-700 font-semibold"
              value={filterKelas}
              onChange={e => { setFilterKelas(e.target.value); setTempNilai({}); }}
            >
              <option value="">-- Kelas --</option>
              {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Mata Pelajaran</label>
            <select 
              className="border p-2.5 rounded-xl text-xs w-full outline-none bg-slate-50 text-slate-700 font-semibold"
              value={filterPelajaran}
              onChange={e => { setFilterPelajaran(e.target.value); setTempNilai({}); }}
            >
              <option value="">-- Pelajaran --</option>
              {listPelajaranUnik.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Kategori Ujian</label>
          <div className="grid grid-cols-3 gap-1">
            {['Harian', 'UTS', 'UAS'].map(tipe => (
              <button
                key={tipe}
                type="button"
                onClick={() => { setJenisUjian(tipe); setTempNilai({}); }}
                className={`py-2 text-xs font-bold rounded-lg transition border ${jenisUjian === tipe ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-slate-50 text-slate-500'}`}
              >
                {tipe}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FORM INPUT DAFTAR MURID */}
      {filterKelas && filterPelajaran && (
        <div className="space-y-2">
          <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl text-[11px] font-medium border border-emerald-200">
            📝 <b>Petunjuk:</b> Masukkan angka nilai (0-100) langsung pada kolom nama santri, lalu klik tombol simpan di bawah.
          </div>

          {muridTersaring.map(m => {
            // Cari data nilai yang sudah tersimpan sebelumnya (jika ada)
            const existingData = listNilai.find(n => 
              n.murid_id === m.id && 
              n.pelajaran === filterPelajaran && 
              n.jenis_ujian === jenisUjian
            );
            
            // Value input ditentukan oleh ketikan baru, jika tidak ada ketikan baru pakai data lama
            const nilaiSaatIni = tempNilai[m.id] !== undefined ? tempNilai[m.id] : (existingData ? existingData.nilai : '');

            return (
              <div key={m.id} className="bg-white p-3 rounded-xl border flex items-center justify-between shadow-sm">
                <div className="flex-1 pr-2">
                  <p className="text-sm font-semibold text-slate-700 leading-tight">{m.nama}</p>
                  {existingData && (
                    <span className="text-[9px] text-emerald-600 font-medium">Terbaca di database: {existingData.nilai}</span>
                  )}
                </div>

                <div className="w-20">
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    className="w-full text-center border p-2 rounded-xl text-sm font-bold bg-slate-50 text-slate-800 outline-none focus:ring-2 ring-emerald-500"
                    value={nilaiSaatIni}
                    onChange={e => setTempNilai({ ...tempNilai, [m.id]: e.target.value })}
                  />
                </div>
              </div>
            );
          })}

          <button 
            onClick={handleSimpanNilaiBulk}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <i className="fa-solid fa-square-check"></i> Simpan Semua Nilai Kelas {filterKelas}
          </button>
        </div>
      )}

      {(!filterKelas || !filterPelajaran) && (
        <div className="text-center text-xs text-slate-400 py-12 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
          Silakan tentukan Pilihan Kelas dan Mata Pelajaran terlebih dahulu.
        </div>
      )}

    </div>
  );
}
