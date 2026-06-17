import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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

  // State PWA / Instal Aplikasi
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // State Data (Menggunakan Murid)
  const [muridList, setMuridList] = useState([]);
  const [listAbsensi, setListAbsensi] = useState([]);
  const [listBatas, setListBatas] = useState([]);
  const [listPerilaku, setListPerilaku] = useState([]);
  const [listNilai, setListNilai] = useState([]);
  const [listBankSoal, setListBankSoal] = useState([]);

  // State UI Profil
  const [viewProfilStage, setViewProfilStage] = useState('kelas');
  const [selectedKelasProfil, setSelectedKelasProfil] = useState(null);
  const [selectedMuridProfil, setSelectedMuridProfil] = useState(null);

  // State Form
  const [formMurid, setFormMurid] = useState({ nama: '', kelas: '', alamat: '', domisili: '' });
  const [formBatas, setFormBatas] = useState({ fan: '', batas: '' });
  const [formPerilaku, setFormPerilaku] = useState({ murid_id: '', catatan: '' });
  const [formNilai, setFormNilai] = useState({ murid_id: '', jenis_ujian: 'Ulangan', pelajaran: '', skor: '' });
  const [formSoal, setFormSoal] = useState({ pelajaran: '', kelas: '', batasan: '', isi: '' });
  const [filterKelasAbsen, setFilterKelasAbsen] = useState('Semua');

  // 1. SISTEM DETEKSI TOMBOL KEMBALI HP (BACK BUTTON HANDLING)
  useEffect(() => {
    const handlePopState = (event) => {
      if (activeTab === 'profil') {
        if (viewProfilStage === 'detail') {
          window.history.pushState(null, null, window.location.pathname);
          setViewProfilStage('murid');
        } else if (viewProfilStage === 'murid') {
          window.history.pushState(null, null, window.location.pathname);
          setViewProfilStage('kelas');
        } else {
          setActiveTab('database');
        }
      } else if (activeTab !== 'database') {
        window.history.pushState(null, null, window.location.pathname);
        setActiveTab('database');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, null, window.location.pathname);

    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, viewProfilStage]);

  // 2. SISTEM DETEKSI FITUR INSTAL APLIKASI (PWA PROMPT)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallAppClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User menginstal aplikasi Buku Ustaz');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Load awal & Deteksi Online/Offline
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    
    loadDataLokalOffline();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
    setLoading(true);
    try {
      const { data: m } = await supabase.from('murid').select('*').order('nama', { ascending: true });
      const { data: a } = await supabase.from('absensi').select('*').order('tanggal', { ascending: false });
      const { data: b } = await supabase.from('batas_mengajar').select('*').order('created_at', { ascending: false });
      const { data: p } = await supabase.from('catatan_perilaku').select('*').order('created_at', { ascending: false });
      const { data: n } = await supabase.from('nilai').select('*').order('created_at', { ascending: false });
      const { data: bs } = await supabase.from('bank_soal').select('*').order('created_at', { ascending: false });

      if (m) setMuridList(m);
      if (a) setListAbsensi(a);
      if (b) setListBatas(b);
      if (p) setListPerilaku(p);
      if (n) setListNilai(n);
      if (bs) setListBankSoal(bs);
    } catch (err) {
      console.log("Offline mode aktif");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) alert("Gagal Login: Cek kembali email dan password Anda.");
    } else {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) alert("Gagal Daftar: " + error.message);
      else alert("Akun berhasil dibuat! Silakan masuk.");
    }
    setLoading(false);
  };

  const checkConnection = () => {
    if (isOffline) {
      alert("Internet mati! Data tersimpan di HP. Sinkronkan ke awan saat internet kembali menyala.");
      return false;
    }
    return true;
  };

  // --- KUMPULAN FUNGSI SIMPAN (MODERN - TANPA REFRESH) ---
  const handleSimpanMurid = async (e) => {
    e.preventDefault();
    if (!formMurid.nama || !formMurid.kelas) return alert("Nama dan Kelas wajib diisi!");
    if (!checkConnection()) return;

    setLoading(true);
    const { data, error } = await supabase.from('murid').insert([{ 
      nama: formMurid.nama, 
      kelas: formMurid.kelas, 
      alamat: formMurid.alamat, 
      domisili: formMurid.domisili, 
      ustadz_email: user?.email 
    }]).select();

    if (error) {
      alert("Gagal menyimpan murid: " + error.message);
    } else if (data) {
      setMuridList([...muridList, data[0]]);
      setFormMurid({ nama: '', kelas: '', alamat: '', domisili: '' });
    }
    setLoading(false);
  };

  const handleSimpanAbsen = async (muridId, status) => {
    if (!checkConnection()) return;
    const tanggalHariIni = new Date().toISOString().split('T')[0];
    
    setLoading(true);
    const { data, error } = await supabase.from('absensi').insert([{ 
      murid_id: muridId, 
      status: status, 
      tanggal: tanggalHariIni, 
      ustadz_email: user?.email 
    }]).select();

    if (error) {
      alert("Gagal menyimpan absen: " + error.message);
    } else if (data) {
      setListAbsensi(prev => [data[0], ...prev.filter(a => !(a.murid_id === muridId && a.tanggal === tanggalHariIni))]);
    }
    setLoading(false);
  };

  const handleSimpanBatasAjar = async (e) => {
    e.preventDefault();
    if (!formBatas.fan || !formBatas.batas) return alert("Isi lengkap Fan & Batas Mengajar!");
    if (!checkConnection()) return;

    setLoading(true);
    const { data, error } = await supabase.from('batas_mengajar').insert([{ 
      fan: formBatas.fan, 
      batas_akhir: formBatas.batas, 
      ustadz_email: user?.email 
    }]).select();

    if (error) {
      alert("Gagal menyimpan batas ajar: " + error.message);
    } else if (data) {
      setListBatas([data[0], ...listBatas]);
      setFormBatas({ fan: '', batas: '' });
    }
    setLoading(false);
  };

  const handleSimpanPerilaku = async (e) => {
    e.preventDefault();
    if (!formPerilaku.murid_id || !formPerilaku.catatan) return alert("Pilih murid dan tulis catatannya!");
    if (!checkConnection()) return;

    setLoading(true);
    const { data, error } = await supabase.from('catatan_perilaku').insert([{ 
      murid_id: parseInt(formPerilaku.murid_id), 
      catatan: formPerilaku.catatan, 
      ustadz_email: user?.email 
    }]).select();

    if (error) {
      alert("Gagal menyimpan catatan: " + error.message);
    } else if (data) {
      setListPerilaku([data[0], ...listPerilaku]);
      setFormPerilaku({ murid_id: '', catatan: '' });
      alert("Catatan perilaku berhasil disimpan!");
    }
    setLoading(false);
  };

  const handleSimpanNilai = async (e) => {
    e.preventDefault();
    if (!formNilai.murid_id || !formNilai.pelajaran || !formNilai.skor) return alert("Lengkapi data nilai!");
    if (!checkConnection()) return;

    setLoading(true);
    const { data, error } = await supabase.from('nilai').insert([{ 
      murid_id: parseInt(formNilai.murid_id), 
      jenis_ujian: formNilai.jenis_ujian, 
      pelajaran: formNilai.pelajaran, 
      skor: parseInt(formNilai.skor), 
      ustadz_email: user?.email 
    }]).select();

    if (error) {
      alert("Gagal menyimpan nilai: " + error.message);
    } else if (data) {
      setListNilai([data[0], ...listNilai]);
      setFormNilai({ murid_id: '', jenis_ujian: 'Ulangan', pelajaran: '', skor: '' });
      alert("Skor nilai berhasil dicatat!");
    }
    setLoading(false);
  };

  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    if (!formSoal.pelajaran || !formSoal.kelas || !formSoal.isi) return alert("Lengkapi formulir pembuatan soal!");
    if (!checkConnection()) return;

    setLoading(true);
    const { data, error } = await supabase.from('bank_soal').insert([{ 
      pelajaran: formSoal.pelajaran, 
      kelas: formSoal.kelas, 
      batasan: formSoal.batasan, 
      isi_soal: formSoal.isi, 
      ustadz_email: user?.email 
    }]).select();

    if (error) {
      alert("Gagal menyimpan soal: " + error.message);
    } else if (data) {
      setListBankSoal([data[0], ...listBankSoal]);
      setFormSoal({ pelajaran: '', kelas: '', batasan: '', isi: '' });
      alert("Soal berhasil dimasukkan ke Bank Soal!");
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
            <p className="text-xs text-slate-500 mt-1">Silakan login untuk sinkronisasi data cloud</p>
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
          <h1 className="text-xl font-bold tracking-tight">Buku Ustaz <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full ml-1 font-mono align-top">v3.5</span></h1>
        </div>
        <div className="flex items-center gap-3">
          {isOffline && <span className="text-[10px] bg-red-500 px-2 py-1 rounded font-bold uppercase tracking-wider animate-pulse">Offline</span>}
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          <button onClick={() => syncSemuaDataKeCloud()} className="text-white hover:bg-emerald-500 bg-emerald-700 w-8 h-8 rounded-full flex items-center justify-center transition" title="Sinkron Cloud">
            <i className="fa-solid fa-cloud-arrow-up text-sm"></i>
          </button>
          <button onClick={() => supabase.auth.signOut()} className="text-emerald-100 hover:text-white" title="Keluar">
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        
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

        {/* REVISI FITUR: MENU ABSEN MODERN SINKRONISASI HARI TANGGAL AKTIF */}
        {activeTab === 'absen' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-md space-y-1">
              <p className="text-[10px] uppercase font-extrabold tracking-widest opacity-75">Sesi Rekap Absensi Aktif</p>
              <h3 className="text-base font-black tracking-wide">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-[10px] opacity-90"><i className="fa-solid fa-circle-check"></i> Klik tombol status untuk menyimpan langsung ke profil murid.</p>
            </div>

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
                      <button onClick={() => handleSimpanAbsen(m.id, 'Hadir')} disabled={loading} className={`w-8 h-8 rounded-lg font-bold text-xs transition shadow-sm ${absenHariIni?.status === 'Hadir' ? 'bg-emerald-600 text-white scale-105 ring-2 ring-emerald-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} disabled:opacity-50`}>H</button>
                      <button onClick={() => handleSimpanAbsen(m.id, 'Izin')} disabled={loading} className={`w-8 h-8 rounded-lg font-bold text-xs transition shadow-sm ${absenHariIni?.status === 'Izin' ? 'bg-amber-500 text-white scale-105 ring-2 ring-amber-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} disabled:opacity-50`}>I</button>
                      <button onClick={() => handleSimpanAbsen(m.id, 'Alfa')} disabled={loading} className={`w-8 h-8 rounded-lg font-bold text-xs transition shadow-sm ${absenHariIni?.status === 'Alfa' ? 'bg-red-500 text-white scale-105 ring-2 ring-red-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} disabled:opacity-50`}>A</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'batas' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2"><i className="fa-solid fa-book-open"></i> Catat Batas Mengajar</h3>
              <input type="text" placeholder="Nama Fan Pelajaran / Kitab" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formBatas.fan} onChange={e => setFormBatas({...formBatas, fan: e.target.value})} />
              <input type="text" placeholder="Batas Akhir (Bab/Hal/Ayat)" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formBatas.batas} onChange={e => setFormBatas({...formBatas, batas: e.target.value})} />
              <button onClick={handleSimpanBatasAjar} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow flex items-center justify-center gap-2 disabled:opacity-50"><i className="fa-solid fa-floppy-disk"></i> Simpan Batas Ajar</button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Riwayat Batas Akhir</p>
              {listBatas.map(b => (
                <div key={b.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{b.fan}</h4>
                    <p className="text-xs text-emerald-600 font-bold mt-0.5">Batas: {b.batas_akhir}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">{new Date(b.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'perilaku' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2"><i className="fa-solid fa-star-half-stroke"></i> Catatan Perilaku Santri</h3>
              <select className="w-full border rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 ring-emerald-500" value={formPerilaku.murid_id} onChange={e => setFormPerilaku({...formPerilaku, murid_id: e.target.value})}>
                <option value="">-- Pilih Nama Murid --</option>
                {muridList.map(m => <option key={m.id} value={m.id}>{m.nama} ({m.kelas})</option>)}
              </select>
              <textarea placeholder="Tulis catatan perkembangan atau perilaku santri di sini..." className="w-full border rounded-xl p-3 text-sm h-28 focus:ring-2 ring-emerald-500 outline-none resize-none" value={formPerilaku.catatan} onChange={e => setFormPerilaku({...formPerilaku, catatan: e.target.value})}></textarea>
              <button onClick={handleSimpanPerilaku} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow flex items-center justify-center gap-2 disabled:opacity-50"><i className="fa-solid fa-floppy-disk"></i> Simpan Catatan</button>
            </div>
          </div>
        )}

        {activeTab === 'nilai' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2"><i className="fa-solid fa-file-signature"></i> Pencatatan Skor Nilai</h3>
              <select className="w-full border rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 ring-emerald-500" value={formNilai.murid_id} onChange={e => setFormNilai({...formNilai, murid_id: e.target.value})}>
                <option value="">-- Pilih Nama Murid --</option>
                {muridList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
              
              <div className="grid grid-cols-3 gap-2">
                {['Ulangan', 'Ujian Tulis', 'Ujian Lisan'].map(j => (
                  <button key={j} type="button" onClick={() => setFormNilai({...formNilai, jenis_ujian: j})} className={`py-2 text-[10px] font-bold rounded-xl border transition ${formNilai.jenis_ujian === j ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{j}</button>
                ))}
              </div>

              <input type="text" placeholder="Mata Pelajaran / Fan" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formNilai.pelajaran} onChange={e => setFormNilai({...formNilai, pelajaran: e.target.value})} />
              <input type="number" placeholder="Skor Nilai (Angka 0-100)" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formNilai.skor} onChange={e => setFormNilai({...formNilai, skor: e.target.value})} />
              
              <button onClick={handleSimpanNilai} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow mt-1 flex items-center justify-center gap-2 disabled:opacity-50"><i className="fa-solid fa-floppy-disk"></i> Simpan Nilai</button>
            </div>
          </div>
        )}

        {activeTab === 'soal' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2"><i className="fa-regular fa-folder-open"></i> Media Lembar Soal</h3>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Pelajaran (Fan)" className="border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formSoal.pelajaran} onChange={e => setFormSoal({...formSoal, pelajaran: e.target.value})} />
                <input type="text" placeholder="Untuk Kelas" className="border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formSoal.kelas} onChange={e => setFormSoal({...formSoal, kelas: e.target.value})} />
              </div>
              <input type="text" placeholder="Batasan Materi Bab / Ruang Lingkup" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formSoal.batasan} onChange={e => setFormSoal({...formSoal, batasan: e.target.value})} />
              <textarea placeholder="Tulis butir pertanyaan soal ujian secara urut..." className="w-full border rounded-xl p-4 text-sm h-36 font-mono bg-slate-50/50 focus:ring-2 ring-emerald-500 outline-none resize-none" value={formSoal.isi} onChange={e => setFormSoal({...formSoal, isi: e.target.value})}></textarea>
              <button onClick={handleSimpanSoal} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow flex items-center justify-center gap-2 disabled:opacity-50"><i className="fa-solid fa-file-arrow-up"></i> Masukkan Bank Soal</button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Koleksi Folder Bank Soal</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(groupBankSoal).map(f => (
                  <div key={f} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-3xl text-amber-400 mb-1 drop-shadow-sm"><i className="fa-solid fa-folder"></i></span>
                    <h4 className="font-bold text-slate-800 text-xs mt-1 truncate w-full">Soal {f}</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mt-1 font-medium">{groupBankSoal[f].length} Berkas</span>
                  </div>
                ))}
                {Object.keys(groupBankSoal).length === 0 && <p className="text-xs text-slate-400 text-center col-span-2 py-4">Belum ada bank soal.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profil' && (
          <div className="space-y-4">
            
            {/* FITUR: REVISI INTEGRASI FITUR UTAMA INSTAL APLIKASI DI MENU UTAMA PROFIL */}
            {showInstallBtn && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-2xl shadow border border-amber-300 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black tracking-wide"><i className="fa-solid fa-mobile-screen-button mr-1"></i> Jadikan Aplikasi HP</h4>
                  <p className="text-[10px] opacity-90 mt-0.5">Buka Buku Ustaz langsung dari layar utama HP Anda.</p>
                </div>
                <button onClick={handleInstallAppClick} className="bg-white text-orange-700 font-extrabold text-[11px] px-3 py-2 rounded-xl shadow hover:bg-slate-50 transition shrink-0 ml-2">
                  Pasang Sekarang
                </button>
              </div>
            )}

            {viewProfilStage === 'kelas' && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm px-1">Pilih Kelas Terlebih Dahulu:</h3>
                <div className="grid grid-cols-2 gap-3">
                  {listKelasUnik.map(k => (
                    <button key={k} onClick={() => { setSelectedKelasProfil(k); setViewProfilStage('murid'); }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left hover:border-emerald-500 transition group flex justify-between items-center">
                      <div>
                        <span className="text-emerald-600 text-lg block mb-1"><i className="fa-solid fa-users"></i></span>
                        <span className="font-bold text-slate-800 text-sm block">Kelas {k}</span>
                      </div>
                      <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-emerald-500"></i>
                    </button>
                  ))}
                  {listKelasUnik.length === 0 && <p className="text-xs text-slate-400 text-center col-span-2 py-6">Belum ada kelas terdaftar.</p>}
                </div>
              </div>
            )}

            {viewProfilStage === 'murid' && (
              <div className="space-y-3">
                <button onClick={() => setViewProfilStage('kelas')} className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"><i className="fa-solid fa-arrow-left"></i> Kembali</button>
                <h3 className="font-bold text-slate-800 text-sm px-1">Daftar Santri Kelas: <span className="text-emerald-600">{selectedKelasProfil}</span></h3>
                <div className="space-y-2">
                  {muridList.filter(m => m.kelas === selectedKelasProfil).map(m => (
                    <button key={m.id} onClick={() => { setSelectedMuridProfil(m); setViewProfilStage('detail'); }} className="w-full bg-white p-4 rounded-xl border text-left flex justify-between items-center shadow-sm hover:border-emerald-400 transition">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{m.nama}</h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5"><i className="fa-solid fa-location-dot text-slate-300 mr-1"></i>{m.alamat || '-'}</p>
                      </div>
                      <i className="fa-solid fa-circle-user text-2xl text-slate-200"></i>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewProfilStage === 'detail' && selectedMuridProfil && (
              <div className="space-y-4">
                <button onClick={() => setViewProfilStage('murid')} className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"><i className="fa-solid fa-arrow-left"></i> Kembali</button>
                
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 rounded-3xl shadow-md relative overflow-hidden">
                  <div className="absolute right-4 bottom-2 text-7xl font-black opacity-10"><i className="fa-solid fa-user-graduate"></i></div>
                  <h2 className="text-lg font-bold">{selectedMuridProfil.nama}</h2>
                  <p className="text-xs opacity-90 font-mono mt-0.5">Kelas: {selectedMuridProfil.kelas}</p>
                  <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-[11px] opacity-95">
                    <p className="truncate" title={selectedMuridProfil.alamat}><i className="fa-solid fa-map-location-dot mr-1"></i> {selectedMuridProfil.alamat || '-'}</p>
                    <p className="truncate" title={selectedMuridProfil.domisili}><i className="fa-solid fa-house mr-1"></i> {selectedMuridProfil.domisili || '-'}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 border-b pb-2 mb-2 flex items-center gap-1.5"><i className="fa-solid fa-calendar-check text-emerald-600"></i> Rekap Absensi</h4>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100"><span className="text-[10px] block text-slate-500 font-bold uppercase">Hadir</span><span className="font-black text-emerald-700 text-lg">{listAbsensi.filter(a => a.murid_id === selectedMuridProfil.id && a.status === 'Hadir').length}</span></div>
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-100"><span className="text-[10px] block text-slate-500 font-bold uppercase">Izin</span><span className="font-black text-amber-700 text-lg">{listAbsensi.filter(a => a.murid_id === selectedMuridProfil.id && a.status === 'Izin').length}</span></div>
                    <div className="bg-red-50 p-2 rounded-xl border border-red-100"><span className="text-[10px] block text-slate-500 font-bold uppercase">Alfa</span><span className="font-black text-red-700 text-lg">{listAbsensi.filter(a => a.murid_id === selectedMuridProfil.id && a.status === 'Alfa').length}</span></div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 border-b pb-2 mb-2 flex items-center gap-1.5"><i className="fa-solid fa-chart-line text-emerald-600"></i> Riwayat Nilai</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pt-1 pr-1">
                    {listNilai.filter(n => n.murid_id === selectedMuridProfil.id).map(n => (
                      <div key={n.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0">
                        <div>
                          <span className="font-bold text-slate-700 block">{n.pelajaran}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{n.jenis_ujian}</span>
                        </div>
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-black px-2.5 py-1 rounded-lg text-sm">{n.skor}</span>
                      </div>
                    ))}
                    {listNilai.filter(n => n.murid_id === selectedMuridProfil.id).length === 0 && <p className="text-[11px] text-slate-400 text-center py-2">Belum ada nilai terinput.</p>}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 border-b pb-2 mb-2 flex items-center gap-1.5"><i className="fa-solid fa-comment-dots text-emerald-600"></i> Catatan Perilaku</h4>
                  <div className="space-y-2 pt-1 pr-1">
                    {listPerilaku.filter(p => p.murid_id === selectedMuridProfil.id).map(p => (
                      <div key={p.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                        "{p.catatan}"
                        <span className="text-[9px] block text-slate-400 font-mono not-italic mt-2 text-right border-t border-slate-200 pt-1">{new Date(p.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    ))}
                    {listPerilaku.filter(p => p.murid_id === selectedMuridProfil.id).length === 0 && <p className="text-[11px] text-slate-400 text-center py-2">Belum ada catatan.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 grid grid-cols-7 px-1 py-1.5 z-50 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
        {[
          { id: 'database', icon: 'fa-users-line', label: 'Murid' },
          { id: 'absen', icon: 'fa-clipboard-user', label: 'Absen' },
          { id: 'batas', icon: 'fa-book-bookmark', label: 'Batas' },
          { id: 'perilaku', icon: 'fa-star-half-stroke', label: 'Sikap' },
          { id: 'nilai', icon: 'fa-file-signature', label: 'Nilai' },
          { id: 'soal', icon: 'fa-folder-open', label: 'Soal' },
          { id: 'profil', icon: 'fa-id-card-clip', label: 'Profil' }
        ].map(menu => {
          const isAct = activeTab === menu.id;
          return (
            <button key={menu.id} onClick={() => { setActiveTab(menu.id); if(menu.id === 'profil') setViewProfilStage('kelas'); }} className="flex flex-col items-center justify-center outline-none py-1 rounded-lg transition-all relative">
              <i className={`fa-solid ${menu.icon} text-[18px] mb-1 transition-all duration-300 ${isAct ? 'text-emerald-600 drop-shadow-sm scale-110 -translate-y-0.5' : 'text-slate-400 hover:text-slate-500'}`}></i>
              <span className={`text-[8px] font-extrabold tracking-tight ${isAct ? 'text-emerald-700' : 'text-slate-500'}`}>{menu.label}</span>
              {isAct && <div className="absolute top-0 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white"></div>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
