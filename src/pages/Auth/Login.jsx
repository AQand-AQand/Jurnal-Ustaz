import React, { useState } from 'react';

export default function Login({ onLogin, onSwitchView, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      alert("Gagal Masuk: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 font-sans max-w-md mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <i className="fa-solid fa-graduation-cap text-3xl"></i>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">SIM KBM USTAZ</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Sistem Informasi Mengajar internal Assatidz</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Email Resmi</label>
            <input type="email" placeholder="ustaz@pesantren.id" required className="w-full border border-slate-300 rounded-xl py-3 px-4 focus:ring-2 ring-emerald-500 outline-none text-sm bg-slate-50 font-medium transition-all" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Kata Sandi</label>
            <input type="password" placeholder="••••••••" required className="w-full border border-slate-300 rounded-xl py-3 px-4 focus:ring-2 ring-emerald-500 outline-none text-sm bg-slate-50 font-medium transition-all" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="text-right">
            <button type="button" onClick={onForgotPassword} className="text-xs font-bold text-emerald-600 hover:underline">Lupa Password?</button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50">
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Masuk Sistem'}
          </button>
        </form>
        <div className="mt-6 text-center border-t pt-4">
          <p className="text-xs text-slate-400">Belum memiliki akun ustaz?</p>
          <button onClick={onSwitchView} className="text-sm text-emerald-600 font-bold hover:underline mt-1">Registrasi Akun Baru</button>
        </div>
      </div>
    </div>
  );
}
