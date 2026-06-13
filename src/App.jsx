import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Lock, UserPlus, BookOpen, FileText, CheckSquare, Home, Search, Calendar, Trash2 } from 'lucide-react';

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [tab, setTab] = useState('dashboard');
  
  // State untuk Fitur Modern
  const [tanggalAbsen, setTanggalAbsen] = useState(new Date().toISOString().split('T')[0]);
  const [pencarian, setPencarian] = useState('');

  // Pengambilan Data Real-Time
  const murid = useLiveQuery(() => db.murid.toArray(), []);
  const semuaAbsensi = useLiveQuery(() => db.absensi.where('tanggal').equals(tanggalAbsen).toArray(), [tanggalAbsen]);

  // --- FUNGSI LOGIKA MODERN ---
  const tambahMurid = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nama = formData.get('nama');
    const kelas = formData.get('kelas');
    if (nama && kelas) {
      await db.murid.add({ nama, kelas });
      e.target.reset();
    }
  };

  const hapusMurid = async (id) => {
    if (window.confirm('Yakin ingin menghapus murid ini?')) {
      await db.murid.delete(id);
      // Opsional: Hapus juga riwayat absensinya
      const absensiTerkait = await db.absensi.where('murid_id').equals(id).toArray();
      const idAbsensi = absensiTerkait.map(a => a.id);
      await db.absensi.bulkDelete(idAbsensi);
    }
  };

  const catatAbsen = async (muridId, status) => {
    const dataAda = await db.absensi.where({ murid_id: muridId, tanggal: tanggalAbsen }).first();
    if (dataAda) {
      await db.absensi.update(dataAda.id, { status });
    } else {
      await db.absensi.add({ murid_id: muridId, status, tanggal: tanggalAbsen });
    }
  };

  // --- FILTER & STATISTIK ---
  const muridDifilter = murid?.filter(m => m.nama.toLowerCase().includes(pencarian.toLowerCase())) || [];
  
  const totalHadir = semuaAbsensi?.filter(a => a.status === 'H').length || 0;
  const totalIzin = semuaAbsensi?.filter(a => a.status === 'I').length || 0;
  const totalSakit = semuaAbsensi?.filter(a => a.status === 'S').length || 0;
  const totalAlfa = semuaAbsensi?.filter(a => a.status === 'A').length || 0;

  // --- TAMPILAN KUNCI ---
  if (isLocked) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-6 text-white">
      <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
        <Lock size={32} className="text-white" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Buku Ustaz</h1>
      <p className="text-slate-400 mb-8 font-medium">Cabang Jember Timur</p>
      
      <input type="password" placeholder="PIN (1234)" maxLength="4" 
             className="text-black p-4 w-full max-w-sm rounded-xl text-center mb-4 text-3xl tracking-[1em] outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all" 
             onChange={(e) => { if(e.target.value === '1234') setIsLocked(false); }} autoFocus />
    </div>
  );

  // --- TAMPILAN UTAMA ---
  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-24 shadow-2xl relative overflow-hidden">
      <header className="bg-white px-6 py-4 font-bold border-b text-slate-800 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <div className="bg-emerald-100 p-2 rounded-lg">
          <BookOpen size={20} className="text-emerald-600"/>
        </div>
        <div className="flex flex-col">
          <span className="text-lg leading-tight">Buku Ustaz Pro</span>
        </div>
      </header>
      
      <main className="p-4 space-y-4">
        {/* --- MODUL DASHBOARD --- */}
        {tab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <p className="text-emerald-100 text-sm font-medium mb-1">WILAYAH JEMBER</p>
              <h2 className="text-2xl font-bold mb-4">Cabang Jember Timur</h2>
              
              <div className="flex items-center gap-4 mt-6 border-t border-emerald-400/30 pt-4">
                <div>
                  <p className="text-emerald-100 text-xs font-medium">Total Murid</p>
                  <p className="text-3xl font-bold">{murid?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-emerald-600"/> Rekap Hari Ini
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-bold mb-1">Hadir</p>
                  <p className="text-xl font-bold text-emerald-700">{totalHadir}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold mb-1">Izin</p>
                  <p className="text-xl font-bold text-blue-700">{totalIzin}</p>
                </div>
                <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-600 font-bold mb-1">Sakit</p>
                  <p className="text-xl font-bold text-amber-700">{totalSakit}</p>
                </div>
                <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
                  <p className="text-xs text-rose-600 font-bold mb-1">Alfa</p>
                  <p className="text-xl font-bold text-rose-700">{totalAlfa}</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
               <p className="text-xs text-slate-400">Bantuan IT: 0853 1123 9333</p>
            </div>
          </div>
        )}

        {/* --- MODUL MURID --- */}
        {tab === 'murid' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={tambahMurid} className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 mb-2">Tambah Data Murid</h3>
              <input name="nama" placeholder="Nama Lengkap" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all" required />
              <input name="kelas" placeholder="Kelas / Kelompok" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all" required />
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                <UserPlus size={18}/> Simpan Murid
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">Daftar Murid ({murid?.length || 0})</p>
              {murid?.map(m => (
                <div key={m.id} className="p-4 bg-white rounded-xl border shadow-sm flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-slate-800">{m.nama}</p>
                    <p className="text-xs text-emerald-600 font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded mt-1">{m.kelas}</p>
                  </div>
                  <button onClick={() => hapusMurid(m.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {murid?.length === 0 && <div className="text-center p-8 text-slate-400 border-2 border-dashed rounded-xl">Belum ada data murid</div>}
            </div>
          </div>
        )}

        {/* --- MODUL ABSEN MODERN --- */}
        {tab === 'absen' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header Absen: Pilih Tanggal & Pencarian */}
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3 sticky top-[72px] z-10">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500">
                  <Calendar size={20} />
                </div>
                <input 
                  type="date" 
                  value={tanggalAbsen} 
                  onChange={(e) => setTanggalAbsen(e.target.value)}
                  className="flex-1 p-2 border-b-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-slate-700 bg-transparent"
                />
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari nama murid..." 
                  value={pencarian}
                  onChange={(e) => setPencarian(e.target.value)}
                  className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-sm"
                />
              </div>
            </div>

            {/* List Absensi */}
            <div className="space-y-2">
              {muridDifilter.map(m => {
                const statusMurid = semuaAbsensi?.find(a => a.murid_id === m.id)?.status;
                
                // Konfigurasi warna modern untuk tombol
                const warnaTombol = {
                  'H': { aktif: 'bg-emerald-500 text-white ring-emerald-200', pasif: 'bg-slate-100 text-slate-600 hover:bg-emerald-50' },
                  'I': { aktif: 'bg-blue-500 text-white ring-blue-200', pasif: 'bg-slate-100 text-slate-600 hover:bg-blue-50' },
                  'S': { aktif: 'bg-amber-500 text-white ring-amber-200', pasif: 'bg-slate-100 text-slate-600 hover:bg-amber-50' },
                  'A': { aktif: 'bg-rose-500 text-white ring-rose-200', pasif: 'bg-slate-100 text-slate-600 hover:bg-rose-50' },
                };

                return (
                  <div key={m.id} className="p-4 bg-white rounded-xl border shadow-sm flex flex-col gap-3">
                    <span className="font-bold text-slate-800">{m.nama}</span>
                    <div className="grid grid-cols-4 gap-2">
                      {['H','I','S','A'].map(s => {
                        const isSelected = statusMurid === s;
                        const kelasWarna = isSelected ? warnaTombol[s].aktif + ' ring-4 shadow-md' : warnaTombol[s].pasif;
                        
                        return (
                          <button 
                            key={s} 
                            onClick={() => catatAbsen(m.id, s)} 
                            className={`py-2 rounded-lg text-sm font-bold transition-all duration-200 ${kelasWarna}`}
                          >
                            {s === 'H' ? 'Hadir' : s === 'I' ? 'Izin' : s === 'S' ? 'Sakit' : 'Alfa'}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                );
              })}
              {muridDifilter.length === 0 && <p className="text-center text-slate-400 mt-8 text-sm">Tidak ada nama yang cocok.</p>}
            </div>
          </div>
        )}
      </main>

      {/* --- NAVIGASI BAWAH --- */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 flex justify-around p-2 z-20 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        {[
          { id: 'dashboard', icon: Home, label: 'Beranda' },
          { id: 'murid', icon: UserPlus, label: 'Murid' },
          { id: 'absen', icon: CheckSquare, label: 'Absensi' },
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setTab(item.id)} 
            className={`flex flex-col items-center gap-1 p-2 w-20 rounded-xl transition-all duration-200 ${tab === item.id ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <item.icon size={22} className={tab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}/>
            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
