import React, { useState } from 'react';

export default function Register({ onRegister, onSwitchView }) {
  const [formData, setFormData] = useState({ namaLengkap: '', namaPanggilan: '', email: '', password: '', whatsapp: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onRegister(formData.email, formData.password, formData);
      alert("Registrasi sukses! Silakan periksa kotak masuk email untuk verifikasi atau langsung login.");
      onSwitchView();
    } catch (err) {
      alert("Gagal Registrasi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 font-sans max-w-md mx-auto py-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full border border-slate-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Daftar Akun Ustaz</h1>
          <p className="text-xs text-slate-400 mt-1">Bergabung ke ekosistem digital SIM KBM</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Nama Lengkap & Gelar</label>
            <input type="text" placeholder="Ust. Ahmad Fauzi, Lc." required className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-slate-50 outline-none focus:ring-2 ring-emerald-500 font-medium" value={formData.namaLengkap} onChange={e => setFormData({...formData, namaLengkap: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Nama Panggilan</label>
            <input type="text" placeholder="Ustaz Fauzi" required className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-slate-50 outline-none focus:ring-2 ring-emerald-500 font-medium" value={formData.namaPanggilan} onChange={e => setFormData({...formData, namaPanggilan: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Email Utama</label>
            <input type="email" placeholder="fauzi@domain.com" required className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-slate-50 outline-none focus:ring-2 ring-emerald-500 font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Kata Sandi Terproteksi</label>
            <input type="password" placeholder="Minimal 6 Karakter" required className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-slate-50 outline-none focus:ring-2 ring-emerald-500 font-medium" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Nomor WhatsApp (Opsional)</label>
            <input type="tel" placeholder="0812345678xx" className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-slate-50 outline-none focus:ring-2 ring-emerald-500 font-medium" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50 text-sm mt-2">
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Buat Akun Platform'}
          </button>
        </form>
        <div className="mt-5 text-center border-t pt-4">
          <button onClick={onSwitchView} className="text-xs text-emerald-600 font-bold hover:underline">Sudah Terdaftar? Masuk Kembali</button>
        </div>
      </div>
    </div>
  );
}
