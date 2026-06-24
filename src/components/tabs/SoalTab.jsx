import React, { useState } from 'react';

import { insertSoal, deleteSoal } from '../../lib/api';

export default function SoalTab({ listBankSoal, setListBankSoal, user, checkConnection }) {
  const [soalTab, setSoalTab] = useState('arsip');
  const [formSoal, setFormSoal] = useState({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' });

  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    if (!formSoal.pelajaran || !formSoal.kelas || !formSoal.isi) return alert("Lengkapi formulir soal!");

    if (formSoal.id) {
      const updatedList = listBankSoal.map(s => s.id === formSoal.id ? { ...s, ...formSoal, isi_soal: formSoal.isi } : s);
      setListBankSoal(updatedList);
      alert("Soal berhasil diperbarui!");
      if (checkConnection()) {
        await insertSoal({ pelajaran: formSoal.pelajaran, kelas: formSoal.kelas, batasan: formSoal.batasan, isi_soal: formSoal.isi });
      }
    } else {
      const safeLocalId = Math.floor(Math.random() * 10000000);
      const newSoal = {
        id: safeLocalId,
        pelajaran: formSoal.pelajaran,
        kelas: formSoal.kelas,
        batasan: formSoal.batasan,
        isi_soal: formSoal.isi,
        soal: formSoal.isi
      };
      setListBankSoal([newSoal, ...listBankSoal]);
      alert("Soal berhasil disimpan!");
      if (checkConnection()) {
        await insertSoal({ pelajaran: newSoal.pelajaran, kelas: newSoal.kelas, batasan: newSoal.batasan, isi_soal: newSoal.isi_soal, ustadz_email: user?.email });
      }
    }
    setFormSoal({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' });
    setSoalTab('arsip');
  };

  const handleEditSoal = (soal) => {
    setFormSoal({ ...soal, isi: soal.isi_soal || soal.soal });
    setSoalTab('buat');
  };

  const handleHapusSoal = async (id) => {
    if (!window.confirm("Hapus soal ini dari arsip?")) return;
    setListBankSoal(listBankSoal.filter(s => s.id !== id));
    if (checkConnection()) {
      await deleteSoal(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Arsip & Bank Soal</h2>
          <p className="text-gray-500 mt-1">Simpan draf pertanyaan imtihan madrasah</p>
        </div>
        <button onClick={() => setSoalTab('buat')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-100 text-sm transition-all flex items-center gap-2 w-fit">
          + Tambah Soal
        </button>
      </div>

      {soalTab === 'buat' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">{formSoal.id ? 'Edit Soal' : 'Buat Soal Baru'}</h3>
          <form onSubmit={handleSimpanSoal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Fiqih"
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 text-sm"
                  value={formSoal.pelajaran}
                  onChange={e => setFormSoal({ ...formSoal, pelajaran: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
                <input
                  type="text"
                  placeholder="Contoh: 1A"
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 text-sm"
                  value={formSoal.kelas}
                  onChange={e => setFormSoal({ ...formSoal, kelas: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Batasan</label>
                <input
                  type="text"
                  placeholder="Contoh: Bab 1-3"
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 text-sm"
                  value={formSoal.batasan}
                  onChange={e => setFormSoal({ ...formSoal, batasan: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Isi Soal / Pertanyaan</label>
              <textarea
                rows="4"
                placeholder="Tulis pertanyaan soal di sini..."
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-gray-200 text-sm"
                value={formSoal.isi}
                onChange={e => setFormSoal({ ...formSoal, isi: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all">
                Simpan Soal
              </button>
              <button type="button" onClick={() => { setFormSoal({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' }); setSoalTab('arsip'); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-xl text-sm transition-all">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listBankSoal.map((s, idx) => (
          <div key={s.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm relative group hover:border-emerald-200 transition-all">
            <button onClick={() => handleHapusSoal(s.id)} className="absolute top-3 right-3 text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{idx + 1}</span>
              <div className="flex-1">
                <div className="text-xs font-bold text-emerald-600 mb-1">{s.pelajaran} - Kelas {s.kelas}</div>
                <p className="text-gray-700 font-medium text-sm leading-relaxed pr-6">{s.soal || s.isi_soal}</p>
                {s.batasan && <p className="text-xs text-gray-400 mt-1">Batasan: {s.batasan}</p>}
              </div>
            </div>
            <button onClick={() => handleEditSoal(s)} className="mt-3 text-xs text-emerald-600 font-bold hover:underline">Edit</button>
          </div>
        ))}
      </div>
      {listBankSoal.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">Belum ada bank soal tersimpan.</div>
      )}
    </div>
  );
}
