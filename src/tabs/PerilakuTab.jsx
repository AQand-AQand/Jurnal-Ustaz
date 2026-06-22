// File: src/tabs/PerilakuTab.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PerilakuTab({ listPerilaku, setListPerilaku, muridList, user, isOffline }) {
  // === STATE INTERNAL PERILAKU ===
  const [filterKelas, setFilterKelas] = useState('');
  const [cariNama, setCariNama] = useState('');
  const [selectedMurid, setSelectedMurid] = useState(null); // Santri yang akan diberi catatan
  
  // State Form Catatan Akhlak Baru
  const [formPerilaku, setFormPerilaku] = useState({ tipe: 'Positif', judul: '', catatan: '' });

  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))].filter(Boolean).sort();

  const checkConnection = () => {
    if (isOffline) {
      alert("Aplikasi offline! Catatan sikap disimpan di HP sementara waktu.");
      return false;
    }
    return true;
  };

  // === FUNGSI TAMBAH CATATAN SIKAP ===
  const handleSimpanPerilaku = async (e) => {
    e.preventDefault();
    if (!selectedMurid) return alert("Pilih santri terlebih dahulu!");
    if (!formPerilaku.judul) return alert("Kategori atau judul sikap wajib diisi!");

    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newCatatan = {
      id: safeLocalId,
      murid_id: selectedMurid.id,
      tipe: formPerilaku.tipe, // 'Positif' atau 'Negatif'
      judul: formPerilaku.judul.trim(),
      catatan: formPerilaku.catatan.trim(),
      ustadz_email: user?.email,
      created_at: new Date().toISOString()
    };

    // Update state lokal (Responsive UI)
    const updatedPerilaku = [newCatatan, ...listPerilaku];
    setListPerilaku(updatedPerilaku);
    alert(`Catatan akhlak untuk ${selectedMurid.nama} berhasil disimpan!`);

    // Reset Form & Tutup Modal
    setFormPerilaku({ tipe: 'Positif', judul: '', catatan: '' });
    setSelectedMurid(null);

    // Kirim ke database cloud Supabase
    if (checkConnection()) {
      try {
        await supabase.from('catatan_perilaku').insert([newCatatan]);
      } catch (err) {
        console.error("Gagal sinkron cloud:", err);
      }
    }
  };

  // === FUNGSI HAPUS CATATAN SIKAP ===
  const handleHapusPerilaku = async (id) => {
    if (!window.confirm("Hapus catatan sikap/perilaku ini?")) return;
    setListPerilaku(listPerilaku.filter(p => p.id !== id));
    if (checkConnection()) {
      await supabase.from('catatan_perilaku').delete().eq('id', id);
    }
  };

  // Filter List Santri
  const muridTersaring = muridList.filter(m => {
    const matchKelas = filterKelas === '' ? true : m.kelas === filterKelas;
    const matchNama = m.nama.toLowerCase().includes(cariNama.toLowerCase());
    return matchKelas && matchNama;
  }).sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* PANEL ATAS: INFO & FILTER */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm text-emerald-600 uppercase tracking-wide">Jurnal Sikap & Karakter Santri</h3>
          <p className="text-[10px] text-slate-400">Rekam poin pujian (prestasi) atau teguran (pelanggaran) santri.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t pt-2">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Pilih Kelas</label>
            <select 
              className="border p-2 rounded-lg text-xs w-full outline-none bg-slate-50 text-slate-700 font-medium"
              value={filterKelas}
              onChange={e => { setFilterKelas(e.target.value); setSelectedMurid(null); }}
            >
              <option value="">Semua Kelas</option>
              {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Cari Nama</label>
            <input 
              type="text"
              placeholder="Cari santri..."
              className="border p-2 rounded-lg text-xs w-full outline-none bg-slate-50 text-slate-700"
              value={cariNama}
              onChange={e => setCariNama(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* MODAL INPUT JURNAL SIKAP */}
      {selectedMurid && (
        <div className="bg-gradient-to-br from-slate-900/40 to-slate-900/60 fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 backdrop-blur-sm">
          <form onSubmit={handleSimpanPerilaku} className="bg-white w-full max-w-md p-5 rounded-3xl shadow-2xl space-y-4 border border-slate-200 animate-slide-up">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase">Jurnal Akhlak</span>
                <h4 className="font-bold text-slate-800 text-sm mt-0.5">{selectedMurid.nama}</h4>
              </div>
              <button type="button" onClick={() => setSelectedMurid(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-circle-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Jenis Evaluasi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormPerilaku({ ...formPerilaku, tipe: 'Positif' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${formPerilaku.tipe === 'Positif' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-400'}`}
                  >
                    👍 Kebaikan / Prestasi
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormPerilaku({ ...formPerilaku, tipe: 'Negatif' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${formPerilaku.tipe === 'Negatif' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'bg-slate-50 text-slate-400'}`}
                  >
                    ⚠️ Pelanggaran / Teguran
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Judul Tindakan / Perilaku</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Membantu bersihkan masjid, Terlambat jamaah" 
                  className="w-full border rounded-xl p-2.5 text-xs outline-none bg-slate-50 focus:ring-2 ring-emerald-500 font-medium"
                  value={formPerilaku.judul}
                  onChange={e => setFormPerilaku({ ...formPerilaku, judul: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Keterangan Tambahan (Opsional)</label>
                <textarea 
                  rows="2"
                  placeholder="Tulis detail kronologi atau catatan khusus ustadz..." 
                  className="w-full border rounded-xl p-2.5 text-xs outline-none bg-slate-50 focus:ring-2 ring-emerald-500 text-slate-700"
                  value={formPerilaku.catatan}
                  onChange={e => setFormPerilaku({ ...formPerilaku, catatan: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs shadow hover:bg-emerald-700 transition">
              Simpan ke Jurnal Santri
            </button>
          </form>
        </div>
      )}

      {/* KARTU MONITORING SIKAP SANTRI */}
      <div className="space-y-2">
        {muridTersaring.map(m => {
          const riwayatSikap = listPerilaku.filter(p => p.murid_id === m.id);
          const totalPositif = riwayatSikap.filter(p => p.tipe === 'Positif').length;
          const totalNegatif = riwayatSikap.filter(p => p.tipe === 'Negatif').length;

          return (
            <div key={m.id} className="bg-white p-3 rounded-xl border shadow-sm space-y-2">
              
              {/* Baris Atas Kartu */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono mr-1">KLS {m.kelas}</span>
                  <span className="text-sm font-bold text-slate-700">{m.nama}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 text-[9px] font-mono font-bold">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded">👍 {totalPositif}</span>
                    <span className="bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded">⚠️ {totalNegatif}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedMurid(m)}
                    className="text-[9px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-bold px-2 py-1 rounded-lg border transition"
                  >
                    + Catat
                  </button>
                </div>
              </div>

              {/* Tampilan Riwayat Singkat (2 Catatan Terakhir) */}
              {riwayatSikap.length > 0 && (
                <div className="bg-slate-50 p-2 rounded-lg space-y-1.5 border border-slate-100 text-[11px]">
                  {riwayatSikap.slice(0, 2).map(r => (
                    <div key={r.id} className="flex justify-between items-start gap-2 bg-white p-1.5 rounded border border-slate-100 shadow-2xs">
                      <div className="flex-1">
                        <span className={`inline-block text-[8px] font-extrabold px-1 rounded-sm mr-1 uppercase ${r.tipe === 'Positif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {r.tipe === 'Positif' ? 'Pujian' : 'Teguran'}
                        </span>
                        <b className="text-slate-700">{r.judul}</b>
                        {r.catatan && <p className="text-[10px] text-slate-400 mt-0.5 italic">"{r.catatan}"</p>}
                      </div>
                      <button onClick={() => handleHapusPerilaku(r.id)} className="text-slate-300 hover:text-rose-500 transition px-0.5">
                        <i className="fa-solid fa-xmark text-[9px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}

        {muridTersaring.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-10 bg-white border border-dashed rounded-xl">
            Tidak ditemukan data santri.
          </div>
        )}
      </div>

    </div>
  );
}
