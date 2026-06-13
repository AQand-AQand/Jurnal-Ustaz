import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Lock, UserPlus, BookOpen, FileText, CheckSquare, Home } from 'lucide-react';

// --- KOMPONEN KEAMANAN (PIN) ---
function AuthScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  
  // PIN default untuk percobaan awal: 1234
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '1234') {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-slate-700">
        <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
          <Lock size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Buku Ustaz Pro</h1>
        <p className="text-slate-400 text-sm mb-8">Sistem Informasi Manajemen Kelas</p>
        
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            maxLength="4"
            placeholder="PIN"
            className="w-full text-center text-3xl tracking-[1em] p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none mb-4"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mb-4">PIN Salah! Coba lagi.</p>}
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 font-semibold py-3 rounded-xl transition-all">
            Buka Kunci
          </button>
        </form>
      </div>
    </div>
  );
}

// --- KOMPONEN HALAMAN MURID ---
function HalamanMurid() {
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const murid = useLiveQuery(() => db.murid.toArray(), []);

  const simpanMurid = async (e) => {
    e.preventDefault();
    if (!nama || !kelas) return;
    await db.murid.add({ nama, kelas });
    setNama(''); setKelas('');
  };

  return (
    <div className="pb-24 pt-6 px-4">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <UserPlus size={24} className="text-emerald-600"/> Data Murid
      </h2>
      
      <form onSubmit={simpanMurid} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col gap-3">
        <input type="text" placeholder="Nama Lengkap Murid" className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" value={nama} onChange={e => setNama(e.target.value)} />
        <input type="text" placeholder="Kelas (contoh: 7A)" className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" value={kelas} onChange={e => setKelas(e.target.value)} />
        <button type="submit" className="bg-emerald-600 text-white font-semibold p-3 rounded-lg hover:bg-emerald-700">Tambah Murid</button>
      </form>

      <div className="grid gap-3">
        {murid?.map(m => (
          <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">{m.nama}</p>
              <p className="text-xs text-slate-500">Kelas: {m.kelas}</p>
            </div>
            <button className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-semibold">Profil</button>
          </div>
        ))}
        {murid?.length === 0 && <p className="text-center text-slate-400 mt-4 text-sm">Belum ada data murid.</p>}
      </div>
    </div>
  );
}

// --- KOMPONEN UTAMA (LAYOUT & NAVIGASI) ---
export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const murid = useLiveQuery(() => db.murid.toArray(), []);

  if (isLocked) {
    return <AuthScreen onUnlock={() => setIsLocked(false)} />;
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return (
        <div className="p-6 pb-24">
          <div className="bg-emerald-600 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-emerald-600/20 relative overflow-hidden">
            {/* Dekorasi IT Modern Pattern di latar belakang */}
            <div className="absolute opacity-10 top-0 right-0 w-32 h-32 bg-white rounded-full -mr-10 -mt-10"></div>
            
            <h2 className="text-2xl font-bold relative z-10">Selamat Datang</h2>
            <p className="text-emerald-100 text-sm opacity-90 mt-1 relative z-10">Cabang Jember Timur</p>
            <p className="text-emerald-100 text-xs opacity-80 mt-3 border-t border-emerald-500/50 pt-2 relative z-10">
              Kontak Bantuan: 0853 1123 9333
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-xs font-semibold mb-1">Total Murid</p>
              <p className="text-3xl font-bold text-slate-800">{murid?.length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-xs font-semibold mb-1">Status Data</p>
              <p className="text-sm font-bold text-emerald-600 mt-1 bg-emerald-50 py-1 px-2 rounded inline-block">Tersimpan Lokal</p>
            </div>
          </div>
        </div>
      );
      case 'murid': return <HalamanMurid />;
      case 'absen': return <div className="p-6 pt-10 text-center"><CheckSquare size={48} className="mx-auto text-slate-300 mb-4"/><h2 className="font-bold text-slate-600">Modul Absen (Segera Hadir)</h2></div>;
      case 'soal': return <div className="p-6 pt-10 text-center"><FileText size={48} className="mx-auto text-slate-300 mb-4"/><h2 className="font-bold text-slate-600">Modul Bank Soal (Segera Hadir)</h2></div>;
      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen relative shadow-2xl overflow-hidden">
      <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <BookOpen size={20} className="text-emerald-600" />
          </div>
          <h1 className="font-bold text-slate-800 tracking-tight">Buku Ustaz</h1>
        </div>
        <button onClick={() => setIsLocked(true)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
          <Lock size={16} />
        </button>
      </header>

      <main className="min-h-full">
        {renderContent()}
      </main>

      <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full max-w-md flex justify-between items-center px-6 py-3 z-20 pb-safe">
        {[
          { id: 'dashboard', icon: Home, label: 'Home' },
          { id: 'murid', icon: UserPlus, label: 'Murid' },
          { id: 'absen', icon: CheckSquare, label: 'Absen' },
          { id: 'soal', icon: FileText, label: 'Soal' }
        ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'}`}>
            <item.icon size={24} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
