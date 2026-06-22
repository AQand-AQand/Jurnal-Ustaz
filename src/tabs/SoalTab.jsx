// File: src/tabs/SoalTab.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SoalTab({ listSoal, setListSoal, listJadwal, user, isOffline }) {
  // === STATE INTERNAL BANK SOAL ===
  const [showTambah, setShowTambah] = useState(false);
  const [filterPelajaran, setFilterPelajaran] = useState('');
  const [cariText, setCariText] = useState('');
  
  // State Form Soal (Mendukung pertanyaan & kunci jawaban)
  const [formSoal, setFormSoal] = useState({ id: null, pelajaran: '', pertanyaan: '', jawaban: '' });

  // Mengambil daftar mata pelajaran unik dari jadwal mengajar ustadz
  const listPelajaranUnik = [...new Set(listJadwal.map(j => j.pelajaran))].filter(Boolean).sort();

  const checkConnection = () => {
    if (isOffline) {
      alert("Aplikasi offline! Soal ujian disimpan di HP sementara waktu.");
      return false;
    }
    return true;
  };

  // === FUNGSI CRUD BANK SOAL ===
  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    if (!formSoal.pelajaran || !formSoal.pertanyaan || !formSoal.jawaban) {
      return alert("Mohon lengkapi seluruh kolom teks soal dan jawaban!");
    }

    if (formSoal.id) {
      // MODE EDIT SOAL
      const updatedList = listSoal.map(s => s.id === formSoal.id ? formSoal : s);
      setListSoal(updatedList);
      alert("Soal berhasil diperbarui!");

      if (checkConnection()) {
        await supabase.from('bank_soal')
          .update({ 
            pelajaran: formSoal.pelajaran, 
            pertanyaan: formSoal.pertanyaan.trim(), 
            jawaban: formSoal.jawaban.trim() 
          })
          .eq('id', formSoal.id);
      }
    } else {
      // MODE TAMBAH SOAL BARU
      const safeLocalId = Math.floor(Math.random() * 10000000);
      const newSoal = {
        id: safeLocalId,
        pelajaran: formSoal.pelajaran,
        pertanyaan: formSoal.pertanyaan.trim(),
        jawaban: formSoal.jawaban.trim(),
        ustadz_email: user?.email,
        created_at: new Date().toISOString()
      };

      setListSoal([newSoal, ...listSoal]);
      alert("Soal baru berhasil ditambahkan ke dalam arsip bank soal!");

      if (checkConnection()) {
        await supabase.from('bank_soal').insert([newSoal]);
      }
    }

    // Reset Form & Tutup Panel Form
    setFormSoal({ id: null, pelajaran: '', pertanyaan: '', jawaban: '' });
    setShowTambah(false);
  };

  const handleEditSoal = (soal) => {
    setFormSoal(soal);
    setShowTambah(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHapusSoal = async (id) => {
    if (!window.confirm("Apakah Ustaz yakin ingin menghapus soal ini dari arsip bank soal?")) return;

    setListSoal(listSoal.filter(s => s.id !== id));
    alert("Soal dihapus dari penyimpanan lokal.");

    if (checkConnection()) {
      await supabase.from('bank_soal').delete().eq('id', id);
    }
  };

  // === FILTER & LOGIKA PENCARIAN SOAL ===
  const soalTersaring = listSoal.filter(s => {
    const matchPelajaran = filterPelajaran === '' ? true : s.pelajaran === filterPelajaran;
    const matchText = s.pertanyaan.toLowerCase().includes(cariText.toLowerCase()) || 
                      s.jawaban.toLowerCase().includes(cariText.toLowerCase());
    return matchPelajaran && matchText;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* PANEL ATAS: INFO UTAMA */}
      <div className="bg-white p-3 rounded-xl border shadow-sm flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-sm text-emerald-600 uppercase tracking-wide">Bank Soal Ujian</h3>
          <p className="text-[10px] text-slate-400">Total tabungan: {listSoal.length} materi soal kuis</p>
        </div>
        <button 
          onClick={() => { setShowTambah(!showTambah); setFormSoal({ id: null, pelajaran: '', pertanyaan: '', jawaban: '' }); }}
          className={`text-xs px-3 py-2 rounded-xl font-bold transition ${showTambah ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}
        >
          {showTambah ? 'Batal' : '+ Tambah Soal'}
        </button>
      </div>

      {/* FORM INPUT / EDIT SOAL */}
      {showTambah && (
        <form onSubmit={handleSimpanSoal} className="bg-white p-4 rounded-2xl border shadow-sm space-y-3 animate-fade-in">
          <h4 className="font-bold text-slate-700 text-xs uppercase border-b pb-1 text-emerald-600">
            {formSoal.id ? 'Ubah Materi Soal' : 'Tulis Soal Baru'}
          </h4>
          
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Mata Pelajaran</label>
              <select 
                className="w-full border rounded-xl p-2.5 text-xs outline-none bg-slate-50 font-semibold text-slate-700"
                value={formSoal.pelajaran}
                onChange={e => setFormSoal({ ...formSoal, pelajaran: e.target.value })}
                required
              >
                <option value="">-- Pilih Pelajaran --</option>
                {listPelajaranUnik.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Pertanyaan / Soal</label>
              <textarea 
                rows="3"
                placeholder="Tuliskan pertanyaan ujian atau kuis di sini..."
                className="w-full border rounded-xl p-2.5 text-xs outline-none bg-slate-50 font-medium text-slate-700 focus:ring-2 ring-emerald-500"
                value={formSoal.pertanyaan}
                onChange={e => setFormSoal({ ...formSoal, pertanyaan: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Kunci Jawaban / Kisi-Kisi</label>
              <input 
                type="text"
                placeholder="Tulis ringkasan jawaban benar atau instruksi nilai..."
                className="w-full border rounded-xl p-2.5 text-xs outline-none bg-slate-50 font-medium text-slate-700 focus:ring-2 ring-emerald-500"
                value={formSoal.jawaban}
                onChange={e => setFormSoal({ ...formSoal, jawaban: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow hover:bg-emerald-700 transition">
            {formSoal.id ? 'Perbarui Soal Ini' : 'Tabungkan ke Bank Soal'}
          </button>
        </form>
      )}

      {/* PANEL FILTER PENCARIAN */}
      <div className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Mata Pelajaran</label>
          <select 
            className="border p-2 rounded-lg text-xs w-full outline-none bg-slate-50 text-slate-700 font-medium"
            value={filterPelajaran}
            onChange={e => setFilterPelajaran(e.target.value)}
          >
            <option value="">Semua Pelajaran</option>
            {listPelajaranUnik.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Kata Kunci</label>
          <input 
            type="text"
            placeholder="Cari teks soal..."
            className="border p-2 rounded-lg text-xs w-full outline-none bg-slate-50 text-slate-700"
            value={cariText}
            onChange={e => setCariText(e.target.value)}
          />
        </div>
      </div>

      {/* DAFTAR DATA KARTU SOAL */}
      <div className="space-y-2.5">
        {soalTersaring.map((s, index) => (
          <div key={s.id} className="bg-white p-3.5 rounded-xl border shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {s.pelajaran}
                </span>
              </div>
              <div className="flex gap-2 text-slate-400 pl-2">
                <button onClick={() => handleEditSoal(s)} className="hover:text-emerald-600 transition" title="Ubah Soal">
                  <i className="fa-solid fa-pen-to-square text-xs"></i>
                </button>
                <button onClick={() => handleHapusSoal(s.id)} className="hover:text-rose-500 transition" title="Hapus Soal">
                  <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>

            {/* Isi Pertanyaan */}
            <div className="text-slate-700 text-xs font-medium leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-mono mr-1">{index + 1}.</span> {s.pertanyaan}
            </div>

            {/* Kunci Jawaban */}
            <div className="text-[11px] text-slate-500 pl-1 flex items-start gap-1">
              <span className="text-emerald-600 font-bold">🔑 Kunci:</span>
              <span className="italic text-slate-600">{s.jawaban}</span>
            </div>
          </div>
        ))}

        {soalTersaring.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-12 bg-white border border-dashed rounded-xl">
            <i className="fa-solid fa-folder-open text-2xl text-slate-200 mb-2 block"></i>
            Belum ada koleksi berkas soal yang sesuai kriteria.
          </div>
        )}
      </div>

    </div>
  );
}
