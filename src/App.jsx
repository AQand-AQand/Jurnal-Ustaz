import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { supabase } from './supabase';
import { Lock, UserPlus, BookOpen, FileText, CheckSquare, Home, RefreshCw } from 'lucide-react';

// --- KOMPONEN KEAMANAN ---
function AuthScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-6">Buku Ustaz</h1>
        <input type="password" placeholder="PIN (1234)" className="w-full p-4 mb-4 border rounded-xl text-center text-2xl" value={pin} onChange={(e) => setPin(e.target.value)} />
        <button onClick={() => pin === '1234' ? onUnlock() : alert('PIN Salah')} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Buka Kunci</button>
      </div>
    </div>
  );
}

// --- KOMPONEN UTAMA ---
export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const murid = useLiveQuery(() => db.murid.toArray(), []);

  if (isLocked) return <AuthScreen onUnlock={() => setIsLocked(false)} />;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20">
      <header className="bg-white p-4 font-bold border-b text-center">Buku Ustaz</header>
      
      <main className="p-4">
        {tab === 'dashboard' && <div className="p-6 bg-emerald-600 text-white rounded-xl">Total Murid: {murid?.length || 0}</div>}
        
        {tab === 'murid' && (
          <div className="space-y-3">
            {murid?.map(m => <div key={m.id} className="p-4 bg-white rounded-lg border">{m.nama} - {m.kelas}</div>)}
          </div>
        )}

        {tab === 'absen' && (
          <div className="space-y-3">
            {murid?.map(m => (
              <div key={m.id} className="p-4 bg-white rounded-lg border flex justify-between items-center">
                <span>{m.nama}</span>
                <div className="flex gap-1">
                  {['H','I','S','A'].map(s => (
                    <button key={s} onClick={() => alert(m.nama + ' : ' + s)} className="px-3 py-1 bg-slate-100 rounded text-xs font-bold">{s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around p-3">
        <button onClick={() => setTab('dashboard')}><Home /></button>
        <button onClick={() => setTab('murid')}><UserPlus /></button>
        <button onClick={() => setTab('absen')}><CheckSquare /></button>
        <button onClick={() => setTab('soal')}><FileText /></button>
      </nav>
    </div>
  );
}
