import React from 'react';

export default function JadwalTab({ listJadwal, onTambah, onHapus }) {
  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Jadwal Mengajar</h2>
          <p className="text-gray-500 mt-1">Kelola jadwal pelajaran Anda</p>
        </div>
        <button
          onClick={onTambah}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Tambah Jadwal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hariList.map(hari => {
          const jadwalHariIni = listJadwal.filter(j => j.hari === hari).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
          if (jadwalHariIni.length === 0) return null;
          return (
            <div key={hari} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-200 rounded-lg flex items-center justify-center text-emerald-700 font-bold">
                  {hari.substring(0, 1)}
                </div>
                <h3 className="font-bold text-emerald-800">{hari}</h3>
              </div>
              <div className="p-2">
                {jadwalHariIni.map((j) => (
                  <div key={j.id} className="p-3 hover:bg-gray-50 rounded-xl transition-colors group relative border-b border-gray-50 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-semibold text-emerald-600 mb-1">{j.jam_mulai}</div>
                        <div className="font-bold text-gray-800">{j.pelajaran}</div>
                        <div className="text-sm text-gray-500 mt-0.5">Kelas {j.kelas}</div>
                      </div>
                      <button
                        onClick={() => onHapus(j.id)}
                        className="text-rose-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {listJadwal.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-700">Belum ada jadwal</h3>
          <p className="text-gray-500 mt-2">Mulai tambahkan jadwal mengajar Anda</p>
        </div>
      )}
    </div>
  );
}
