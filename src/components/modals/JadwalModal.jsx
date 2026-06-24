import React, { useState } from 'react';

export default function JadwalModal({ show, onClose, onSave, formJadwal, setFormJadwal }) {
  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formJadwal.jam_mulai || !formJadwal.kelas || !formJadwal.pelajaran) return alert("Lengkapi form jadwal!");
    await onSave(formJadwal);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">{formJadwal.id ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-lg">X</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hari</label>
            <select
              className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm"
              value={formJadwal.hari}
              onChange={e => setFormJadwal({ ...formJadwal, hari: e.target.value })}
            >
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jam Mengajar</label>
            <input
              type="text"
              placeholder="Contoh: 07:30 - 09:00"
              className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm"
              value={formJadwal.jam_mulai}
              onChange={e => setFormJadwal({ ...formJadwal, jam_mulai: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
            <input
              type="text"
              placeholder="Contoh: 1A / 3"
              className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm"
              value={formJadwal.kelas}
              onChange={e => setFormJadwal({ ...formJadwal, kelas: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kitab / Pelajaran</label>
            <input
              type="text"
              placeholder="Contoh: Fathul Qorib"
              className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm"
              value={formJadwal.pelajaran}
              onChange={e => setFormJadwal({ ...formJadwal, pelajaran: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm mt-2">
            Simpan Jadwal Mengajar
          </button>
        </form>
      </div>
    </div>
  );
}
