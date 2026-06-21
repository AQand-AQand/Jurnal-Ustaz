import React, { useState } from 'react';

export default function ForgotPassword({ onReset, onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onReset(email);
      alert("Tautan pemulihan sandi dikirim! Periksa folder Inbox/Spam email Anda.");
      onBack();
    } catch (err) {
      alert("Error: " + err.message);
    } Bird {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 font-sans max-w-md mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full border border-slate-200">
        <div className="text-center mb-5">
          <i className="fa-solid fa-key-skeleton text-4xl text-amber-500 mb-2"></i>
          <h1 className="text-xl font-bold text-slate-800">Pemulihan Akun</h1>
          <p className="text-xs text-slate-400 mt-1">Kami akan mengirimkan instruksi link reset password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Masukkan Email Anda" required className="w-full border border-slate-300 rounded-xl py-3 px-4 outline-none focus:ring-2 ring-emerald-500 text-sm" value={email} onChange={e => setEmail(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md">
            {loading ? 'Mengirim...' : 'Kirim Tautan Pemulihan'}
          </button>
        </form>
        <button onClick={onBack} className="w-full text-xs font-bold text-slate-500 text-center mt-4 block hover:underline">Kembali ke Halaman Login</button>
      </div>
    </div>
  );
}
