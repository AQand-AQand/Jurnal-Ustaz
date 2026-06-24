import React, { useState } from 'react';

export default function BukuSakuTab({ muridList, listSakuBatas, listSakuTagihan, setListSakuBatas, setListSakuTagihan, user, checkConnection, insertSakuBatas, deleteSakuBatas, insertSakuTagihan, deleteSakuTagihan }) {
  const [bukuSakuTab, setBukuSakuTab] = useState('batas');
  const [formSakuBatas, setFormSakuBatas] = useState({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
  const [formSakuTagihan, setFormSakuTagihan] = useState({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });

  const handleSimpanSakuBatas = async (e) => {
    e.preventDefault();
    if (!formSakuBatas.kelas || !formSakuBatas.fan) return alert("Kelas dan Fan wajib diisi!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newSaku = { ...formSakuBatas, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
    setListSakuBatas([newSaku, ...listSakuBatas]);
    setFormSakuBatas({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
    if (checkConnection()) {
      await insertSakuBatas(newSaku);
    }
  };

  const handleHapusSakuBatas = async (id) => {
    if (!window.confirm("Hapus batasan ini?")) return;
    setListSakuBatas(listSakuBatas.filter(b => b.id !== id));
    if (checkConnection()) {
      await deleteSakuBatas(id);
    }
  };

  const handleSimpanSakuTagihan = async (e) => {
    e.preventDefault();
    if (!formSakuTagihan.tanggal || !formSakuTagihan.kelas || !formSakuTagihan.kitab) return alert("Isi form dengan lengkap!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newTagihan = { ...formSakuTagihan, murid_id: formSakuTagihan.murid_id ? parseInt(formSakuTagihan.murid_id) : null, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
    setListSakuTagihan([newTagihan, ...listSakuTagihan]);
    setFormSakuTagihan({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
    if (checkConnection()) {
      await insertSakuTagihan(newTagihan);
    }
  };

  const handleHapusSakuTagihan = async (id) => {
    if (!window.confirm("Hapus tagihan ini?")) return;
    setListSakuTagihan(listSakuTagihan.filter(t => t.id !== id));
    if (checkConnection()) {
      await deleteSakuTagihan(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Buku Saku Pengajar</h2>
        <p className="text-gray-500 mt-1">Pantau batasan mengajar kitab dan target tagihan santri</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setBukuSakuTab('batas')} className={`flex-1 py-4 text-sm font-bold transition-colors ${bukuSakuTab === 'batas' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
            📊 Batas Mengajar Kitab
          </button>
          <button onClick={() => setBukuSakuTab('tagihan')} className={`flex-1 py-4 text-sm font-bold transition-colors ${bukuSakuTab === 'tagihan' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
            🎯 Target Tagihan Santri
          </button>
        </div>

        <div className="p-5 md:p-6">
          {bukuSakuTab === 'batas' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100 h-fit">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Catat Batas Baru
                </h3>
                <form onSubmit={handleSimpanSakuBatas} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
                    <input type="text" placeholder="Contoh: 3A, 1B" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.kelas} onChange={e => setFormSakuBatas({ ...formSakuBatas, kelas: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fan / Kelompok Ilmu</label>
                    <input type="text" placeholder="Contoh: Fiqih, Nahwu" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.fan} onChange={e => setFormSakuBatas({ ...formSakuBatas, fan: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Kitab & Materi</label>
                    <input type="text" placeholder="Contoh: Safinatun Najah" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.materi} onChange={e => setFormSakuBatas({ ...formSakuBatas, materi: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Halaman</label>
                      <input type="text" placeholder="Hal. 12" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.halaman} onChange={e => setFormSakuBatas({ ...formSakuBatas, halaman: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target</label>
                      <input type="text" placeholder="Khatam/Bab 2" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.target} onChange={e => setFormSakuBatas({ ...formSakuBatas, target: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan Tambahan</label>
                    <textarea rows="2" placeholder="Keterangan alur sabaq..." className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.catatan} onChange={e => setFormSakuBatas({ ...formSakuBatas, catatan: e.target.value })}></textarea>
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm">
                    Simpan Batasan Kitab
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Riwayat Batasan Mengajar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listSakuBatas.map((b) => (
                    <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative group hover:shadow-md transition-all">
                      <button onClick={() => handleHapusSakuBatas(b.id)} className="absolute top-3 right-3 text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                      <div className="text-xs font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded w-fit mb-2">Kelas {b.kelas}</div>
                      <h4 className="font-bold text-gray-800 text-base">{b.materi}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Bidang Ilmu: {b.fan}</p>
                      <div className="grid grid-cols-2 gap-2 mt-3 bg-gray-50 p-2 rounded-lg text-xs">
                        <div><span className="text-gray-400">Posisi:</span> <span className="font-bold text-gray-700 block">{b.halaman}</span></div>
                        <div><span className="text-gray-400">Target:</span> <span className="font-bold text-gray-700 block">{b.target || '-'}</span></div>
                      </div>
                      {b.catatan && <p className="text-xs text-gray-500 mt-2 bg-slate-50 p-2 rounded border border-dashed border-gray-100">📝 {b.catatan}</p>}
                    </div>
                  ))}
                </div>
                {listSakuBatas.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">Belum ada batasan kitab terdaftar.</div>}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100 h-fit">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Buat Tagihan Hafalan
                </h3>
                <form onSubmit={handleSimpanSakuTagihan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Batas Waktu</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formSakuTagihan.tanggal} onChange={e => setFormSakuTagihan({ ...formSakuTagihan, tanggal: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Santri / Murid</label>
                    <select className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formSakuTagihan.murid_id} onChange={e => setFormSakuTagihan({ ...formSakuTagihan, murid_id: e.target.value })} required>
                      <option value="">-- Pilih Santri --</option>
                      {muridList.map(m => <option key={m.id} value={m.id}>{m.nama} (Kelas {m.kelas})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kitab / Juz / Surah</label>
                    <input type="text" placeholder="Contoh: Aqidatul Awam / Juz 30" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formSakuTagihan.kitab} onChange={e => setFormSakuTagihan({ ...formSakuTagihan, kitab: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mulai Dari</label>
                      <input type="text" placeholder="Bait 1 / Hal 1" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formSakuTagihan.target_dari} onChange={e => setFormSakuTagihan({ ...formSakuTagihan, target_dari: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sampai Dengan</label>
                      <input type="text" placeholder="Bait 10 / Hal 5" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formSakuTagihan.target_sampai} onChange={e => setFormSakuTagihan({ ...formSakuTagihan, target_sampai: e.target.value })} required />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm">
                    Terbitkan Tagihan
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 overflow-x-auto border border-gray-100 rounded-xl shadow-sm h-fit bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-3">Santri</th>
                      <th className="p-3">Materi Tagihan</th>
                      <th className="p-3 text-center">Deadline</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {listSakuTagihan.map((t) => {
                      const murid = muridList.find(m => m.id === t.murid_id);
                      return (
                        <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-3">
                            <div className="font-bold text-gray-800">{murid ? murid.nama : 'Memuat...'}</div>
                            <div className="text-xs text-gray-400">Kelas {murid ? murid.kelas : '-'}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-gray-700">{t.kitab}</div>
                            <div className="text-xs text-emerald-600 font-semibold">{t.target_dari} s/d {t.target_sampai}</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded border border-amber-100">
                              {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleHapusSakuTagihan(t.id)} className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {listSakuTagihan.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">Belum ada tagihan berjalan.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
