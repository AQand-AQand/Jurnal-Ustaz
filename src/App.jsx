import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { supabase } from './supabase';
import { 
  Lock, UserPlus, BookOpen, FileText, CheckSquare, Home, RefreshCw, 
  Award, FileQuestion, Download, Share2, BookMarked, UserCircle, Save, Check
} from 'lucide-react';

// --- KOMPONEN KEAMANAN (PIN) ---
function AuthScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '1234') onUnlock(); 
    else { setError(true); setPin(''); }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center border border-slate-700">
        <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          <Lock size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Buku Ustaz</h1>
        <p className="text-slate-400 text-sm mb-8">Masukkan PIN Keamanan</p>
        <form onSubmit={handleLogin}>
          <input 
            type="password" maxLength="4" placeholder="••••" 
            className="w-full text-center text-4xl tracking-[0.5em] p-4 rounded-2xl bg-slate-900/50 border border-slate-600 mb-4 outline-none focus:border-emerald-500 transition-colors" 
            value={pin} onChange={(e) => { setPin(e.target.value); setError(false); }} autoFocus 
          />
          {error && <p className="text-red-400 text-sm mb-4 animate-bounce">PIN Tidak Valid!</p>}
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors py-4 rounded-2xl font-bold text-lg shadow-lg">Buka Kunci</button>
        </form>
      </div>
    </div>
  );
}

// --- FITUR 1: ABSENSI ---
function HalamanAbsensi({ murid }) {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const absensiHariIni = useLiveQuery(() => db.absensi.where('tanggal').equals(tanggal).toArray(), [tanggal]);

  const tandaiAbsen = async (muridId, status) => {
    const dataAda = await db.absensi.where({ murid_id: muridId, tanggal }).first();
    if (dataAda) {
      await db.absensi.update(dataAda.id, { status, is_synced: false });
    } else {
      await db.absensi.add({ murid_id: muridId, tanggal, status, is_synced: false });
    }
  };

  const getStatus = (muridId) => {
    const absen = absensiHariIni?.find(a => a.murid_id === muridId);
    return absen ? absen.status : null;
  };

  return (
    <div className="pb-24 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Absensi</h2>
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg p-2 shadow-sm focus:outline-emerald-500" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y overflow-hidden">
        {murid?.map(m => {
          const statusSaatIni = getStatus(m.id);
          return (
            <div key={m.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
              <div>
                <span className="font-bold text-slate-800 block">{m.nama}</span>
                <span className="text-xs text-slate-500">Kelas: {m.kelas}</span>
              </div>
              <div className="flex gap-1">
                {['H', 'I', 'S', 'A'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => tandaiAbsen(m.id, s)} 
                    className={`w-9 h-9 rounded-xl font-bold transition-all text-sm ${
                      statusSaatIni === s 
                        ? (s === 'H' ? 'bg-emerald-500 text-white shadow-md' : s === 'I' ? 'bg-blue-500 text-white shadow-md' : s === 'S' ? 'bg-amber-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md')
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {(!murid || murid.length === 0) && <div className="p-8 text-center text-slate-400">Belum ada data murid.</div>}
      </div>
    </div>
  );
}

// --- FITUR 2: BUKU SAKU USTAZ ---
function BukuSaku() {
  const [tab, setTab] = useState('batas');
  const [mapel, setMapel] = useState('');
  const [isi, setIsi] = useState('');
  const [notif, setNotif] = useState('');
  const jurnal = useLiveQuery(() => db.jurnal.where('kategori').equals(tab).reverse().sortBy('tanggal'), [tab]);

  const simpanJurnal = async (e) => {
    e.preventDefault();
    if (!isi) return;
    await db.jurnal.add({ kategori: tab, mapel, isi, tanggal: new Date().toISOString(), is_synced: false });
    setMapel(''); setIsi('');
    setNotif('Tersimpan!');
    setTimeout(() => setNotif(''), 2000);
  };

  const tabs = [
    { id: 'batas', label: 'Batas Pelajaran' },
    { id: 'perilaku', label: 'Catatan Perilaku' },
    { id: 'pr', label: 'Tugas/PR' }
  ];

  return (
    <div className="pb-24 pt-6 px-4 animate-in fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Buku Saku</h2>
      <div className="flex overflow-x-auto pb-2 mb-4 gap-2 no-scrollbar">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={simpanJurnal} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4 flex flex-col gap-3">
        {tab === 'batas' && <input type="text" placeholder="Mata Pelajaran" value={mapel} onChange={e => setMapel(e.target.value)} className="p-3 bg-slate-50 border rounded-xl outline-emerald-500" required />}
        <textarea placeholder={`Tulis catatan ${tab} di sini...`} value={isi} onChange={e => setIsi(e.target.value)} className="p-3 bg-slate-50 border rounded-xl h-24 outline-emerald-500" required></textarea>
        <button type="submit" className="bg-emerald-600 text-white font-bold p-3 rounded-xl flex justify-center items-center gap-2">
          {notif ? <><Check size={18} /> {notif}</> : <><Save size={18} /> Simpan Catatan</>}
        </button>
      </form>

      <div className="grid gap-3">
        <h3 className="text-sm font-bold text-slate-500 ml-2">Riwayat</h3>
        {jurnal?.map(j => (
          <div key={j.id} className="bg-white p-4 rounded-xl border border-slate-100 text-sm">
            <div className="flex justify-between items-start mb-2 border-b pb-2">
              <span className="font-bold text-emerald-700">{j.mapel || 'Umum'}</span>
              <span className="text-xs text-slate-400">{new Date(j.tanggal).toLocaleDateString('id-ID')}</span>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap">{j.isi}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- FITUR 3: LABSOMA (SOAL) ---
function Labsoma() {
  const [tab, setTab] = useState('buat');
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [notif, setNotif] = useState(false);
  const bankSoal = useLiveQuery(() => db.soal.reverse().sortBy('tanggal'), []);

  const simpanSoal = async (e) => {
    e.preventDefault();
    if(!judul || !isi) return;
    await db.soal.add({ judul, isi, tipe: 'essay', tanggal: new Date().toISOString() });
    setJudul(''); setIsi('');
    setNotif(true); setTimeout(() => setNotif(false), 2000);
  };
  
  return (
    <div className="pb-24 pt-6 px-4 animate-in fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Labsoma</h2>
      <div className="flex gap-2 mb-6 bg-slate-200/50 p-1 rounded-xl">
        <button onClick={() => setTab('buat')} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${tab === 'buat' ? 'bg-white text-emerald-600 shadow' : 'text-slate-500'}`}>Buat Soal</button>
        <button onClick={() => setTab('bank')} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${tab === 'bank' ? 'bg-white text-emerald-600 shadow' : 'text-slate-500'}`}>Bank Soal ({bankSoal?.length || 0})</button>
      </div>

      {tab === 'buat' ? (
        <form onSubmit={simpanSoal} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <input type="text" placeholder="Judul Ujian / Kuis" value={judul} onChange={e=>setJudul(e.target.value)} className="p-3 bg-slate-50 border rounded-xl outline-emerald-500" required/>
          <textarea placeholder="Ketik soal di sini..." value={isi} onChange={e=>setIsi(e.target.value)} className="p-3 bg-slate-50 border rounded-xl h-40 outline-emerald-500" required></textarea>
          <button type="submit" className="bg-slate-800 text-white font-bold p-3 rounded-xl transition-all">
             {notif ? 'Tersimpan ke Bank Soal!' : 'Tambahkan ke Bank Soal'}
          </button>
        </form>
      ) : (
        <div className="grid gap-3">
          {bankSoal?.map(s => (
            <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-700">{s.judul}</h4>
                <FileQuestion className="text-emerald-500" size={18} />
              </div>
              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded line-clamp-2">{s.isi}</p>
            </div>
          ))}
          {(!bankSoal || bankSoal.length === 0) && <p className="text-center text-slate-400 mt-10">Bank soal kosong.</p>}
        </div>
      )}
    </div>
  );
}

// --- FITUR 4: NILAI & EXPORT ---
function HalamanNilai({ murid }) {
  const nilai = useLiveQuery(() => db.nilai.toArray(), []);

  const updateNilai = async (muridId, jenis, value) => {
    const valNum = parseInt(value) || 0;
    const dataAda = await db.nilai.where({ murid_id: muridId }).first();
    if (dataAda) {
      await db.nilai.update(dataAda.id, { [jenis]: valNum, is_synced: false });
    } else {
      await db.nilai.add({ murid_id: muridId, ulangan: 0, tulis: 0, lisan: 0, [jenis]: valNum, is_synced: false });
    }
  };

  const getNilai = (muridId, jenis) => {
    const data = nilai?.find(n => n.murid_id === muridId);
    return data ? data[jenis] : '';
  };

  const exportWA = () => {
    let text = "*LAPORAN NILAI SANTRI*\n\n";
    murid?.forEach(m => {
      const n = nilai?.find(x => x.murid_id === m.id) || { ulangan:0, tulis:0, lisan:0 };
      text += `👤 *${m.nama}* (${m.kelas})\n- Ulangan: ${n.ulangan}\n- Tulis: ${n.tulis}\n- Lisan: ${n.lisan}\n\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="pb-24 pt-6 px-4 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Rekap Nilai</h2>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-red-50 text-red-600 p-2 rounded-lg shadow-sm" title="Print/PDF"><Download size={20}/></button>
          <button onClick={exportWA} className="bg-green-50 text-green-600 p-2 rounded-lg shadow-sm" title="Kirim WA"><Share2 size={20}/></button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="p-4 font-semibold">Nama Murid</th>
                <th className="p-4 font-semibold text-center">Ulangan</th>
                <th className="p-4 font-semibold text-center">Tulis</th>
                <th className="p-4 font-semibold text-center">Lisan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {murid?.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{m.nama}</td>
                  <td className="p-2"><input type="number" defaultValue={getNilai(m.id, 'ulangan')} onBlur={(e) => updateNilai(m.id, 'ulangan', e.target.value)} className="w-16 p-2 bg-slate-100 rounded text-center focus:bg-white focus:ring-1 outline-emerald-500" placeholder="-" /></td>
                  <td className="p-2"><input type="number" defaultValue={getNilai(m.id, 'tulis')} onBlur={(e) => updateNilai(m.id, 'tulis', e.target.value)} className="w-16 p-2 bg-slate-100 rounded text-center focus:bg-white focus:ring-1 outline-emerald-500" placeholder="-" /></td>
                  <td className="p-2"><input type="number" defaultValue={getNilai(m.id, 'lisan')} onBlur={(e) => updateNilai(m.id, 'lisan', e.target.value)} className="w-16 p-2 bg-slate-100 rounded text-center focus:bg-white focus:ring-1 outline-emerald-500" placeholder="-" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4 text-center">*Nilai otomatis tersimpan setelah mengetik angka</p>
    </div>
  );
}

// --- FITUR 5: PROFIL MURID ---
function ProfilMurid({ murid }) {
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

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
    } catch (e) { 
      console.error(e); 
    }
    setIsSyncing(false);
  };

  return (
    <div className="pb-24 pt-6 px-4 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Data Murid</h2>
        <button onClick={sinkronData} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-transform">
          <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> Sinkron
        </button>
      </div>
      
      <form onSubmit={simpanMurid} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Nama Lengkap" className="col-span-2 p-3 bg-slate-50 border rounded-xl outline-emerald-500" value={nama} onChange={e => setNama(e.target.value)} required />
          <input type="text" placeholder="Kelas" className="col-span-2 p-3 bg-slate-50 border rounded-xl outline-emerald-500" value={kelas} onChange={e => setKelas(e.target.value)} required />
        </div>
        <button type="submit" className="bg-slate-800 text-white font-bold p-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <UserPlus size={20} /> Tambah Murid
        </button>
      </form>

      <div className="grid gap-3">
        <span className="text-sm font-bold text-slate-500">Daftar Santri ({murid?.length || 0})</span>
        {murid?.map(m => (
          <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl">
              {m.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-slate-800 block text-lg">{m.nama}</span>
              <span className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">{m.kelas}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- KOMPONEN UTAMA (APP) ---
export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const murid = useLiveQuery(() => db.murid.toArray(), []);

  if (isLocked) return <AuthScreen onUnlock={() => setIsLocked(false)} />;

  const menuUtama = [
    { id: 'absen', label: 'Absensi', icon: CheckSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'bukusaku', label: 'Buku Saku', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'labsoma', label: 'Labsoma', icon: BookMarked, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'nilai', label: 'Nilai', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'profil', label: 'Profil Murid', icon: UserCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return (
        <div className="p-6 animate-in fade-in">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-8 text-white mb-8 shadow-lg shadow-emerald-600/30">
            <h2 className="text-3xl font-extrabold mb-1">Ahlan wa Sahlan</h2>
            <p className="text-emerald-100 font-medium">Buku Administrasi Ustaz</p>
          </div>
          
          <h3 className="font-bold text-slate-800 mb-4 text-lg">Modul Aplikasi</h3>
          <div className="grid grid-cols-2 gap-4">
            {menuUtama.map(menu => (
              <button 
                key={menu.id} onClick={() => setActiveTab(menu.id)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <div className={`p-4 rounded-full ${menu.bg} ${menu.color}`}>
                  <menu.icon size={28} />
                </div>
                <span className="font-semibold text-slate-700 text-sm">{menu.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
      case 'absen': return <HalamanAbsensi murid={murid} />;
      case 'bukusaku': return <BukuSaku />;
      case 'labsoma': return <Labsoma />;
      case 'nilai': return <HalamanNilai murid={murid} />;
      case 'profil': return <ProfilMurid murid={murid} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-[#f8fafc] min-h-screen relative shadow-2xl overflow-hidden">
      <header className="bg-white/90 backdrop-blur-md px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <h1 className="font-extrabold text-xl text-slate-800 tracking-tight flex items-center gap-2">
          <BookOpen className="text-emerald-600" size={24}/> Buku Ustaz
        </h1>
        <button onClick={() => setIsLocked(true)} className="p-2 bg-slate-100 rounded-full text-slate-600 active:scale-90 transition-transform">
          <Lock size={18} />
        </button>
      </header>
      
      <main className="min-h-screen">{renderContent()}</main>
      
      <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full max-w-md flex justify-around px-2 py-3 pb-safe z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[ 
          {id:'dashboard', icon:Home, label:'Home'}, 
          {id:'absen', icon:CheckSquare, label:'Absen'}, 
          {id:'nilai', icon:Award, label:'Nilai'}, 
          {id:'profil', icon:UserCircle, label:'Murid'} 
        ].map(item => (
          <button 
            key={item.id} onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === item.id ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
