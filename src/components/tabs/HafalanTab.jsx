import React, { useState } from 'react';

export default function HafalanTab({ muridList, listCapaian, setListCapaian, user, checkConnection, insertCapaian, deleteCapaian }) {
  const [hafalanKelas, setHafalanKelas] = useState('');
  const [selectedMuridHafalan, setSelectedMuridHafalan] = useState(null);
  const [formCapaian, setFormCapaian] = useState({ capaian: '', tanggal: new Date().toISOString().split('T')[0] });

  const handleSimpanCapaianHafalan = async (e) => {
    e.preventDefault();
    if (!formCapaian.capaian) return alert("Isi Capaian / Batas Hafalan!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newCapaian = {
      id: safeLocalId,
      murid_id: selectedMuridHafalan.id,
      capaian: formCapaian.capaian,
      capaian_hafalan: formCapaian.capaian,
      tanggal: formCapaian.tanggal,
      ustadz_email: user?.email,
      created_at: new Date().toISOString()
    };
    setListCapaian([newCapaian, ...listCapaian]);
    setFormCapaian({ ...formCapaian, capaian: '' });
    alert("Capaian hafalan ditambahkan!");
    if (checkConnection()) {
      await insertCapaian(newCapaian);
    }
  };

  const handleHapusCapaian = async (id) => {
    if (!window.confirm("Hapus capaian ini?")) return;
    setListCapaian(listCapaian.filter(c => c.id !== id));
    if (checkConnection()) {
      await deleteCapaian(id);
    }
  };

  const kelasTersedia = [...new Set(muridList.map(m => m.kelas))].sort();

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Setoran Hafalan Santri</h2>
        <p className="text-gray-500 mt-1">Kelola capaian sabaq, tasyrih, dan hafalan harian santri</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Filter Kelas</label>
            <select
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 bg-slate-50 font-medium"
              value={hafalanKelas}
              onChange={e => { setHafalanKelas(e.target.value); setSelectedMuridHafalan(null); }}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasTersedia.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
          </div>

          {hafalanKelas && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Santri</label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {muridList.filter(m => m.kelas === hafalanKelas).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMuridHafalan(m)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${selectedMuridHafalan?.id === m.id ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-md shadow-emerald-100' : 'bg-white text-gray-700 hover:bg-slate-50 border-gray-100'}`}
                  >
                    {m.nama}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedMuridHafalan ? (
            <>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 text-base">Form Setoran: <span className="text-emerald-600">{selectedMuridHafalan.nama}</span></h3>
                <form onSubmit={handleSimpanCapaianHafalan} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm font-medium"
                        value={formCapaian.tanggal}
                        onChange={e => setFormCapaian({ ...formCapaian, tanggal: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Materi / Progres Hafalan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Juz 30 Surah An-Naba' 1-10"
                        className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm"
                        value={formCapaian.capaian}
                        onChange={e => setFormCapaian({ ...formCapaian, capaian: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold shadow-md shadow-emerald-100 transition-all text-sm">
                      Simpan Setoran
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Riwayat Progres Hafalan
                </h3>
                <div className="space-y-3">
                  {listCapaian.filter(c => c.murid_id === selectedMuridHafalan.id).map(c => (
                    <div key={c.id} className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors group">
                      <div>
                        <div className="text-xs font-bold text-emerald-600">{new Date(c.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div className="text-gray-800 font-semibold mt-1 text-sm">{c.capaian_hafalan || c.capaian}</div>
                      </div>
                      <button onClick={() => handleHapusCapaian(c.id)} className="text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                  {listCapaian.filter(c => c.murid_id === selectedMuridHafalan.id).length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">Belum ada catatan setoran untuk santri ini.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400 text-sm">
              Silakan pilih kelas dan nama santri di sebelah kiri untuk mengelola hafalan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
