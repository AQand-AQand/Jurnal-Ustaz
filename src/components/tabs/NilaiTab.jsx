import React, { useState } from 'react';
import { generatePDF, shareWA } from '../../lib/pdf';

export default function NilaiTab({ muridList, listNilai, setListNilai, user, checkConnection, insertNilai }) {
  const [nilaiKelas, setNilaiKelas] = useState('');
  const [nilaiMapel, setNilaiMapel] = useState('');
  const [nilaiJenis, setNilaiJenis] = useState('Imtihan Bulanan');

  const simpanNilai = async (muridId, mapel, jenis, skor) => {
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newNilai = {
      id: safeLocalId,
      murid_id: muridId,
      mapel: mapel,
      pelajaran: mapel,
      jenis: jenis,
      jenis_ujian: jenis,
      nilai: skor,
      skor: skor,
      created_at: new Date().toISOString()
    };
    setListNilai([newNilai, ...listNilai.filter(n => !(n.murid_id === muridId && n.mapel?.toLowerCase() === mapel.toLowerCase() && n.jenis === jenis))]);
    if (checkConnection()) {
      await insertNilai({ murid_id: muridId, mapel, jenis, nilai: skor, ustadz_email: user?.email });
    }
  };

  const kelasTersedia = [...new Set(muridList.map(m => m.kelas))].sort();

  const handleExportPDF = () => {
    if (!nilaiKelas || !nilaiMapel) return alert("Pilih kelas dan isi mata pelajaran terlebih dahulu!");
    const headers = ['Nama Santri', 'Jenis Ujian', 'Nilai'];
    const body = muridList.filter(m => m.kelas === nilaiKelas).map(m => {
      const n = listNilai.find(ni => ni.murid_id === m.id && ni.mapel?.toLowerCase() === nilaiMapel.toLowerCase() && ni.jenis === nilaiJenis);
      return [m.nama, nilaiJenis, n ? n.nilai.toString() : '-'];
    });
    generatePDF(`Daftar Nilai Kelas ${nilaiKelas}`, headers, body, [`Mata Pelajaran: ${nilaiMapel}`, `Pengajar: ${user?.email}`]);
  };

  const handleShareWA = () => {
    if (!nilaiKelas || !nilaiMapel) return alert("Pilih kelas dan isi mata pelajaran!");
    let txt = `*LAPORAN NILAI KELAS ${nilaiKelas}*\nMapel: ${nilaiMapel} (${nilaiJenis})\n\n`;
    muridList.filter(m => m.kelas === nilaiKelas).forEach(m => {
      const n = listNilai.find(ni => ni.murid_id === m.id && ni.mapel?.toLowerCase() === nilaiMapel.toLowerCase() && ni.jenis === nilaiJenis);
      txt += `👤 *${m.nama}*: ${n ? n.nilai : '-'}\n`;
    });
    shareWA(txt);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Nilai Ujian Santri</h2>
        <p className="text-gray-500 mt-1">Input nilai imtihan, UTS, UAS, dan generate raport PDF/WA</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kelas</label>
            <select
              className="w-full p-2.5 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-200 font-medium text-sm"
              value={nilaiKelas}
              onChange={e => setNilaiKelas(e.target.value)}
            >
              <option value="">Pilih Kelas</option>
              {kelasTersedia.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mata Pelajaran</label>
            <input
              type="text"
              placeholder="Contoh: Fiqih Wadhah"
              className="w-full p-2.5 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm"
              value={nilaiMapel}
              onChange={e => setNilaiMapel(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Ujian</label>
            <select
              className="w-full p-2.5 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm"
              value={nilaiJenis}
              onChange={e => setNilaiJenis(e.target.value)}
            >
              <option value="Imtihan Bulanan">Imtihan Bulanan</option>
              <option value="UTS">UTS (Nisfu Sanah)</option>
              <option value="UAS">UAS (Akhir Sanah)</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={handleExportPDF} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg font-bold flex justify-center items-center gap-2 text-sm shadow-sm transition-all">
              PDF
            </button>
            <button onClick={handleShareWA} className="flex-1 bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-lg font-bold flex justify-center items-center gap-2 text-sm shadow-sm transition-all">
              WA
            </button>
          </div>
        </div>

        {nilaiKelas && nilaiMapel ? (
          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="p-4 w-1/2">Nama Santri</th>
                  <th className="p-4 text-center">Input Angka Nilai (0-100)</th>
                </tr>
              </thead>
              <tbody>
                {muridList.filter(m => m.kelas === nilaiKelas).map(murid => {
                  const currentRecord = listNilai.find(n => n.murid_id === murid.id && n.mapel?.toLowerCase() === nilaiMapel.toLowerCase() && n.jenis === nilaiJenis);
                  return (
                    <tr key={murid.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 font-semibold text-gray-800">{murid.nama}</td>
                      <td className="p-4 flex justify-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Belum dinilai"
                          className="w-32 p-2 border border-gray-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-emerald-200"
                          defaultValue={currentRecord ? currentRecord.nilai : ''}
                          onBlur={(e) => {
                            if (e.target.value === '') return;
                            simpanNilai(murid.id, nilaiMapel, nilaiJenis, parseInt(e.target.value));
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl text-sm">
            Silakan tentukan parameter Kelas dan isi Mata Pelajaran di atas untuk memunculkan lembar penilaian.
          </div>
        )}
      </div>
    </div>
  );
}
