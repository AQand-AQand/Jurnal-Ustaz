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
function LoginView({ onLogin, onSwitchView }) {
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
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-graduation-cap text-3xl"></i>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">SIM KBM USTAZ</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Sistem Informasi Mengajar internal Assatidz</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email Resmi" required className="w-full border border-slate-300 rounded-xl py-3 px-4 text-sm bg-slate-50" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Kata Sandi" required className="w-full border border-slate-300 rounded-xl py-3 px-4 text-sm bg-slate-50" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50">
            {loading ? 'Memuat...' : 'Masuk Sistem'}
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
  const [formData, setFormData] = useState({ namaLengkap: '', namaPanggilan: '', email: '', password: '' });
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
          <h1 className="text-2xl font-black text-slate-800">Daftar Akun Ustaz</h1>
          <p className="text-xs text-slate-400 mt-1">Bergabung ke ekosistem digital SIM KBM</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <input type="text" placeholder="Nama Lengkap & Gelar" required className="w-full border rounded-xl p-3 text-xs bg-slate-50" value={formData.namaLengkap} onChange={e => setFormData({...formData, namaLengkap: e.target.value})} />
          <input type="text" placeholder="Nama Panggilan" required className="w-full border rounded-xl p-3 text-xs bg-slate-50" value={formData.namaPanggilan} onChange={e => setFormData({...formData, namaPanggilan: e.target.value})} />
          <input type="email" placeholder="Email Utama" required className="w-full border rounded-xl p-3 text-xs bg-slate-50" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Kata Sandi (Min 6 Karakter)" required className="w-full border rounded-xl p-3 text-xs bg-slate-50" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm mt-2">
            {loading ? 'Mendaftarkan...' : 'Buat Akun Platform'}
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
// 4. COMPONENT: DASHBOARD VIEW
// ====================================================================
function DashboardView({ profile, stats, hariIni }) {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-white/10 text-9xl font-black">KBM</div>
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
            <i className="fa-solid fa-user-tie text-xl text-emerald-100"></i>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wide">Assalamu'alaikum, {profile?.nama_panggilan || 'Ustaz'}</h2>
            <p className="text-[11px] text-emerald-100/90 font-medium">Platform SIM KBM • {profile?.role?.toUpperCase() || 'USTAZ'}</p>
          </div>
        </div>
        <div className="mt-4 bg-black/10 p-3 rounded-xl border border-white/10 text-xs leading-relaxed font-medium">
          Selamat datang kembali di sistem administrasi mandiri. Data mengajar Anda tersimpan dengan aman secara personal.
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Jadwal</p>
            <p className="text-sm font-extrabold text-slate-700">{stats.totalJadwal} Kelas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// 5. COMPONENT: FITUR JADWAL MENGAJAR
// ====================================================================
function JadwalView({ listJadwal, user, onRefresh }) {
  const [hari, setHari] = useState('Senin');
  const [materi, setMateri] = useState('');
  const [jam, setJam] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('jadwal_mengajar').insert([
        { hari, kelas_materi: materi, jam, user_id: user.id }
      ]);
      if (error) throw error;
      setMateri(''); setJam('');
      alert("Jadwal Berhasil Ditambahkan!");
      onRefresh();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(confirm("Hapus jadwal ini?")) {
      const { error } = await supabase.from('jadwal_mengajar').delete().eq('id', id);
      if(!error) onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-3"><i className="fa-solid fa-plus text-emerald-600 mr-2"></i>Tambah Jadwal Baru</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <select className="w-full border rounded-xl p-2.5 text-xs bg-slate-50 font-medium" value={hari} onChange={e => setHari(e.target.value)}>
            {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <input type="text" placeholder="Nama Kelas / Materi (Contoh: Kelas 3 - Tajwid)" required className="w-full border rounded-xl p-2.5 text-xs bg-slate-50" value={materi} onChange={e => setMateri(e.target.value)} />
          <input type="text" placeholder="Jam Belajar (Contoh: 16:00 - 17:30)" required className="w-full border rounded-xl p-2.5 text-xs bg-slate-50" value={jam} onChange={e => setJam(e.target.value)} />
          <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-md">Simpan Jadwal</button>
        </form>
      </div>

      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-3"><i className="fa-solid fa-list text-emerald-600 mr-2"></i>Daftar Agenda Mengajar</h3>
        {listJadwal.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Belum ada jadwal mengajar.</p> : (
          <div className="space-y-2">
            {listJadwal.map((j) => (
              <div key={j.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md mr-2">{j.hari}</span>
                  <span className="text-xs font-bold text-slate-700">{j.kelas_materi}</span>
                  <p className="text-[10px] text-slate-400 font-medium mt-1"><i className="fa-regular fa-clock mr-1"></i>{j.jam}</p>
                </div>
                <button onClick={() => handleDelete(j.id)} className="text-red-400 hover:text-red-600 p-1"><i className="fa-solid fa-trash-can text-xs"></i></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ====================================================================
// 6. COMPONENT: FITUR MANAJEMEN SANTRI
// ====================================================================
function SantriView({ muridList, user, onRefresh }) {
  const [nama, setNama] = useState('');
  const [jilid, setJilid] = useState('');
  const [status, setStatus] = useState('Aktif');

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('murid').insert([
        { nama_murid: nama, kelas_jilid: jilid, status_aktif: status, user_id: user.id }
      ]);
      if (error) throw error;
      setNama(''); setJilid('');
      alert("Data Santri Berhasil Disimpan!");
      onRefresh();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(confirm("Hapus data santri ini?")) {
      const { error } = await supabase.from('murid').delete().eq('id', id);
      if(!error) onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-3"><i className="fa-solid fa-user-plus text-emerald-600 mr-2"></i>Tambah Data Santri Binaan</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <input type="text" placeholder="Nama Lengkap Santri" required className="w-full border rounded-xl p-2.5 text-xs bg-slate-50" value={nama} onChange={e => setNama(e.target.value)} />
          <input type="text" placeholder="Tingkatan / Jilid Buku (Contoh: Jilid 4 / Al-Qur'an)" required className="w-full border rounded-xl p-2.5 text-xs bg-slate-50" value={jilid} onChange={e => setJilid(e.target.value)} />
          <select className="w-full border rounded-xl p-2.5 text-xs bg-slate-50 font-medium" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="Aktif">Aktif Mengaji</option>
            <option value="Cuti">Cuti / Izin</option>
            <option value="Alumni">Alumni / Lulus</option>
          </select>
          <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-md">Tambah Santri</button>
        </form>
      </div>

      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-3"><i className="fa-solid fa-users text-emerald-600 mr-2"></i>Buku Induk Santri</h3>
        {muridList.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Belum ada data santri dimasukkan.</p> : (
          <div className="space-y-2">
            {muridList.map((m) => (
              <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{m.nama_murid}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Progress: <span className="text-emerald-600 font-bold">{m.kelas_jilid}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${m.status_aktif === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{m.status_aktif}</span>
                  <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-600 p-1"><i className="fa-solid fa-trash-can text-xs"></i></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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

  // Database States
  const [listJadwal, setListJadwal] = useState([]);
  const [muridList, setMuridList] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchAppData(session.user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await fetchAppData(currentUser.id);
      else { setProfile(null); setListJadwal([]); setMuridList([]); setAuthLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchAppData(userId) {
    setAuthLoading(true);
    try {
      // 1. Ambil Profil Pengguna
      const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      setProfile(prof || null);
      
      // 2. Ambil Jadwal dan Data Murid Khusus ID User ini
      const { data: jdwl } = await supabase.from('jadwal_mengajar').select('*').order('hari', { ascending: true });
      const { data: mrd } = await supabase.from('murid').select('*').order('nama_murid', { ascending: true });
      
      if (jdwl) setListJadwal(jdwl);
      if (mrd) setMuridList(mrd);
    } catch (err) { console.error("Gagal sinkron data: ", err); } 
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
    return <LoginView onLogin={handleLogin} onSwitchView={() => setAuthView('register')} />;
  }

  const hariIni = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date().getDay()];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x pb-24 relative">
      <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <h1 className="text-lg font-black tracking-tight">SIM KBM USTAZ</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-emerald-100 hover:text-white text-sm"><i className="fa-solid fa-right-from-bracket"></i></button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5">
        {activeTab === 'dashboard' && <DashboardView profile={profile} stats={{ totalJadwal: listJadwal.length }} hariIni={hariIni} />}
        {activeTab === 'jadwal' && <JadwalView listJadwal={listJadwal} user={user} onRefresh={() => fetchAppData(user.id)} />}
        {activeTab === 'santri' && <SantriView muridList={muridList} user={user} onRefresh={() => fetchAppData(user.id)} />}
      </main>

      {/* 4 MENU NAVIGATION BAR DI BAGIAN BAWAH */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around py-3.5 z-50 shadow-md">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center ${activeTab==='dashboard'?'text-emerald-600':'text-slate-400'}`}>
          <i className="fa-solid fa-chart-pie text-lg"></i>
          <span className="text-[10px] font-bold mt-1">Beranda</span>
        </button>
        <button onClick={() => setActiveTab('jadwal')} className={`flex flex-col items-center ${activeTab==='jadwal'?'text-emerald-600':'text-slate-400'}`}>
          <i className="fa-solid fa-calendar-days text-lg"></i>
          <span className="text-[10px] font-bold mt-1">Jadwal</span>
        </button>
        <button onClick={() => setActiveTab('santri')} className={`flex flex-col items-center ${activeTab==='santri'?'text-emerald-600':'text-slate-400'}`}>
          <i className="fa-solid fa-graduation-cap text-lg"></i>
          <span className="text-[10px] font-bold mt-1">Santri</span>
        </button>
      </nav>
    </div>
  );
}
