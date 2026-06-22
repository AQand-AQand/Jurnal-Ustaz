// File: src/tabs/RaporTab.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RaporTab({ muridList, setMuridList, user, isOffline }) {
  // === STATE INTERNAL RAPOR / DATA SANTRI ===
  const [showTambahMurid, setShowTambahMurid] = useState(false);
  const [formMurid, setFormMurid] = useState({ id: null, nama: '', kelas: '' });
  const [filterKelas, setFilterKelas] = useState('');
  const [cariNama, setCariNama] = useState('');

  // Mendapatkan daftar kelas unik dari data santri untuk filter dropdown
  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))].filter(Boolean).sort();

  const checkConnection = () => {
    if (isOffline) {
      alert("Aplikasi offline! Data santri disimpan di HP sementara waktu.");
      return false;
    }
    return true;
  };

  // === FUNGSI CRUD DATA SANTRI ===
  const handleSimpanMurid = async (e) => {
    e.preventDefault();
    if (!formMurid.nama || !formMurid.kelas) {
      return alert("Nama santri dan kelas tidak boleh kosong!");
    }

    // Merapikan format input kelas (contoh: huruf besar/angka seragam)
    const kelasBersih = formMurid.kelas.trim().toUpperCase();

    if (formMurid.id) {
      // MODE EDIT
      const updatedList = muridList.map(m => m.id === formMurid.id ? { ...formMurid, kelas: kelasBersih } : m);
      setMuridList(updatedList);
      alert("Data santri berhasil diperbarui!");
      
      if (checkConnection()) {
        await supabase.from('murid')
          .update({ nama: formMurid.nama, kelas: kelasBersih })
          .eq('id', formMurid.id);
      }
    } else {
      // MODE TAMBAH BARU
      const safeLocalId = Math.floor(Math.random() * 10000000);
      const newMurid = {
        id: safeLocalId,
        nama: formMurid.nama.trim(),
        kelas: kelasBersih,
        ustadz_email: user?.email,
        created_at: new Date().toISOString()
      };

      setMuridList([...muridList, newMurid]);
      alert("Santri baru berhasil ditambahkan!");
    }

    // Reset Form
    setFormMurid({ id: null, nama: '', kelas: '' });
    setShowTambahMurid(false);
  };

  const handleEditMurid = (murid) => {
    setFormMurid(murid);
    setShowTambahMurid(true);
    // Scroll otomatis ke form jika di layar HP kecil
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHapusMurid = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data santri ini? Semua data nilai dan absen yang terikat dengan santri ini mungkin akan terpengaruh.")) return;
    
    setMuridList(muridList.filter(m => m.id !== id));
    alert("Data santri dihapus dari lokal.");

    if (checkConnection()) {
      await supabase.from('murid').delete().eq('id', id);
    }
  };

  // === FILTER & PENCARIAN DATA ===
  const muridTersaring = muridList.filter(m => {
    const matchKelas = filterKelas === '' ? true : m.kelas === filterKelas;
    const matchNama = m.nama.toLowerCase().includes(cariNama.toLowerCase());
    return matchKelas && matchNama;
  }).sort((a, b) => a.nama.localeCompare(b.nama)); // Urut abjad nama santri

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Tombol Trigger Form Tambah */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 text-sm text-emerald-600 uppercase tracking-wide">Data Induk Santri</h3>
          <p className="text-[10px] text-slate-400">Total: {muridList.length} Santri terdaftar</p>
        </div>
        <button 
          onClick={() => { setShowTambahMurid(!showTambahMurid); setFormMurid({ id: null, nama: '', kelas: '' }); }}
          className={`text-xs px-3 py-2 rounded-xl font-bold transition ${showTambahMurid ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}
        >
          {showTambahMurid ? 'Batal' : '+ Santri Baru'}
        </button>
      </div>

      {/* FORM TAMBAH / EDIT SANTRI */}
      {showTambahMurid && (
        <form onSubmit={handleSimpanMurid} className="bg-white p-4 rounded-2xl shadow-sm border space-y-3 animate-fade-in">
          <h4 className="font-bold text-slate-700 text-xs uppercase border-b pb-1 text-emerald-600">
            {formMurid.id ? 'Ubah Data Santri' : 'Input Santri Baru'}
          </h4>
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Nama Lengkap Santri" 
              className="w-full border rounded-xl p-2.5 text-sm outline-none focus:ring-2 ring-emerald-500"
              value={formMurid.nama} 
              onChange={e => setFormMurid({ ...formMurid, nama: e.target.value })} 
              required
            />
            <input 
              type="text" 
              placeholder="Kelas (Contoh: 1A, 2, OLA)" 
              className="w-full border rounded-xl p-2.5 text-sm outline-none focus:ring-2 ring-emerald-500 font-mono"
              value={formMurid.kelas} 
              onChange={e => setFormMurid({ ...formMurid, kelas: e.target.value })} 
              required
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow hover:bg-emerald-700 transition">
            {formMurid.id ? 'Simpan Perubahan' : 'Daftarkan Santri'}
          </button>
        </form>
      )}

      {/* FILTER PANEL */}
      <div className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Filter Kelas</label>
          <select 
            className="border p-2 rounded-lg text-xs w-full outline-none bg-slate-50 text-slate-700 font-medium"
            value={filterKelas}
            onChange={e => setFilterKelas(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Cari Nama</label>
          <input 
            type="text"
            placeholder="Ketik nama..."
            className="border p-2 rounded-lg text-xs w-full outline-none bg-slate-50 text-slate-700"
            value={cariNama}
            onChange={e => setCariNama(e.target.value)}
          />
        </div>
      </div>

      {/* LIST KARTU DATA SANTRI */}
      <div className="space-y-2">
        {muridTersaring.map((m, index) => (
          <div key={m.id} className="bg-white p-3 rounded-xl border shadow-sm flex items-center justify-between transition hover:border-emerald-300">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-mono text-slate-400">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-700 leading-snug">{m.nama}</p>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200">
                  Kelas {m.kelas}
                </span>
              </div>
            </div>
            
            {/* Navigasi Aksi */}
            <div className="flex gap-3 text-slate-400 pl-2">
              <button onClick={() => handleEditMurid(m)} className="hover:text-emerald-600 transition" title="Ubah Data">
                <i className="fa-solid fa-user-pen text-xs"></i>
              </button>
              <button onClick={() => handleHapusMurid(m.id)} className="hover:text-rose-500 transition" title="Hapus Data">
                <i className="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </div>
        ))}

        {muridTersaring.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-12 bg-white border border-dashed rounded-xl">
            <i className="fa-solid fa-users text-2xl text-slate-200 mb-2 block"></i>
            Tidak ditemukan data santri yang sesuai kriteria.
          </div>
        )}
      </div>

    </div>
  );
}
