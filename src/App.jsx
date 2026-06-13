import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Lock, UserPlus, BookOpen, FileText, CheckSquare, Home } from 'lucide-react';

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const murid = useLiveQuery(() => db.murid.toArray(), []);

  // Fungsi Absen
  const catatAbsen = async (muridId, status) => {
    const tanggal = new Date().toISOString().split('T')[0];
    await db.absensi.add({ murid_id: muridId, status, tanggal });
    alert(`Tersimpan: ${status}`);
  };

  if (isLocked) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Buku Ustaz</h1>
      <input type="password" placeholder="PIN (1234)" className="text-black p-4 w-full max-w-sm rounded-xl text-center mb-4" 
             onChange={(e) => { if(e.target.value === '1234') setIsLocked(false); }} />
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20">
      <header className="bg-white p-4 font-bold border-b text-center sticky top-0 z-10 shadow-sm">Buku Ustaz</header>
      
      <main className="p-4">
        {tab === 'dashboard' && (
          <div className="space-y-4">
            <div className="p-6 bg-emerald-600 text-white rounded-xl shadow-lg">
              <h2 className="text-lg font-bold">Total Murid</h2>
              <p className="text-4xl font-bold">{murid?.length || 0}</p>
            </div>
          </div>
        )}

        {tab === 'murid' && (
          <div className="space-y-3">
            {murid?.map(m => <div key={m.id} className="p-4 bg-white rounded-lg border shadow-sm">{m.nama}</div>)}
          </div>
        )}

        {tab === 'absen' && (
          <div className="space-y-3">
            {murid?.map(m => (
              <div key={m.id} className="p-4 bg-white rounded-lg border shadow-sm flex justify-between items-center">
                <span className="font-semibold text-sm">{m.nama}</span>
                <div className="flex gap-1">
                  {['H','I','S','A'].map(s => (
                    <button key={s} onClick={() => catatAbsen(m.id, s)} 
                            className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold hover:bg-emerald-600 hover:text-white">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around p-3 z-20">
        <button onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}><Home /></button>
        <button onClick={() => setTab('murid')} className={tab === 'murid' ? 'text-emerald-600' : 'text-slate-400'}><UserPlus /></button>
        <button onClick={() => setTab('absen')} className={tab === 'absen' ? 'text-emerald-600' : 'text-slate-400'}><CheckSquare /></button>
        <button onClick={() => setTab('soal')} className={tab === 'soal' ? 'text-emerald-600' : 'text-slate-400'}><FileText /></button>
      </nav>
    </div>
  );
}
