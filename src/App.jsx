import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { supabase } from './supabase';
import { Lock, UserPlus, BookOpen, FileText, CheckSquare, Home, RefreshCw } from 'lucide-react';

// --- KOMPONEN KEAMANAN (PIN) ---
function AuthScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '1234') { onUnlock(); } else { setError(true); setPin(''); }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-slate-700">
        <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
          <Lock size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Buku Ustaz Pro</h1>
        <form onSubmit={handleLogin}>
          <input type="password" maxLength="4" placeholder="PIN" className="w-full text-center text-3xl tracking-[1em] p-3 rounded-xl bg-slate-900 border border-slate-600 mb-4 outline-none" value={pin} onChange={(e) => { setPin(e.target.value); setError(false); }} autoFocus />
          {error && <p className="text-red-400 text-sm mb-4">PIN Salah!</p>}
          <button type="submit" className="w-full bg-emerald-500 py-3 rounded-xl font-bold">Buka Kunci</button>
        </form>
      </div>
    </div>
  );
}

// --- KOMPONEN HALAMAN MURID ---
function HalamanMurid() {
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const murid = useLiveQuery(() => db.murid.toArray(), []);

  const simpanMurid = async (e) => {
    e.preventDefault();
    if (!nama || !kelas) return;
    await db.murid.add({ nama, kelas });
    setNama(''); setKelas('');
  };

  const sinkronData = async () => {
    setIsSyncing(true);
    try {
      const dataLokal = await db.murid.toArray();
      if (dataLokal.length > 0) await supabase.from('murid').upsert(dataLokal);
      const { data } = await supabase.from('murid').select('*');
      if (data) await db.murid.bulkPut(data);
      alert('Sinkron Berhasil!');
    } catch (e) { alert('Gagal: ' + e.message); }
    setIsSyncing(false);
  };

  return (
    <div className="pb-24 pt-6 px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Data Murid</h2>
        <button onClick={sinkronData} className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
          <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> Sinkron
        </button>
      </div>
      <form onSubmit={simpanMurid} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col gap-3">
        <input type="text" placeholder="Nama Murid" className="p-3 bg-slate-50 border rounded-lg" value={nama} onChange={e => setNama(e.target.value)} />
        <input type="text" placeholder="Kelas" className="p-3 bg-slate-50 border rounded-lg" value={kelas} onChange={e => setKelas(e.target.value)} />
        <button type="submit" className="bg-emerald-600 text-white font-bold p-3 rounded-lg">Tambah Murid</button>
      </form>
      <div className="grid gap-3">
        {murid?.map(m => (
          <div key={m.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
            <span className="font-bold text-slate-800">{m.nama}</span>
            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{m.kelas}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- KOMPONEN UTAMA ---
export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const murid = useLiveQuery(() => db.murid.toArray(), []);

  if (isLocked) return <AuthScreen onUnlock={() => setIsLocked(false)} />;

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return (
        <div className="p-6">
          <div className="bg-emerald-600 rounded-2xl p-6 text-white mb-6">
            <h2 className="text-2xl font-bold">Selamat Datang</h2>
            <p className="text-emerald-100 text-sm">Sistem Buku Ustaz Pro</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow border">
              <p className="text-xs font-semibold text-slate-500">Total Murid</p>
              <p className="text-3xl font-bold">{murid?.length || 0}</p>
            </div>
          </div>
        </div>
      );
      case 'murid': return <HalamanMurid />;
      case 'absen': return (
        <div className="pb-24 pt-6 px-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Absensi Hari Ini</h2>
          <div className="bg-white rounded-xl shadow-sm border divide-y">
            {murid?.map(m => (
              <div key={m.id} className="p-4 flex justify-between items-center">
                <span className="font-medium text-slate-700">{m.nama}</span>
                <div className="flex gap-1">
                  {['H', 'I', 'S', 'A'].map(s => (
                    <button key={s} onClick={() => alert(`${m.nama} ditandai ${s}`)} className="w-8 h-8 bg-slate-100 rounded hover:bg-emerald-500 hover:text-white text-xs font-bold">{s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      default: return <div className="p-6 text-center text-slate-400">Modul Belum Tersedia</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen relative shadow-2xl">
      <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <h1 className="font-bold text-slate-800">Buku Ustaz</h1>
        <button onClick={() => setIsLocked(true)}><Lock size={16} /></button>
      </header>
      <main>{renderContent()}</main>
      <nav className="bg-white border-t fixed bottom-0 w-full max-w-md flex justify-around px-2 py-3 pb-safe z-20">
        {[ {id:'dashboard', icon:Home}, {id:'murid', icon:UserPlus}, {id:'absen', icon:CheckSquare}, {id:'soal', icon:FileText} ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'}>
            <item.icon size={24} />
          </button>
        ))}
      </nav>
    </div>
  );
}
