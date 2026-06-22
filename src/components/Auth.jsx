// File: src/components/Auth.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); 
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) alert("Gagal Login: " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) alert("Gagal Daftar: " + error.message);
      else alert("Akun berhasil dibuat! Silakan masuk.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 font-sans max-w-md mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full border border-slate-200">
        <div className="text-center mb-6">
          <i className="fa-solid fa-graduation-cap text-5xl text-emerald-600 mb-3 block"></i>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Buku Ustaz</h1>
        </div>
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input 
            type="email" 
            placeholder="Alamat Email" 
            required 
            className="w-full border border-slate-300 rounded-xl py-3 px-4 focus:ring-2 ring-emerald-500 outline-none text-sm" 
            value={authEmail} 
            onChange={e => setAuthEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password Akun" 
            required 
            className="w-full border border-slate-300 rounded-xl py-3 px-4 focus:ring-2 ring-emerald-500 outline-none text-sm" 
            value={authPassword} 
            onChange={e => setAuthPassword(e.target.value)} 
          />
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg disabled:opacity-50"
          >
            {loading ? 'Memproses...' : (authMode === 'login' ? 'Masuk' : 'Daftar')}
          </button>
        </form>
        <div className="mt-5 text-center">
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
            className="text-sm text-emerald-600 font-bold hover:underline"
          >
            {authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
          </button>
        </div>
      </div>
    </div>
  );
}
