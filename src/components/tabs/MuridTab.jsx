import React, { useState } from 'react';

export default function MuridTab({ muridList, setMuridList, user, checkConnection, insertMurid, updateMurid, deleteMurid }) {
  const [showTambahMurid, setShowTambahMurid] = useState(false);
  const [formMurid, setFormMurid] = useState({ id: null, nama: '', kelas: '', alamat: '', domisili: '' });

  const handleSimpanMurid = async (e) => {
    e.preventDefault();
    if (!formMurid.nama || !formMurid.kelas) return alert("Nama dan Kelas wajib diisi!");

    if (formMurid.id) {
      const updatedList = muridList.map(m => m.id === formMurid.id ? formMurid : m);
      setMuridList(updatedList);
      alert("Data murid diperbarui!");
      if (checkConnection()) {
        await updateMurid(formMurid.id, { nama: formMurid.nama, kelas: formMurid.kelas, alamat: formMurid.alamat, domisili: formMurid.domisili });
      }
    } else {
      const safeLocalId = Math.floor(Math.random() * 10000000);
      const newMurid = { ...formMurid, id: safeLocalId, ustadz_email: user?.email };
      setMuridList([...muridList, newMurid]);
      alert("Murid berhasil ditambahkan!");
      if (checkConnection()) {
        await insertMurid(newMurid);
      }
    }
    setFormMurid({ id: null, nama: '', kelas: '', alamat: '', domisili: '' });
    setShowTambahMurid(false);
  };

  const handleEditMurid = (murid) => {
    setFormMurid(murid);
    setShowTambahMurid(true);
  };

  const handleHapusMurid = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data santri ini beserta absen & nilainya?")) return;
    setMuridList(muridList.filter(m => m.id !== id));
    if (checkConnection()) {
      await deleteMurid(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Data Santri</h2>
          <p className="text-gray-500 mt-1">Daftar santri aktif di kelas asuhan Anda</p>
        </div>
        <button
          onClick={() => { setFormMurid({ id: null, nama: '', kelas: '', alamat: '', domisili: '' }); setShowTambahMurid(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md text-sm transition-all w-fit"
        >
          + Tambah Santri Baru
        </button>
      </div>

      {showTambahMurid && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">{formMurid.id ? 'Edit Data Santri' : 'Tambah Santri Baru'}</h3>
          <form onSubmit={handleSimpanMurid} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Nama santri"
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 text-sm"
                  value={formMurid.nama}
                  onChange={e => setFormMurid({ ...formMurid, nama: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
                <input
                  type="text"
                  placeholder="Contoh: 1A, 2B"
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 text-sm"
                  value={formMurid.kelas}
                  onChange={e => setFormMurid({ ...formMurid, kelas: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alamat</label>
                <input
                  type="text"
                  placeholder="Alamat santri"
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 text-sm"
                  value={formMurid.alamat}
                  onChange={e => setFormMurid({ ...formMurid, alamat: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Domisili</label>
                <input
                  type="text"
                  placeholder="Domisili santri"
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 text-sm"
                  value={formMurid.domisili}
                  onChange={e => setFormMurid({ ...formMurid, domisili: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all">
                Simpan
              </button>
              <button type="button" onClick={() => { setFormMurid({ id: null, nama: '', kelas: '', alamat: '', domisili: '' }); setShowTambahMurid(false); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-xl text-sm transition-all">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                <th className="p-4">Nama Lengkap Santri</th>
                <th className="p-4 text-center">Kelas</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {muridList.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 font-bold text-gray-800">{m.nama}</td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs">Kelas {m.kelas}</span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEditMurid(m)} className="text-gray-400 hover:text-emerald-600 p-2 rounded-lg hover:bg-emerald-50 transition-colors">
                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button onClick={() => handleHapusMurid(m.id)} className="text-gray-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors">
                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {muridList.length === 0 && <div className="text-center py-12 text-gray-400">Belum ada data santri dimasukkan.</div>}
      </div>
    </div>
  );
}
