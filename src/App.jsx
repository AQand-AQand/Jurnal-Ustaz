import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ====================================================================
// 1. SUPABASE CLIENT CONFIGURATION
// ====================================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://gjfdxqhwwytcgylokksq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_1SSrr1ebYfBvZ7V60egzfg__Q_wz_Pm";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});

// ====================================================================
// 2. COMPONENT: LOGIN
// ====================================================================
function LoginView({ onLogin, onSwitchView, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await onLogin(email, password); } 
    catch (err) { alert("Gagal Masuk: " + err.message); } 
    finally { setLoading(false); }
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

// ====================================================================
// 3. COMPONENT: REGISTER
// ====================================================================
function RegisterView({ onRegister, onSwitchView }) {
  const [formData, setFormData] = useState({ namaLengkap: '', namaPanggilan: '', email: '', password: '', whatsapp: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onRegister(formData.email, formData.password, formData);
      alert("Registrasi sukses! Silakan login.");
      onSwitchView();
    } catch (err) { alert("Gagal Registrasi: " + err.message); } 
    finally { setLoading(false); }
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
            <label className="text-xs font-bold text-slate-600 block mb-1">Kata Sandi</label>
            <input type="password" placeholder="Minimal 6 Karakter" required className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-slate-50 outline-none focus:ring-2 ring-emerald-500 font-medium" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
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

// ====================================================================
// 4. COMPONENT: FORGOT PASSWORD
// ====================================================================
function ForgotPasswordView({ onReset, onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onReset(email);
      alert("Tautan pemulihan sandi dikirim ke email!");
      onBack();
    } catch (err) { alert("Error: " + err.message); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 font-sans max-w-md mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full border border-slate-200">
        <div className="text-center mb-5">
          <i className="fa-solid fa-key text-4xl text-amber-500 mb-2"></i>
          <h1 className="text-xl font-bold text-slate-800">Pemulihan Akun</h1>
          <p className="text-xs text-slate-400 mt-1">Kami akan mengirimkan instruksi link reset password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Masukkan Email Anda" required className="w-full border border-slate-300 rounded-xl py-3 px-4 outline-none focus:ring-2 ring-emerald-500 text-sm" value={email} onChange={e => setEmail(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md">
            {loading ? 'Mengirim...' : 'Kirim Tautan Pemulihan'}
          </button>
        </form>
        <button onClick={onBack} className="w-full text-xs font-bold text-slate-500 text-center mt-4 block hover:underline">Kembali ke Login</button>
      </div>
    </div>
  );
}

// ====================================================================
// 5. COMPONENT: DASHBOARD VIEW
// ====================================================================
function DashboardView({ profile, stats, infoDinamis, hariIni }) {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 text-white p-5 rounded-3xl shadow-xl border border-emerald-600 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-white/10 text-9xl font-black">KBM</div>
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl border border-white/30 flex items-center justify-center shadow-inner">
            {profile?.foto_profil ? (
              <img src={profile.foto_profil} alt="Profil" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <i className="fa-solid fa-user-tie text-xl text-emerald-100"></i>
            )}
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wide">Assalamu'alaikum, {profile?.nama_panggilan || 'Ustaz'}</h2>
            <p className="text-[11px] text-emerald-100/90 font-medium">Platform SIM KBM • {profile?.role?.toUpperCase()}</p>
          </div>
        </div>
        <div className="mt-4 bg-black/10 p-3 rounded-xl border border-white/10 text-xs leading-relaxed font-medium">
          {infoDinamis}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm"><i className="fa-solid fa-calendar-day"></i></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hari Ini</p>
            <p className="text-sm font-extrabold text-slate-700">{hariIni}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm"><i className="fa-solid fa-book-open"></i></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KBM Aktif</p>
            <p className="text-sm font-extrabold text-slate-700">{stats.kbmHariIni} Kelas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// 6. COMPONENT: PROFIL CONFIG
// ====================================================================
function ProfilView({ profile, user, onRefresh }) {
  const [formData, setFormData] = useState({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setFormData({
      nama_lengkap: profile.nama_lengkap || '',
      nama_panggilan: profile.nama_panggilan || '',
      nomor_whatsapp: profile.nomor_whatsapp || ''
    });
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update(formData).eq('user_id', user.id);
      if (error) throw error;
      alert("Profil diperbarui!");
      onRefresh();
    } catch (err) { alert("Gagal: " + err.message); } 
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800 text-xs uppercase text-emerald-600 border-b pb-2">Profil Saya</h3>
      <form onSubmit={handleUpdate} className="space-y-3">
        <input type="text" placeholder="Nama Lengkap" className="w-full border rounded-xl p-2.5 text-xs bg-slate-50" value={formData.nama_lengkap} onChange={e => setFormData({...formData, nama_lengkap: e.target.value})} />
        <input type="text" placeholder="Nama Panggilan" className="w-full border rounded-xl p-2.5 text-xs bg-slate-50" value={formData.nama_panggilan} onChange={e => setFormData({...formData, nama_panggilan: e.target.value})} />
        <button type="submit" disabled={saving} className="w-full bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl">{saving ? 'Menyimpan...' : 'Simpan Profil'}</button>
      </form>
    </div>
  );
}

// ====================================================================
// 7. MAIN APP ORCHESTRATOR
// ====================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState('login'); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // KBM Data States
  const [listJadwal, setListJadwal] = useState([]);
  const [muridList, setMuridList] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await fetchUserProfile(currentUser.id);
      else { setProfile(null); setAuthLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId) {
    setAuthLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      setProfile(data || null);
      if (data) {
        const { data: jdwl } = await supabase.from('jadwal_mengajar').select('*');
        const { data: mrd } = await supabase.from('murid').select('*');
        if (jdwl) setListJadwal(jdwl);
        if (mrd) setMuridList(mrd);
      }
    } catch (err) { console.error(err); } 
    finally { setAuthLoading(false); }
  }

  const handleLogin = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const handleRegister = async (email, password, meta) => {
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { nama_lengkap: meta.namaLengkap, nama_panggilan: meta.namaPanggilan } }
    });
    if (error) throw error;
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-emerald-600 mb-2"></i>
          <p className="text-sm font-bold text-slate-500">Menghubungkan ke Server SIM KBM...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'register') return <RegisterView onRegister={handleRegister} onSwitchView={() => setAuthView('login')} />;
    if (authView === 'forgot') return <ForgotPasswordView onReset={(em) => supabase.auth.resetPasswordForEmail(em)} onBack={() => setAuthView('login')} />;
    return <LoginView onLogin={handleLogin} onSwitchView={() => setAuthView('register')} onForgotPassword={() => setAuthView('forgot')} />;
  }

  const hariIni = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date().getDay()];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x pb-24 relative">
      <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <h1 className="text-lg font-black tracking-tight">SIM KBM USTAZ</h1>
        <button onClick={handleLogout} className="text-emerald-100 hover:text-white text-sm"><i className="fa-solid fa-right-from-bracket"></i></button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5">
        {activeTab === 'dashboard' && (
          <DashboardView profile={profile} stats={{ kbmHariIni: listJadwal.filter(j=>j.hari===hariIni).length }} infoDinamis="Selamat datang di platform multi-user SIM KBM." hariIni={hariIni} />
        )}
        {activeTab === 'profil' && <ProfilView profile={profile} user={user} onRefresh={() => fetchUserProfile(user.id)} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around py-2 z-50 shadow-md">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center ${activeTab==='dashboard'?'text-emerald-600':'text-slate-400'}`}>
          <i className="fa-solid fa-chart-pie text-lg"></i>
          <span className="text-[10px] font-bold">Beranda</span>
        </button>
        <button onClick={() => setActiveTab('profil')} className={`flex flex-col items-center ${activeTab==='profil'?'text-emerald-600':'text-slate-400'}`}>
          <i className="fa-solid fa-user-gear text-lg"></i>
          <span className="text-[10px] font-bold">Profil</span>
        </button>
      </nav>
    </div>
  );
}
