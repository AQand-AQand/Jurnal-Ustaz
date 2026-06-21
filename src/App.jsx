import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gjfdxqhwwytcgylokksq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1SSrr1ebYfBvZ7V60egzfg__Q_wz_Pm";
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

  const [muridList, setMuridList] = useState([]);
  const [listAbsensi, setListAbsensi] = useState([]);
  const [listBatas, setListBatas] = useState([]);
  const [listPerilaku, setListPerilaku] = useState([]);
  const [listNilai, setListNilai] = useState([]);
  const [listBankSoal, setListBankSoal] = useState([]);
  
  const [viewProfilStage, setViewProfilStage] = useState('kelas');
  const [selectedKelasProfil, setSelectedKelasProfil] = useState(null);
  const [selectedMuridProfil, setSelectedMuridProfil] = useState(null);
  
  const [formMurid, setFormMurid] = useState({ nama: '', kelas: '', alamat: '', domisili: '' });
  const [formBatas, setFormBatas] = useState({ fan: '', batas: '' });
  const [formPerilaku, setFormPerilaku] = useState({ murid_id: '', catatan: '' });
  const [formSoal, setFormSoal] = useState({ pelajaran: '', kelas: '', batasan: '', isi: '' });
  
  const [filterKelasAbsen, setFilterKelasAbsen] = useState('Semua');
  const [kelasSikap, setKelasSikap] = useState('Semua'); // State baru untuk filter kelas di tab Sikap

  // State Baru untuk Alur Nilai Individu
  const [nilaiKelas, setNilaiKelas] = useState('');
  const [selectedMuridNilai, setSelectedMuridNilai] = useState(null);
  const [formNilai, setFormNilai] = useState({ pelajaran: '', jenis: 'Ulangan', skor: '' });

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

      if (errM) console.error("Error tarik Murid (Cek RLS Supabase):", errM); else if (m) setMuridList(m);
      if (errA) console.error("Error tarik Absen:", errA); else if (a) setListAbsensi(a);
      if (errB) console.error("Error tarik Batas:", errB); else if (b) setListBatas(b);
      if (errP) console.error("Error tarik Perilaku:", errP); else if (p) setListPerilaku(p);
      if (errN) console.error("Error tarik Nilai:", errN); else if (n) setListNilai(n);
      if (errBs) console.error("Error tarik Soal:", errBs); else if (bs) setListBankSoal(bs);
    } catch (err) {
      console.log("Gagal sinkron:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = () => {
    if (isOffline || !SUPABASE_ANON_KEY) {
      alert("Aplikasi offline! Data hanya disimpan di HP sementara waktu.");
      return false;
    }
    return true;
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

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
      if (error) alert("Gagal simpan online. Pastikan RLS Supabase dimatikan. Error: " + error.message);
      else syncSemuaDataKeCloud();
    }
  };

  const handleSimpanAbsen = async (muridId, status) => {
    const tanggalHariIni = new Date().toISOString().split('T')[0];
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const absenBaru = { id: safeLocalId, murid_id: muridId, status, tanggal: tanggalHariIni, ustadz_email: user?.email };
    
    setListAbsensi(prev => [absenBaru, ...prev.filter(a => !(a.murid_id === muridId && a.tanggal === tanggalHariIni))]);
    if (checkConnection()) {
      setLoading(true);
      const { error } = await supabase.from('absensi').insert([{ murid_id: muridId, status, tanggal: tanggalHariIni, ustadz_email: user?.email }]);
      setLoading(false);
      if (error) alert("Gagal simpan online. Error: " + error.message);
      else syncSemuaDataKeCloud();
    }
  };

  const handleSimpanBatasAjar = async (e) => {
    e.preventDefault();
    if (!formBatas.fan || !formBatas.batas) return alert("Isi lengkap Fan & Batas Mengajar!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newBatas = { id: safeLocalId, fan: formBatas.fan, batas_akhir: formBatas.batas, created_at: new Date().toISOString(), ustadz_email: user?.email };
    
    setListBatas([newBatas, ...listBatas]);
    setFormBatas({ fan: '', batas: '' });
    
    if (checkConnection()) {
      setLoading(true);
      const { error } = await supabase.from('batas_mengajar').insert([{ fan: newBatas.fan, batas_akhir: newBatas.batas_akhir, ustadz_email: user?.email }]);
      setLoading(false);
      if (error) alert("Gagal simpan online. Error: " + error.message);
      else syncSemuaDataKeCloud();
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
      setLoading(true);
      const { error } = await supabase.from('catatan_perilaku').insert([{ murid_id: newPrilaku.murid_id, catatan: newPrilaku.catatan, ustadz_email: user?.email }]);
      setLoading(false);
      if (error) alert("Gagal simpan online. Error: " + error.message);
      else syncSemuaDataKeCloud();
    }
  };

  const handleSimpanNilaiIndividu = async (e) => {
    e.preventDefault();
    if (!formNilai.pelajaran || !formNilai.skor) return alert("Lengkapi Pelajaran dan Skor!");
    
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newNilai = { 
      id: safeLocalId, 
      murid_id: selectedMuridNilai.id, 
      jenis_ujian: formNilai.jenis, 
      pelajaran: formNilai.pelajaran, 
      skor: parseInt(formNilai.skor),
      created_at: new Date().toISOString() 
    };

    setListNilai([newNilai, ...listNilai]);
    setFormNilai({ ...formNilai, skor: '' });
    alert("Nilai berhasil ditambahkan!");

    if (checkConnection()) {
      setLoading(true);
      const { error } = await supabase.from('nilai').insert([{ 
        murid_id: newNilai.murid_id, 
        jenis_ujian: newNilai.jenis_ujian, 
        pelajaran: newNilai.pelajaran, 
        skor: newNilai.skor, 
        ustadz_email: user?.email 
      }]);
      setLoading(false);
      if (error) alert("Gagal simpan online. Error: " + error.message);
      else syncSemuaDataKeCloud();
    }
  };

  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    if (!formSoal.pelajaran || !formSoal.kelas || !formSoal.isi) return alert("Lengkapi formulir pembuatan soal!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newSoal = { id: safeLocalId, pelajaran: formSoal.pelajaran, kelas: formSoal.kelas, batasan: formSoal.batasan, isi_soal: formSoal.isi };
    
    setListBankSoal([newSoal, ...listBankSoal]);
    setFormSoal({ pelajaran: '', kelas: '', batasan: '', isi: '' });

    if (checkConnection()) {
      setLoading(true);
      const { error } = await supabase.from('bank_soal').insert([{ pelajaran: newSoal.pelajaran, kelas: newSoal.kelas, batasan: newSoal.batasan, isi_soal: newSoal.isi_soal, ustadz_email: user?.email }]);
      setLoading(false);
      if (error) alert("Gagal simpan online. Error: " + error.message);
      else syncSemuaDataKeCloud();
    }
  };

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
            <i className="fa-solid fa-graduation-cap text-5xl text-emerald-600 mb-3 block"></i>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Buku Ustaz</h1>
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
              {loading ? 'Memproses Data...' : (authMode === 'login' ? 'Masuk ke Aplikasi' : 'Daftar Akun Baru')}
            </button>
          </form>
          <div className="mt-5 text-center">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-sm text-emerald-600 font-bold hover:underline">
              {authMode === 'login' ? 'Belum punya akun? Daftar disini' : 'Sudah punya akun? Masuk disini'}
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200 overflow-hidden pb-36 relative">
      <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-graduation-cap text-lg"></i>
          <h1 className="text-xl font-bold tracking-tight">Buku Ustaz <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full ml-1 font-mono align-top">v4.1</span></h1>
        </div>
        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button onClick={handleInstallPWA} className="text-[10px] bg-white text-emerald-700 px-2 py-1 rounded font-bold uppercase tracking-wider shadow-sm hover:bg-slate-50">
              <i className="fa-solid fa-download mr-1"></i> Install
            </button>
          )}
          {isOffline && <span className="text-[10px] bg-red-500 px-2 py-1 rounded font-bold uppercase tracking-wider animate-pulse">Offline</span>}
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          
          <button onClick={() => { setActiveTab('profil'); setViewProfilStage('kelas'); setSelectedMuridProfil(null); }} className="text-white hover:bg-emerald-500 bg-emerald-700 w-8 h-8 rounded-full flex items-center justify-center transition" title="Profil & Rekap Murid">
            <i className="fa-solid fa-user text-sm"></i>
          </button>
          <button onClick={() => syncSemuaDataKeCloud()} className="text-white hover:bg-emerald-500 bg-emerald-700 w-8 h-8 rounded-full flex items-center justify-center transition" title="Sinkron Cloud">
            <i className="fa-solid fa-cloud-arrow-up text-sm"></i>
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
                <i className="fa-solid fa-database"></i> Input Data Base Murid
              </h3>
              <div className="space-y-2">
                <input type="text" placeholder="Nama Lengkap Murid" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formMurid.nama} onChange={e => setFormMurid({...formMurid, nama: e.target.value})} />
                <input type="text" placeholder="Kelas Madrasah (Ketik Bebas)" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formMurid.kelas} onChange={e => setFormMurid({...formMurid, kelas: e.target.value})} />
                <input type="text" placeholder="Alamat Rumah" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formMurid.alamat} onChange={e => setFormMurid({...formMurid, alamat: e.target.value})} />
                <input type="text" placeholder="Domisili Pondok / Kamar" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formMurid.domisili} onChange={e => setFormMurid({...formMurid, domisili: e.target.value})} />
              </div>
              <button onClick={handleSimpanMurid} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow mt-2 hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <i className="fa-solid fa-floppy-disk"></i> Simpan Murid
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Total Terdaftar ({muridList.length} Murid)</p>
              {muridList.map(m => (
                <div key={m.id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{m.nama}</h4>
                    <p className="text-[10px] text-slate-400 font-medium"><i className="fa-solid fa-house text-slate-300"></i> {m.domisili || 'Belum diisi'}</p>
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
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><i className="fa-solid fa-filter text-emerald-600"></i> Filter Kelas:</label>
              <select className="border border-slate-300 p-1.5 rounded-lg text-xs font-bold bg-slate-50 outline-none text-emerald-700" value={filterKelasAbsen} onChange={e => setFilterKelasAbsen(e.target.value)}>
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
                      <button onClick={() => handleSimpanAbsen(m.id, 'Hadir')} className={`w-8 h-8 rounded-lg font-bold text-xs transition shadow-sm ${absenHariIni?.status === 'Hadir' ? 'bg-emerald-600 text-white scale-105' : 'bg-slate-100 text-slate-500'}`}>H</button>
                      <button onClick={() => handleSimpanAbsen(m.id, 'Izin')} className={`w-8 h-8 rounded-lg font-bold text-xs transition shadow-sm ${absenHariIni?.status === 'Izin' ? 'bg-amber-500 text-white scale-105' : 'bg-slate-100 text-slate-500'}`}>I</button>
                      <button onClick={() => handleSimpanAbsen(m.id, 'Alfa')} className={`w-8 h-8 rounded-lg font-bold text-xs transition shadow-sm ${absenHariIni?.status === 'Alfa' ? 'bg-red-500 text-white scale-105' : 'bg-slate-100 text-slate-500'}`}>A</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BATAS MENGAJAR */}
        {activeTab === 'batas' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2"><i className="fa-solid fa-book-open"></i> Catat Batas Mengajar</h3>
              <input type="text" placeholder="Nama Fan Pelajaran / Kitab" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formBatas.fan} onChange={e => setFormBatas({...formBatas, fan: e.target.value})} />
              <input type="text" placeholder="Batas Akhir (Bab/Hal/Ayat)" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formBatas.batas} onChange={e => setFormBatas({...formBatas, batas: e.target.value})} />
              <button onClick={handleSimpanBatasAjar} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow flex items-center justify-center gap-2"><i className="fa-solid fa-floppy-disk"></i> Simpan Batas</button>
            </div>
          </div>
        )}

        {/* TAB 4: PERILAKU / SIKAP */}
        {activeTab === 'perilaku' && (
          <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
             <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2"><i className="fa-solid fa-star-half-stroke"></i> Catatan Perilaku</h3>
              
              <select className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={kelasSikap} onChange={e => { setKelasSikap(e.target.value); setFormPerilaku({...formPerilaku, murid_id: ''}); }}>
                <option value="Semua">-- Filter Semua Kelas --</option>
                {listKelasUnik.map(k => <option key={k} value={k}>{k}</option>)}
              </select>

              <select className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500 disabled:opacity-50" value={formPerilaku.murid_id} onChange={e => setFormPerilaku({...formPerilaku, murid_id: e.target.value})} disabled={kelasSikap !== 'Semua' && muridList.filter(m => m.kelas === kelasSikap).length === 0}>
                <option value="">-- Pilih Nama Murid --</option>
                {muridList.filter(m => kelasSikap === 'Semua' || m.kelas === kelasSikap).map(m => <option key={m.id} value={m.id}>{m.nama} ({m.kelas})</option>)}
              </select>
              
              <textarea placeholder="Tulis catatan di sini..." className="w-full border rounded-xl p-3 text-sm h-28 focus:ring-2 ring-emerald-500 outline-none resize-none" value={formPerilaku.catatan} onChange={e => setFormPerilaku({...formPerilaku, catatan: e.target.value})}></textarea>
              <button onClick={handleSimpanPerilaku} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow"><i className="fa-solid fa-floppy-disk"></i> Simpan Sikap</button>
          </div>
        )}

        {/* TAB 5: NILAI */}
        {activeTab === 'nilai' && (
          <div className="space-y-4">
            
            {/* TAHAP 1: Pilih Kelas */}
            {!nilaiKelas && (
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2">
                  <i className="fa-solid fa-file-signature"></i> Pilih Kelas
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {listKelasUnik.map(k => (
                    <button key={k} onClick={() => setNilaiKelas(k)} className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm hover:bg-emerald-100 transition font-bold text-emerald-700">
                      Kelas {k}
                    </button>
                  ))}
                  {listKelasUnik.length === 0 && <p className="text-xs text-slate-400 col-span-2 text-center py-4">Belum ada murid terdaftar.</p>}
                </div>
              </div>
            )}

            {/* TAHAP 2: Pilih Santri */}
            {nilaiKelas && !selectedMuridNilai && (
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Daftar Santri Kelas {nilaiKelas}</h3>
                  <button onClick={() => setNilaiKelas('')} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">Ganti Kelas</button>
                </div>
                <div className="space-y-2">
                  {muridList.filter(m => m.kelas === nilaiKelas).map(m => (
                    <button key={m.id} onClick={() => setSelectedMuridNilai(m)} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-left flex justify-between items-center hover:border-emerald-400 transition">
                      <span className="font-bold text-slate-700 text-sm">{m.nama}</span>
                      <i className="fa-solid fa-chevron-right text-slate-300"></i>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAHAP 3: Input Nilai Individu */}
            {nilaiKelas && selectedMuridNilai && (
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Input Nilai <span className="text-emerald-600">{selectedMuridNilai.nama}</span></h3>
                  <button onClick={() => setSelectedMuridNilai(null)} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">Kembali</button>
                </div>
                
                <div className="space-y-3">
                  <input type="text" placeholder="Mata Pelajaran / Fan (Misal: Fiqih)" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formNilai.pelajaran} onChange={e => setFormNilai({...formNilai, pelajaran: e.target.value})} />
                  
                  <div className="grid grid-cols-3 gap-2">
                    {['Ulangan', 'Ujian Tulis', 'Ujian Lisan'].map(j => (
                      <button key={j} onClick={() => setFormNilai({...formNilai, jenis: j})} className={`py-2 text-[10px] font-bold rounded-lg border transition ${formNilai.jenis === j ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{j}</button>
                    ))}
                  </div>

                  <input type="number" placeholder="Skor Angka (0-100)" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none font-bold text-emerald-700" value={formNilai.skor} onChange={e => setFormNilai({...formNilai, skor: e.target.value})} />
                  
                  <button onClick={handleSimpanNilaiIndividu} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow hover:bg-emerald-700 disabled:opacity-50">
                    <i className="fa-solid fa-check-circle mr-1"></i> Simpan Nilai
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SOAL */}
        {activeTab === 'soal' && (
          <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600"><i className="fa-solid fa-folder-open"></i> Bank Soal</h3>
            <input type="text" placeholder="Pelajaran (Fan)" className="w-full border rounded-xl p-3 text-sm" value={formSoal.pelajaran} onChange={e => setFormSoal({...formSoal, pelajaran: e.target.value})} />
            <input type="text" placeholder="Kelas" className="w-full border rounded-xl p-3 text-sm" value={formSoal.kelas} onChange={e => setFormSoal({...formSoal, kelas: e.target.value})} />
            <textarea placeholder="Tulis butir pertanyaan soal..." className="w-full border rounded-xl p-3 text-sm h-28" value={formSoal.isi} onChange={e => setFormSoal({...formSoal, isi: e.target.value})}></textarea>
            <button onClick={handleSimpanSoal} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow">Simpan Soal</button>
          </div>
        )}

        {/* TAB PROFIL & REKAP KESELURUHAN (Akses lewat tombol kanan atas) */}
        {activeTab === 'profil' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
               <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2">
                 <i className="fa-solid fa-users-viewfinder"></i> Rekapitulasi Data Murid
               </h3>
               
               {/* View Profil: Pilih Kelas */}
               {viewProfilStage === 'kelas' && (
                 <div className="grid grid-cols-2 gap-3">
                   {listKelasUnik.map(k => (
                     <button key={k} onClick={() => { setSelectedKelasProfil(k); setViewProfilStage('murid'); }} className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 font-bold text-slate-700 transition">
                       Kelas {k}
                     </button>
                   ))}
                   {listKelasUnik.length === 0 && <p className="text-xs text-slate-400 col-span-2 text-center py-4">Belum ada murid terdaftar.</p>}
                 </div>
               )}

               {/* View Profil: Pilih Murid dari Kelas */}
               {viewProfilStage === 'murid' && (
                 <div className="space-y-3">
                   <button onClick={() => setViewProfilStage('kelas')} className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-bold"><i className="fa-solid fa-arrow-left"></i> Kembali Pilih Kelas</button>
                   {muridList.filter(m => m.kelas === selectedKelasProfil).map(m => (
                     <button key={m.id} onClick={() => { setSelectedMuridProfil(m); setViewProfilStage('detail'); }} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center hover:border-emerald-500 text-left transition">
                       <span className="font-bold text-sm text-slate-700">{m.nama}</span>
                       <i className="fa-solid fa-chevron-right text-slate-400"></i>
                     </button>
                   ))}
                 </div>
               )}

               {/* View Profil: Detail Lengkap Murid */}
               {viewProfilStage === 'detail' && selectedMuridProfil && (
                 <div className="space-y-4">
                   <button onClick={() => setViewProfilStage('murid')} className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-bold"><i className="fa-solid fa-arrow-left"></i> Kembali ke Daftar</button>
                   
                   <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                     <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-700 text-xl"><i className="fa-solid fa-user"></i></div>
                     <h4 className="font-bold text-emerald-800 text-lg leading-tight">{selectedMuridProfil.nama}</h4>
                     <p className="text-[11px] text-emerald-600 font-bold uppercase mt-1 tracking-wider">Kelas {selectedMuridProfil.kelas} • {selectedMuridProfil.domisili}</p>
                   </div>
                   
                   <div className="space-y-3">
                     <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                       <h5 className="text-[11px] font-bold text-slate-500 mb-2 border-b border-slate-200 pb-1 uppercase tracking-wider">Total Kehadiran:</h5>
                       <div className="text-xs font-bold flex justify-around">
                         <span className="text-emerald-600">Hadir: {listAbsensi.filter(a => a.murid_id === selectedMuridProfil.id && a.status === 'Hadir').length}</span>
                         <span className="text-amber-600">Izin: {listAbsensi.filter(a => a.murid_id === selectedMuridProfil.id && a.status === 'Izin').length}</span>
                         <span className="text-red-600">Alfa: {listAbsensi.filter(a => a.murid_id === selectedMuridProfil.id && a.status === 'Alfa').length}</span>
                       </div>
                     </div>
                     <div className="border border-slate-200 rounded-xl p-3">
                       <h5 className="text-[11px] font-bold text-slate-500 mb-2 border-b border-slate-100 pb-1 uppercase tracking-wider">Catatan Sikap:</h5>
                       <ul className="text-xs space-y-1.5">
                         {listPerilaku.filter(p => p.murid_id === selectedMuridProfil.id).map(p => (
                           <li key={p.id} className="text-slate-700 flex gap-2"><i className="fa-solid fa-quote-left text-emerald-300 mt-0.5"></i> <span>{p.catatan}</span></li>
                         ))}
                         {listPerilaku.filter(p => p.murid_id === selectedMuridProfil.id).length === 0 && <span className="text-slate-400 italic">Belum ada catatan sikap.</span>}
                       </ul>
                     </div>
                     <div className="border border-slate-200 rounded-xl p-3">
                       <h5 className="text-[11px] font-bold text-slate-500 mb-2 border-b border-slate-100 pb-1 uppercase tracking-wider">Daftar Nilai:</h5>
                       <ul className="text-xs space-y-2">
                         {listNilai.filter(n => n.murid_id === selectedMuridProfil.id).map(n => (
                           <li key={n.id} className="text-slate-700 flex justify-between items-center border-b border-slate-50 pb-1.5">
                             <span>{n.pelajaran} <span className="bg-slate-100 px-1 py-0.5 rounded text-[9px] text-slate-500 uppercase ml-1">{n.jenis_ujian}</span></span>
                             <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{n.skor}</span>
                           </li>
                         ))}
                         {listNilai.filter(n => n.murid_id === selectedMuridProfil.id).length === 0 && <span className="text-slate-400 italic">Belum ada input nilai.</span>}
                       </ul>
                     </div>
                   </div>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 grid grid-cols-6 px-1 py-1.5 z-50">
        {[
          { id: 'database', icon: 'fa-users-line', label: 'Murid' },
          { id: 'absen', icon: 'fa-clipboard-user', label: 'Absen' },
          { id: 'batas', icon: 'fa-book-bookmark', label: 'Batas' },
          { id: 'perilaku', icon: 'fa-star-half-stroke', label: 'Sikap' },
          { id: 'nilai', icon: 'fa-file-signature', label: 'Nilai' },
          { id: 'soal', icon: 'fa-folder-open', label: 'Soal' }
        ].map(menu => {
          const isAct = activeTab === menu.id;
          return (
            <button key={menu.id} onClick={() => { setActiveTab(menu.id); setNilaiKelas(''); setSelectedMuridNilai(null); }} className="flex flex-col items-center justify-center outline-none py-1 rounded-lg">
              <i className={`fa-solid ${menu.icon} text-[18px] mb-1 ${isAct ? 'text-emerald-600' : 'text-slate-400'}`}></i>
              <span className={`text-[8px] font-extrabold ${isAct ? 'text-emerald-700' : 'text-slate-500'}`}>{menu.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
