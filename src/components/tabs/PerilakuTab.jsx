import React, { useState } from 'react';

export default function PerilakuTab({ muridList, listPerilaku, setListPerilaku, user, checkConnection, insertPerilaku, deletePerilaku }) {
  const [perilakuKelas, setPerilakuKelas] = useState('');
  const [selectedMuridPerilaku, setSelectedMuridPerilaku] = useState(null);
  const [formPerilaku, setFormPerilaku] = useState({ catatan: '' });

  const handleSimpanPerilaku = async (e) => {
    e.preventDefault();
    if (!selectedMuridPerilaku?.id || !formPerilaku.catatan) return alert("Tulis catatan perilaku terlebih dahulu!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newPrilaku = {
      id: safeLocalId,
      murid_id: selectedMuridPerilaku.id,
      catatan: formPerilaku.catatan,
      catatan_perilaku: formPerilaku.catatan,
      created_at: new Date().toISOString()
    };
    setListPerilaku([newPrilaku, ...listPerilaku]);
    setFormPerilaku({ catatan: '' });
    alert("Catatan perilaku berhasil ditambahkan!");
    if (checkConnection()) {
      await insertPerilaku({ murid_id: newPrilaku.murid_id, catatan: newPrilaku.catatan, ustadz_email: user?.email });
    }
  };

  const handleHapusPerilaku = async (id) => {
    if (!window.confirm("Hapus catatan ini?")) return;
    setListPerilaku(listPerilaku.filter(p => p.id !== id));
    if (checkConnection()) {
      await deletePerilaku(id);
    }
  };

  const kelasTersedia = [...new Set(muridList.map(m => m.kelas))].sort();

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Catatan Perilaku & Akhlak</h2>
        <p className="text-gray-500 mt-1">Pantau perkembangan karakter, kedisiplinan, dan takzir santri</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Filter Kelas</label>
            <select
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 bg-slate-50 font-medium"
              value={perilakuKelas}
              onChange={e => { setPerilakuKelas(e.target.value); setSelectedMuridPerilaku(null); }}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasTersedia.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
          </div>

          {perilakuKelas && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Daftar Santri</label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {muridList.filter(m => m.kelas === perilakuKelas).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMuridPerilaku(m)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${selectedMuridPerilaku?.id === m.id ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-gray-700 hover:bg-slate-50 border-gray-100'}`}
                  >
                    {m.nama}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedMuridPerilaku ? (
            <>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 text-sm">Tambah Catatan untuk: <span className="text-emerald-600">{selectedMuridPerilaku.nama}</span></h3>
                <form onSubmit={handleSimpanPerilaku} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan Akhlak / Pelanggaran / Prestasi</label>
                    <textarea
                      rows="3"
                      placeholder="Contoh: Membantu membersihkan musholla setelah jamaah / Terlambat masuk kelas sabaq..."
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm"
                      value={formPerilaku.catatan}
                      onChange={e => setFormPerilaku({ catatan: e.target.value })}
                      required
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold shadow-md transition-all text-sm">
                      Simpan Catatan
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">📑 Histori Perilaku Santri</h3>
                <div className="space-y-3">
                  {listPerilaku.filter(p => p.murid_id === selectedMuridPerilaku.id).map(p => (
                    <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group hover:shadow-sm transition-all">
                      <button
                        onClick={() => handleHapusPerilaku(p.id)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                      <div className="text-xs text-gray-400 font-semibold">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      <p className="text-gray-700 font-medium mt-2 text-sm leading-relaxed">{p.catatan_perilaku || p.catatan}</p>
                    </div>
                  ))}
                  {listPerilaku.filter(p => p.murid_id === selectedMuridPerilaku.id).length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">Belum ada rekam jejak perilaku tercatat.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400 text-sm">
              Silakan pilih kelas dan nama santri di sebelah kiri untuk melihat rekam perilaku.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
