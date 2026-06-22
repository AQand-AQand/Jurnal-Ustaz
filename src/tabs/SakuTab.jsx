// File: src/tabs/SakuTab.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SakuTab({ listBatas, setListBatas, muridList, user, isOffline }) {
  // === STATE INTERNAL BUKU SAKU ===
  const [filterKelas, setFilterKelas] = useState('');
  const [cariNama, setCariNama] = useState('');
  const [selectedMurid, setSelectedMurid] = useState(null); // Santri yang sedang dipilih untuk diupdate setorannya
  
  // State Form Setoran Baru
  const [formSaku, setFormSaku] = useState({ materi: '', halaman_ayat: '', keterangan: 'Lancar' });

  // Ambil list kelas unik untuk dropdown filter
  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))].filter(Boolean).sort();

  const checkConnection = () => {
    if (isOffline) {
      alert("Aplikasi offline! Setoran disimpan di HP sementara waktu.");
      return false;
    }
    return true;
  };

  // === FUNGSI TAMBAH SETORAN BARU ===
  const handleSimpanSetoran = async (e) => {
    e.preventDefault();
    if (!selectedMurid) return alert("Pilih santri terlebih dahulu!");
    if (!formSaku.materi || !formSaku.halaman_ayat) return alert("Lengkapi data materi dan halaman/ayat!");

    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newSetoran = {
      id: safeLocalId,
      murid_id: selectedMurid.id,
      materi: formSaku.materi.trim(),
      halaman_ayat: formSaku.halaman_ayat.trim(),
      keterangan: formSaku.keterangan,
      ustadz_email: user?.email,
      created_at: new Date().toISOString()
    };

    // Jalur cepat: Update state lokal agar UI langsung berubah (Responsive)
    const updatedBatas = [newSetoran, ...listBatas];
    setListBatas(updatedBatas);
    alert(`Setoran ${selectedMurid.nama} berhasil dicatat!`);

    // Reset form & pilihan
    setFormSaku({ materi: '', halaman_ayat: '', keterangan: 'Lancar' });
    setSelectedMurid(null);

    // Jalur Cloud: Sync ke Supabase jika online
    if (checkConnection()) {
      try {
        await supabase.from('batas_saku').insert([newSetoran]);
      } catch (err) {
        console.error("Gagal menyimpan ke cloud:", err);
      }
    }
  };

  // === FUNGSI HAPUS RIWAYAT SETORAN ===
  const handleHapusRiwayat = async (id) => {
    if (!window.confirm("Hapus catatan riwayat setoran ini?")) return;
    setListBatas(listBatas.filter(b => b.id !== id));
    if (checkConnection()) {
      await supabase.from('batas_saku').delete().eq('id', id);
    }
  };

  // Filter santri berdasarkan kelas dan nama
  const muridTersaring = muridList.filter(m => {
    const matchKelas = filterKelas === '' ? true : m.kelas === filterKelas;
    const matchNama = m.nama.toLowerCase().includes(cariNama.toLowerCase());
    return matchKelas && matchNama;
  }).sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* PANEL ATAS: JUDUL & FILTER */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm text-emerald-600 uppercase tracking-wide">Buku Saku & Progres Hafalan</h3>
          <p className="text-[10px] text-slate-400">Catat batas Al-Qur'an, Hadits, Kitab, atau hafalan santri.</p>
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
              placeholder="Ketik nama santri..."
              className="border p-2 rounded-lg text-xs w-full outline-none bg-slate-50 text-slate-700"
              value={cariNama}
              onChange={e => setCariNama(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* POPUP/MODAL FORM INPUT SETORAN BARU */}
      {selectedMurid && (
        <div className="bg-gradient-to-br from-slate-900/40 to-slate-900/60 fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 backdrop-blur-sm">
          <form onSubmit={handleSimpanSetoran} className="bg-white w-full max-w-md p-5 rounded-3xl shadow-2xl space-y-4 animate-slide-up border border-slate-200">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase">Input Progres</span>
                <h4 className="font-bold text-slate-800 text-sm mt-0.5">{selectedMurid.nama}</h4>
              </div>
              <button type="button" onClick={() => setSelectedMurid(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-circle-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Materi / Kitab / Surah</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Juz 30, Surah Al-Mulk, Kitab Jurumiyah" 
                  className="w-full border rounded-xl p-2.5 text-xs outline-none bg-slate-50 focus:ring-2 ring-emerald-500 font-medium"
                  value={formSaku.materi}
                  onChange={e => setFormSaku({ ...formSaku, materi: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Halaman / Ayat / Bab</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Hlm 12, Ayat 1-10, Bab Kalam" 
                  className="w-full border rounded-xl p-2.5 text-xs outline-none bg-slate-50 focus:ring-2 ring-emerald-500 font-medium"
                  value={formSaku.halaman_ayat}
                  onChange={e => setFormSaku({ ...formSaku, halaman_ayat: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Catatan Evaluasi</label>
                <select 
                  className="w-full border rounded-xl p-2.5 text-xs outline-none bg-slate-50 font-medium text-slate-700"
                  value={formSaku.keterangan}
                  onChange={e => setFormSaku({ ...formSaku, keterangan: e.target.value })}
                >
                  <option value="Lancar">🟢 Lancar / Mumtaz</option>
                  <option value="Cukup">🟡 Cukup / Perlu Lancarkan</option>
                  <option value="Mengulang">🔴 Belum Lancar / Mengulang</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs shadow-md hover:bg-emerald-700 transition">
              Simpan Setoran Baru
            </button>
          </form>
        </div>
      )}

      {/* DAFTAR DATA SANTRI & CAPAIANNYA */}
      <div className="space-y-2">
        {filterKelas === '' && (
          <div className="text-center p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-medium">
            💡 Disarankan memilih <b>Filter Kelas</b> terlebih dahulu agar tampilan lebih fokus.
          </div>
        )}

        {muridTersaring.map(m => {
          // Cari semua riwayat setoran santri ini, lalu urutkan dari yang paling baru
          const riwayatSantri = listBatas.filter(b => b.murid_id === m.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const progresTerakhir = riwayatSantri[0]; // Ambil setoran paling gres

          return (
            <div key={m.id} className="bg-white p-3 rounded-xl border shadow-sm space-y-2.5">
              
              {/* Header Kartu Santri */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono mr-1">KLS {m.kelas}</span>
                  <span className="text-sm font-bold text-slate-700">{m.nama}</span>
                </div>
                <button 
                  onClick={() => setSelectedMurid(m)}
                  className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 transition"
                >
                  <i className="fa-solid fa-feather-pointed text-[9px]"></i> Setor
                </button>
              </div>

              {/* Status Progres Terakhir */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                {progresTerakhir ? (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wide">Progres Terakhir:</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        progresTerakhir.keterangan === 'Lancar' ? 'bg-emerald-100 text-emerald-700' : 
                        progresTerakhir.keterangan === 'Cukup' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {progresTerakhir.keterangan}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {progresTerakhir.materi} <span className="text-emerald-600 font-medium">({progresTerakhir.halaman_ayat})</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      📅 {new Date(progresTerakhir.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'})} WIB
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px] py-1 text-center">Belum ada riwayat catatan hafalan.</p>
                )}
              </div>

              {/* Log Expand Riwayat Singkat (Maksimal 2 riwayat sebelumnya jika ada) */}
              {riwayatSantri.length > 1 && (
                <div className="pt-1 border-t border-dashed border-slate-200">
                  <p className="text-[9px] font-bold text-slate-400 mb-1">Riwayat Lampau:</p>
                  <div className="space-y-1">
                    {riwayatSantri.slice(1, 3).map(r => (
                      <div key={r.id} className="flex justify-between items-center text-[11px] text-slate-500 bg-slate-50/50 px-1.5 py-0.5 rounded">
                        <span>📖 {r.materi} ({r.halaman_ayat})</span>
                        <button onClick={() => handleHapusRiwayat(r.id)} className="text-slate-300 hover:text-rose-500 transition px-1">
                          <i className="fa-solid fa-trash-can text-[9px]"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          );
        })}

        {muridTersaring.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-12 bg-white border border-dashed rounded-xl">
            Tidak ada data santri ditemukan.
          </div>
        )}
      </div>

    </div>
  );
}
