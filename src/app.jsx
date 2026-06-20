import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
const SUPABASE_URL = "https://gjfdxqhwwytcgylokksq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); 

  const [activeTab, setActiveTab] = useState('database');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // State PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Data Database
  const [muridList, setMuridList] = useState([]);
  const [listAbsensi, setListAbsensi] = useState([]);
  const [listBatas, setListBatas] = useState([]);
  const [listPerilaku, setListPerilaku] = useState([]);
  const [listNilai, setListNilai] = useState([]);
  const [listBankSoal, setListBankSoal] = useState([]);

  // State Form
  const [viewProfilStage, setViewProfilStage] = useState('kelas');
  const [selectedKelasProfil, setSelectedKelasProfil] = useState(null);
  const [selectedMuridProfil, setSelectedMuridProfil] = useState(null);

  const [formMurid, setFormMurid] = useState({ nama: '', kelas: '', alamat: '', domisili: '' });
  const [formBatas, setFormBatas] = useState({ fan: '', batas: '' });
  const [formPerilaku, setFormPerilaku] = useState({ murid_id: '', catatan: '' });
  const [formSoal, setFormSoal] = useState({ pelajaran: '', kelas: '', batasan: '', isi: '' });

  // Filter & Form Nilai Baru
  const [filterKelasAbsen, setFilterKelasAbsen] = useState('Semua');
  const [formNilai, setFormNilai] = useState({ kelas: '', murid_id: '', pelajaran: '', skor: '' });

  // Sinkronisasi Sesi & Status Online & PWA
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    
    loadDataLokalOffline();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Tangkap event PWA Install
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (user && !isOffline) syncSemuaDataKeCloud();
  }, [user, isOffline]);

  useEffect(() => {
    if (muridList.length > 0) localStorage.setItem('off_murid', JSON.stringify(muridList));
    if (listAbsensi.length > 0) localStorage.setItem('off_absen', JSON.stringify(listAbsensi));
    if (listBatas.length > 0) localStorage.setItem('off_batas', JSON.stringify(listBatas));
    if (listPerilaku.length > 0) localStorage.setItem('off_perilaku', JSON.stringify(listPerilaku));
    if (listNilai.length > 0) localStorage.setItem('off_nilai', JSON.stringify(listNilai));
    if (listBankSoal.length > 0) localStorage.setItem('off_soal', JSON.stringify(listBankSoal));
  }, [muridList, listAbsensi, listBatas, listPerilaku, listNilai, listBankSoal]);

  const loadDataLokalOffline = () => {
    setMuridList(JSON.parse(localStorage.getItem('off_murid')) || []);
    setListAbsensi(JSON.parse(localStorage.getItem('off_absen')) || []);
    setListBatas(JSON.parse(localStorage.getItem('off_batas')) || []);
    setListPerilaku(JSON.parse(localStorage.getItem('off_perilaku')) || []);
    setListNilai(JSON.parse(localStorage.getItem('off_nilai')) || []);
    setListBankSoal(JSON.parse(localStorage.getItem('off_soal')) || []);
  };

  const syncSemuaDataKeCloud = async () => {
    if (!navigator.onLine || !SUPABASE_ANON_KEY) return;
    setLoading(true);
    try {
      const { data: m, error: errM } = await supabase.from('murid').select('*').order('nama', { ascending: true });
      const { data: a, error: errA } = await supabase.from('absensi').select('*').order('tanggal', { ascending: false });
      const { data: b, error: errB } = await supabase.from('batas_mengajar').select('*').order('created_at', { ascending: false });
      const { data: p, error: errP } = await supabase.from('catatan_perilaku').select('*').order('created_at', { ascending: false });
      const { data: n, error: errN } = await supabase.from('nilai').select('*').order('created_at', { ascending: false });
      const { data: bs, error: errBs } = await supabase.from('bank_soal').select('*').order('created_at', { ascending: false });

      if (!errM && m) setMuridList(m);
      if (!errA && a) setListAbsensi(a);
      if (!errB && b) setListBatas(b);
      if (!errP && p) setListPerilaku(p);
      if (!errN && n) setListNilai(n);
      if (!errBs && bs) setListBankSoal(bs);
    } catch (err) {
      console.log("Gagal sinkron:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = () => {
    if (isOffline || !SUPABASE_ANON_KEY) {
      alert("Aplikasi sedang offline. Data disimpan sementara di HP.");
      return false;
    }
    return true;
  };

  // --- Fungsi Eksekusi PWA Install ---
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    }
  };

  // --- FUNGSI SIMPAN DATA ---
  const handleSimpanMurid = async (e) => {
    e.preventDefault();
    if (!formMurid.nama || !formMurid.kelas) return alert("Nama dan Kelas wajib diisi!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newMurid = { ...formMurid, id: safeLocalId, ustadz_email: user?.email };
    setMuridList([...muridList, newMurid]);
    setFormMurid({ nama: '', kelas: '', alamat: '', domisili: '' });
    if (checkConnection()) {
      setLoading(true);
      const { error } = await supabase.from('murid').insert([{ ...newMurid }]);
      setLoading(false);
      if (error) alert("Gagal simpan: " + error.message); else syncSemuaDataKeCloud();
    }
  };

  const handleSimpanAbsen = async (muridId, status) => {
    const tanggalHariIni = new Date().toISOString().split('T')[0];
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const absenBaru = { id: safeLocalId, murid_id: muridId, status, tanggal: tanggalHariIni, ustadz_email: user?.email };
    setListAbsensi(prev => [absenBaru, ...prev.filter(a => !(a.murid_id === muridId && a.tanggal === tanggalHariIni))]);
    if (checkConnection()) {
      const { error } = await supabase.from('absensi').insert([{ murid_id: muridId, status, tanggal: tanggalHariIni, ustadz_email: user?.email }]);
      if (error) alert("Gagal absen online: " + error.message); else syncSemuaDataKeCloud();
    }
  };

  const handleSimpanBatasAjar = async (e) => {
    e.preventDefault();
    if (!formBatas.fan || !formBatas.batas) return alert("Isi lengkap Fan & Batas!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newBatas = { id: safeLocalId, fan: formBatas.fan, batas_akhir: formBatas.batas, created_at: new Date().toISOString(), ustadz_email: user?.email };
    setListBatas([newBatas, ...listBatas]);
    setFormBatas({ fan: '', batas: '' });
    if (checkConnection()) {
      const { error } = await supabase.from('batas_mengajar').insert([{ fan: newBatas.fan, batas_akhir: newBatas.batas_akhir, ustadz_email: user?.email }]);
      if (error) alert("Gagal simpan: " + error.message); else syncSemuaDataKeCloud();
    }
  };

  const handleSimpanPerilaku = async (e) => {
    e.preventDefault();
    if (!formPerilaku.murid_id || !formPerilaku.catatan) return alert("Pilih murid dan tulis catatannya!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newPrilaku = { id: safeLocalId, murid_id: parseInt(formPerilaku.murid_id), catatan: formPerilaku.catatan, created_at: new Date().toISOString() };
    setListPerilaku([newPrilaku, ...listPerilaku]);
    setFormPerilaku({ murid_id: '', catatan: '' });
    if (checkConnection()) {
      const { error } = await supabase.from('catatan_perilaku').insert([{ murid_id: newPrilaku.murid_id, catatan: newPrilaku.catatan, ustadz_email: user?.email }]);
      if (error) alert("Gagal simpan: " + error.message); else syncSemuaDataKeCloud();
    }
  };

  // FUNGSI BARU: SIMPAN NILAI (SATUAN SESUAI REQUEST)
  const handleSimpanNilai = async (e) => {
    e.preventDefault();
    if (!formNilai.murid_id || !formNilai.pelajaran || !formNilai.skor) {
      return alert("Mohon lengkapi Nama, Pelajaran, dan Skor Nilai!");
    }

    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newNilai = {
      id: safeLocalId,
      murid_id: parseInt(formNilai.murid_id),
      pelajaran: formNilai.pelajaran,
      jenis_ujian: 'Harian', 
      skor: parseInt(formNilai.skor),
      created_at: new Date().toISOString(),
      ustadz_email: user?.email
    };

    setListNilai([newNilai, ...listNilai]);
    
    // Kosongkan form skor & pelajaran (kelas dan nama tetap terpilih untuk mempermudah jika ingin input lagi)
    setFormNilai({ ...formNilai, skor: '', pelajaran: '' }); 

    if (checkConnection()) {
      setLoading(true);
      const { error } = await supabase.from('nilai').insert([{
        murid_id: newNilai.murid_id,
        pelajaran: newNilai.pelajaran,
        jenis_ujian: newNilai.jenis_ujian,
        skor: newNilai.skor,
        ustadz_email: user?.email
      }]);
      setLoading(false);
      if (error) alert("Gagal simpan online: " + error.message);
      else syncSemuaDataKeCloud();
    }
  };

  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    if (!formSoal.pelajaran || !formSoal.kelas || !formSoal.isi) return alert("Lengkapi form soal!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newSoal = { id: safeLocalId, pelajaran: formSoal.pelajaran, kelas: formSoal.kelas, batasan: formSoal.batasan, isi_soal: formSoal.isi };
    setListBankSoal([newSoal, ...listBankSoal]);
    setFormSoal({ pelajaran: '', kelas: '', batasan: '', isi: '' });
    if (checkConnection()) {
      const { error } = await supabase.from('bank_soal').insert([{ pelajaran: newSoal.pelajaran, kelas: newSoal.kelas, batasan: newSoal.batasan, isi_soal: newSoal.isi_soal, ustadz_email: user?.email }]);
      if (error) alert("Gagal simpan: " + error.message); else syncSemuaDataKeCloud();
    }
  };

  // --- TAMPILAN LOGIN ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) alert("Gagal Login. Error: " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) alert("Gagal Daftar: " + error.message);
      else alert("Akun berhasil dibuat! Silakan masuk.");
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 font-sans max-w-md mx-auto">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full border border-slate-200">
          <div className="text-center mb-6">
            <i className="fa-solid fa-book-open-reader text-5xl text-emerald-600 mb-3 block"></i>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Buku Jurnal Ustaz</h1>
          </div>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-4 top-4 text-slate-400"></i>
              <input type="email" placeholder="Alamat Email" required className="w-full border border-slate-300 rounded-xl py-3 pl-10 pr-3 focus:ring-2 ring-emerald-500 outline-none text-sm" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} />
            </div>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-4 top-4 text-slate-400"></i>
              <input type="password" placeholder="Password Akun" required className="w-full border border-slate-300 rounded-xl py-3 pl-10 pr-3 focus:ring-2 ring-emerald-500 outline-none text-sm" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-200 disabled:opacity-50">
              {loading ? 'Memproses...' : (authMode === 'login' ? 'Masuk Aplikasi' : 'Daftar Akun')}
            </button>
          </form>
          <div className="mt-5 text-center">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-sm text-emerald-600 font-bold hover:underline">
              {authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))];
  const groupBankSoal = listBankSoal.reduce((acc, item) => {
    if (!acc[item.pelajaran]) acc[item.pelajaran] = [];
    acc[item.pelajaran].push(item);
    return acc;
  }, {});

  // --- TAMPILAN UTAMA APLIKASI ---
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200 overflow-hidden pb-36 relative">
      <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-book-open-reader text-xl"></i>
          <h1 className="text-xl font-bold tracking-tight">Jurnal Ustaz</h1>
        </div>
        <div className="flex items-center gap-3">
          {isInstallable && (
             <button onClick={handleInstallClick} className="text-[10px] bg-amber-400 text-amber-900 px-2 py-1.5 rounded-lg font-bold shadow-sm flex items-center gap-1 hover:bg-amber-300">
               <i className="fa-solid fa-download"></i> Instal
             </button>
          )}
          {isOffline && <span className="text-[10px] bg-red-500 px-2 py-1 rounded font-bold uppercase">Offline</span>}
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          <button onClick={() => syncSemuaDataKeCloud()} className="text-white hover:bg-emerald-500 w-8 h-8 rounded-full flex items-center justify-center transition" title="Sinkron Cloud">
            <i className="fa-solid fa-rotate"></i>
          </button>
          <button onClick={() => supabase.auth.signOut()} className="text-emerald-100 hover:text-white" title="Keluar">
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        
        {/* TAB 1: MURID */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2 text-emerald-600">
                <i className="fa-solid fa-database"></i> Input Database Murid
              </h3>
              <div className="space-y-2">
                <input type="text" placeholder="Nama Lengkap Murid" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formMurid.nama} onChange={e => setFormMurid({...formMurid, nama: e.target.value})} />
                <input type="text" placeholder="Kelas Madrasah" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formMurid.kelas} onChange={e => setFormMurid({...formMurid, kelas: e.target.value})} />
                <input type="text" placeholder="Alamat Rumah" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formMurid.alamat} onChange={e => setFormMurid({...formMurid, alamat: e.target.value})} />
                <input type="text" placeholder="Domisili Pondok / Kamar" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formMurid.domisili} onChange={e => setFormMurid({...formMurid, domisili: e.target.value})} />
              </div>
              <button onClick={handleSimpanMurid} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow mt-2 hover:bg-emerald-700 transition">
                Simpan Murid
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Terdaftar ({muridList.length} Murid)</p>
              {muridList.map(m => (
                <div key={m.id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{m.nama}</h4>
                    <p className="text-[10px] text-slate-400"><i className="fa-solid fa-house"></i> {m.domisili || 'Belum diisi'}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-1 border border-emerald-200 rounded-md">{m.kelas}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ABSENSI */}
        {activeTab === 'absen' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border flex items-center justify-between shadow-sm">
              <label className="text-xs font-bold text-slate-500">Filter Kelas:</label>
              <select className="border p-1.5 rounded-lg text-xs font-bold bg-slate-50 text-emerald-700" value={filterKelasAbsen} onChange={e => setFilterKelasAbsen(e.target.value)}>
                <option value="Semua">Semua Kelas</option>
                {listKelasUnik.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              {muridList.filter(m => filterKelasAbsen === 'Semua' || m.kelas === filterKelasAbsen).map(m => {
                const absenHariIni = listAbsensi.find(a => a.murid_id === m.id && a.tanggal === new Date().toISOString().split('T')[0]);
                return (
                  <div key={m.id} className="bg-white p-4 rounded-xl border flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{m.nama}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{m.kelas}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleSimpanAbsen(m.id, 'Hadir')} className={`w-8 h-8 rounded-lg font-bold text-xs ${absenHariIni?.status === 'Hadir' ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' : 'bg-slate-100 text-slate-500'}`}>H</button>
                      <button onClick={() => handleSimpanAbsen(m.id, 'Izin')} className={`w-8 h-8 rounded-lg font-bold text-xs ${absenHariIni?.status === 'Izin' ? 'bg-amber-500 text-white ring-2 ring-amber-300' : 'bg-slate-100 text-slate-500'}`}>I</button>
                      <button onClick={() => handleSimpanAbsen(m.id, 'Alfa')} className={`w-8 h-8 rounded-lg font-bold text-xs ${absenHariIni?.status === 'Alfa' ? 'bg-red-500 text-white ring-2 ring-red-300' : 'bg-slate-100 text-slate-500'}`}>A</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BATAS */}
        {activeTab === 'batas' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600"><i className="fa-solid fa-book-bookmark"></i> Batas Mengajar</h3>
              <input type="text" placeholder="Nama Fan Pelajaran" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formBatas.fan} onChange={e => setFormBatas({...formBatas, fan: e.target.value})} />
              <input type="text" placeholder="Batas Akhir (Bab/Hal)" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formBatas.batas} onChange={e => setFormBatas({...formBatas, batas: e.target.value})} />
              <button onClick={handleSimpanBatasAjar} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Simpan Batas</button>
            </div>
            <div className="space-y-2">
              {listBatas.map(b => (
                <div key={b.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{b.fan}</h4>
                    <p className="text-xs text-emerald-600 font-bold">Batas: {b.batas_akhir}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PERILAKU */}
        {activeTab === 'perilaku' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600"><i className="fa-solid fa-star-half-stroke"></i> Catat Perilaku</h3>
              <select className="w-full border rounded-xl p-3 text-sm" value={formPerilaku.murid_id} onChange={e => setFormPerilaku({...formPerilaku, murid_id: e.target.value})}>
                <option value="">-- Pilih Murid --</option>
                {muridList.map(m => <option key={m.id} value={m.id}>{m.nama} ({m.kelas})</option>)}
              </select>
              <textarea placeholder="Tulis catatan di sini..." className="w-full border rounded-xl p-3 text-sm h-28" value={formPerilaku.catatan} onChange={e => setFormPerilaku({...formPerilaku, catatan: e.target.value})}></textarea>
              <button onClick={handleSimpanPerilaku} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Simpan Catatan</button>
            </div>
          </div>
        )}

        {/* TAB 5: NILAI (GAYA BARU SESUAI REQUEST) */}
        {activeTab === 'nilai' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square"></i> Form Pencatatan Nilai
              </h3>
              
              <div className="space-y-3">
                {/* 1. Pilih Kelas */}
                <select 
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500 font-bold text-slate-700 bg-slate-50" 
                  value={formNilai.kelas} 
                  onChange={e => setFormNilai({...formNilai, kelas: e.target.value, murid_id: ''})}
                >
                  <option value="">-- 1. Pilih Kelas --</option>
                  {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                </select>

                {/* 2. Pilih Nama Murid (Hanya muncul murid di kelas yang dipilih) */}
                <select 
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500 font-bold text-slate-700 bg-slate-50 disabled:opacity-50" 
                  value={formNilai.murid_id} 
                  onChange={e => setFormNilai({...formNilai, murid_id: e.target.value})}
                  disabled={!formNilai.kelas}
                >
                  <option value="">-- 2. Masukkan Nama Murid --</option>
                  {muridList.filter(m => m.kelas === formNilai.kelas).map(m => (
                    <option key={m.id} value={m.id}>{m.nama}</option>
                  ))}
                </select>

                {/* 3. Masukkan Pelajaran */}
                <input 
                  type="text" 
                  placeholder="-- 3. Masukkan Pelajaran --" 
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500 font-bold text-slate-700" 
                  value={formNilai.pelajaran} 
                  onChange={e => setFormNilai({...formNilai, pelajaran: e.target.value})} 
                />

                {/* 4. Masukkan Skor Nilai */}
                <input 
                  type="number" 
                  placeholder="-- 4. Masukkan Skor Nilai (Angka) --" 
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500 font-bold text-slate-700 text-center text-lg" 
                  value={formNilai.skor} 
                  onChange={e => setFormNilai({...formNilai, skor: e.target.value})} 
                />
                
                <button onClick={handleSimpanNilai} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow mt-2 hover:bg-emerald-700 transition">
                  <i className="fa-solid fa-floppy-disk mr-1"></i> Simpan Nilai
                </button>
              </div>
            </div>

            <div className="space-y-2">
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Riwayat Nilai Masuk</p>
               {listNilai.slice(0, 10).map(n => {
                 const muridData = muridList.find(m => m.id === n.murid_id);
                 return (
                   <div key={n.id} className="bg-white p-3 rounded-xl border flex justify-between items-center shadow-sm">
                     <div>
                       <h4 className="font-bold text-slate-800 text-sm">{muridData ? muridData.nama : 'Unknown'}</h4>
                       <p className="text-[10px] text-slate-500 font-medium">Pelajaran: {n.pelajaran}</p>
                     </div>
                     <span className="bg-emerald-50 text-emerald-700 font-black text-sm px-3 py-1.5 border border-emerald-200 rounded-lg">{n.skor}</span>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {/* TAB 6: SOAL */}
        {activeTab === 'soal' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600"><i className="fa-regular fa-folder-open"></i> Lembar Soal</h3>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Pelajaran" className="border rounded-xl p-3 text-sm" value={formSoal.pelajaran} onChange={e => setFormSoal({...formSoal, pelajaran: e.target.value})} />
                <input type="text" placeholder="Kelas" className="border rounded-xl p-3 text-sm" value={formSoal.kelas} onChange={e => setFormSoal({...formSoal, kelas: e.target.value})} />
              </div>
              <textarea placeholder="Tulis butir soal..." className="w-full border rounded-xl p-4 text-sm h-36" value={formSoal.isi} onChange={e => setFormSoal({...formSoal, isi: e.target.value})}></textarea>
              <button onClick={handleSimpanSoal} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Simpan Soal</button>
            </div>
          </div>
        )}

        {/* TAB 7: PROFIL */}
        {activeTab === 'profil' && (
          <div className="space-y-4">
            {viewProfilStage === 'kelas' && (
              <div className="grid grid-cols-2 gap-3">
                {listKelasUnik.map(k => (
                  <button key={k} onClick={() => { setSelectedKelasProfil(k); setViewProfilStage('murid'); }} className="bg-white p-5 rounded-2xl border shadow-sm text-left group">
                    <span className="font-bold text-slate-800 text-sm block">Kelas {k}</span>
                  </button>
                ))}
              </div>
            )}

            {viewProfilStage === 'murid' && (
              <div className="space-y-2">
                <button onClick={() => setViewProfilStage('kelas')} className="text-emerald-600 text-xs font-bold mb-2">Kembali</button>
                {muridList.filter(m => m.kelas === selectedKelasProfil).map(m => (
                  <button key={m.id} onClick={() => { setSelectedMuridProfil(m); setViewProfilStage('detail'); }} className="w-full bg-white p-4 rounded-xl border text-left flex justify-between items-center shadow-sm">
                    <h4 className="font-bold text-slate-800 text-sm">{m.nama}</h4>
                    <i className="fa-solid fa-chevron-right text-slate-300"></i>
                  </button>
                ))}
              </div>
            )}

            {viewProfilStage === 'detail' && selectedMuridProfil && (
              <div className="space-y-4">
                <button onClick={() => setViewProfilStage('murid')} className="text-emerald-600 text-xs font-bold mb-2">Kembali</button>
                <div className="bg-emerald-700 text-white p-5 rounded-3xl shadow-md">
                  <h2 className="text-lg font-bold">{selectedMuridProfil.nama}</h2>
                  <p className="text-xs opacity-90 mt-0.5">Kelas: {selectedMuridProfil.kelas}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">Riwayat Nilai</h4>
                  {listNilai.filter(n => n.murid_id === selectedMuridProfil.id).map(n => (
                    <div key={n.id} className="flex justify-between text-xs py-1.5 border-b">
                      <span className="font-bold">{n.pelajaran}</span>
                      <span className="text-emerald-700 font-black">{n.skor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigasi Bawah */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 grid grid-cols-7 px-1 py-1.5 z-50">
        {[
          { id: 'database', icon: 'fa-users-line', label: 'Murid' },
          { id: 'absen', icon: 'fa-clipboard-user', label: 'Absen' },
          { id: 'batas', icon: 'fa-book-bookmark', label: 'Batas' },
          { id: 'perilaku', icon: 'fa-star-half-stroke', label: 'Sikap' },
          { id: 'nilai', icon: 'fa-pen-to-square', label: 'Nilai' },
          { id: 'soal', icon: 'fa-folder-open', label: 'Soal' },
          { id: 'profil', icon: 'fa-id-card-clip', label: 'Profil' }
        ].map(menu => {
          const isAct = activeTab === menu.id;
          return (
            <button key={menu.id} onClick={() => { setActiveTab(menu.id); if(menu.id === 'profil') setViewProfilStage('kelas'); }} className="flex flex-col items-center justify-center outline-none py-1 rounded-lg">
              <i className={`fa-solid ${menu.icon} text-[18px] mb-1 ${isAct ? 'text-emerald-600' : 'text-slate-400'}`}></i>
              <span className={`text-[8px] font-extrabold ${isAct ? 'text-emerald-700' : 'text-slate-500'}`}>{menu.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}