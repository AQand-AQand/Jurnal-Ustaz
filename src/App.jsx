import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { useAuth } from './hooks/useAuth';

// Impor Halaman/Komponen Baru
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Profil from './pages/Profil/Profil';

export default function App() {
  // Hubungkan ke Core Auth Hook Platform
  const { user, profile, loading: authLoading, login, register, logout, resetPassword, refreshProfile } = useAuth();
  
  const [authView, setAuthView] = useState('login'); // login, register, forgot
  const [activeTab, setActiveTab] = useState('dashboard'); // Default diubah ke Dashboard pribadi
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [now, setNow] = useState(new Date());

  // === DATA STATES KBM LAMA (DIPERTAHANKAN UTUH TANPA DIHAPUS) ===
  const [muridList, setMuridList] = useState([]);
  const [listAbsensi, setListAbsensi] = useState([]);
  const [listBatas, setListBatas] = useState([]); 
  const [listPerilaku, setListPerilaku] = useState([]);
  const [listNilai, setListNilai] = useState([]);
  const [listBankSoal, setListBankSoal] = useState([]);
  const [listJadwal, setListJadwal] = useState([]);
  const [listSakuBatas, setListSakuBatas] = useState([]);
  const [listSakuTagihan, setListSakuTagihan] = useState([]);
  const [listCapaian, setListCapaian] = useState([]);
  const [targetPersen, setTargetPersen] = useState(80);

  // === STRUKTUR STATE SUB-TAB DAN FORM FORM LAMA (TETAP SAMA) ===
  const [bukuSakuTab, setBukuSakuTab] = useState('batas');
  const [nilaiModeTab, setNilaiModeTab] = useState('ujian');
  const [soalTab, setSoalTab] = useState('arsip');
  const [formMurid, setFormMurid] = useState({ id: null, nama: '', kelas: '', alamat: '', domisili: '' });
  const [formPerilaku, setFormPerilaku] = useState({ catatan: '' });
  const [formSoal, setFormSoal] = useState({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' });
  const [formJadwal, setFormJadwal] = useState({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  const [formSakuBatas, setFormSakuBatas] = useState({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
  const [formSakuTagihan, setFormSakuTagihan] = useState({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
  const [formCapaian, setFormCapaian] = useState({ capaian: '', tanggal: new Date().toISOString().split('T')[0] });
  const [filterKelasAbsen, setFilterKelasAbsen] = useState('Semua');

  // State Navigasi Turunan KBM Lama
  const [nilaiKelas, setNilaiKelas] = useState('');
  const [selectedMuridNilai, setSelectedMuridNilai] = useState(null);
  const [formNilai, setFormNilai] = useState({ pelajaran: '', jenis: 'Ulangan', skor: '' });
  const [hafalanKelas, setHafalanKelas] = useState('');
  const [selectedMuridHafalan, setSelectedMuridHafalan] = useState(null);
  const [perilakuKelas, setPerilakuKelas] = useState('');
  const [selectedMuridPerilaku, setSelectedMuridPerilaku] = useState(null);
  const [raporKelas, setRaporKelas] = useState('');
  const [selectedMuridRapor, setSelectedMuridRapor] = useState(null);
  const [showTambahMurid, setShowTambahMurid] = useState(false);
  const [showTambahJadwal, setShowTambahJadwal] = useState(false);

  useEffect(() => {
    loadDataLokalOffline();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setInterval(() => setNow(new Date()), 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (user && !isOffline) syncSemuaDataKeCloud();
  }, [user, isOffline]);

  // === CACHING ENGINE LOCALSTORAGE (PRINSIP KINERJA OFFLINE LAMA) ===
  useEffect(() => {
    if (user) {
      const uId = user.id;
      if (muridList.length > 0) localStorage.setItem(`off_murid_${uId}`, JSON.stringify(muridList));
      if (listAbsensi.length > 0) localStorage.setItem(`off_absen_${uId}`, JSON.stringify(listAbsensi));
      if (listBatas.length > 0) localStorage.setItem(`off_batas_${uId}`, JSON.stringify(listBatas));
      if (listPerilaku.length > 0) localStorage.setItem(`off_perilaku_${uId}`, JSON.stringify(listPerilaku));
      if (listNilai.length > 0) localStorage.setItem(`off_nilai_${uId}`, JSON.stringify(listNilai));
      if (listBankSoal.length > 0) localStorage.setItem(`off_soal_${uId}`, JSON.stringify(listBankSoal));
      if (listJadwal.length > 0) localStorage.setItem(`off_jadwal_${uId}`, JSON.stringify(listJadwal));
      if (listSakuBatas.length > 0) localStorage.setItem(`off_sakubatas_${uId}`, JSON.stringify(listSakuBatas));
      if (listSakuTagihan.length > 0) localStorage.setItem(`off_sakutagihan_${uId}`, JSON.stringify(listSakuTagihan));
      if (listCapaian.length > 0) localStorage.setItem(`off_capaian_${uId}`, JSON.stringify(listCapaian));
    }
  }, [muridList, listAbsensi, listBatas, listPerilaku, listNilai, listBankSoal, listJadwal, listSakuBatas, listSakuTagihan, listCapaian, user]);

  const loadDataLokalOffline = () => {
    const uId = user?.id || "anon";
    setMuridList(JSON.parse(localStorage.getItem(`off_murid_${uId}`)) || []);
    setListAbsensi(JSON.parse(localStorage.getItem(`off_absen_${uId}`)) || []);
    setListBatas(JSON.parse(localStorage.getItem(`off_batas_${uId}`)) || []);
    setListPerilaku(JSON.parse(localStorage.getItem(`off_perilaku_${uId}`)) || []);
    setListNilai(JSON.parse(localStorage.getItem(`off_nilai_${uId}`)) || []);
    setListBankSoal(JSON.parse(localStorage.getItem(`off_soal_${uId}`)) || []);
    setListJadwal(JSON.parse(localStorage.getItem(`off_jadwal_${uId}`)) || []);
    setListSakuBatas(JSON.parse(localStorage.getItem(`off_sakubatas_${uId}`)) || []);
    setListSakuTagihan(JSON.parse(localStorage.getItem(`off_sakutagihan_${uId}`)) || []);
    setListCapaian(JSON.parse(localStorage.getItem(`off_capaian_${uId}`)) || []);
  };

  const syncSemuaDataKeCloud = async () => {
    if (!navigator.onLine || !user) return;
    setLoading(true);
    try {
      // Pembacaan tersaring otomatis oleh sistem Supabase RLS Policy secara penuh
      const { data: m } = await supabase.from('murid').select('*').order('nama', { ascending: true });
      const { data: a } = await supabase.from('absensi').select('*').order('tanggal', { ascending: false });
      const { data: b } = await supabase.from('buku_saku_batas').select('*').order('created_at', { ascending: false });
      const { data: p } = await supabase.from('catatan_perilaku').select('*').order('created_at', { ascending: false });
      const { data: n } = await supabase.from('nilai').select('*').order('created_at', { ascending: false });
      const { data: bs } = await supabase.from('bank_soal').select('*').order('created_at', { ascending: false });
      const { data: jdwl } = await supabase.from('jadwal_mengajar').select('*');
      const { data: skb } = await supabase.from('buku_saku_batas').select('*').order('created_at', { ascending: false });
      const { data: skt } = await supabase.from('buku_saku_tagihan').select('*').order('tanggal', { ascending: true });
      const { data: ch } = await supabase.from('capaian_hafalan').select('*').order('created_at', { ascending: false });
      const { data: trg } = await supabase.from('target_mengajar').select('target').limit(1).single();

      if (m) setMuridList(m);
      if (a) setListAbsensi(a);
      if (b) setListBatas(b);
      if (p) setListPerilaku(p);
      if (n) setListNilai(n);
      if (bs) setListBankSoal(bs);
      if (jdwl) setListJadwal(jdwl);
      if (skb) setListSakuBatas(skb);
      if (skt) setListSakuTagihan(skt);
      if (ch) setListCapaian(ch);
      if (trg) setTargetPersen(trg.target);
    } catch (err) {
      console.log("Sinkronisasi gagal:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = () => {
    if (isOffline) {
      alert("Sistem terdeteksi offline. Perubahan disimpan secara lokal di device Anda.");
      return false;
    }
    return true;
  };

  // ====================================================================
  // CRUD & LOGIC UTAMA (FUNGSI ASLI TETAP DIPERTAHANKAN SECARA INTEGRAL)
  // ====================================================================
  const handleSimpanMurid = async (e) => {
    e.preventDefault();
    if (!formMurid.nama || !formMurid.kelas) return alert("Nama dan Kelas wajib diisi!");
    
    if (formMurid.id) {
      const updatedList = muridList.map(m => m.id === formMurid.id ? formMurid : m);
      setMuridList(updatedList);
      if (checkConnection()) {
        await supabase.from('murid').update({ nama: formMurid.nama, kelas: formMurid.kelas, alamat: formMurid.alamat, domisili: formMurid.domisili }).eq('id', formMurid.id);
      }
    } else {
      const safeLocalId = Math.floor(Math.random() * 10000000);
      const newMurid = { ...formMurid, id: safeLocalId, user_id: user.id };
      setMuridList([...muridList, newMurid]);
      if (checkConnection()) {
        await supabase.from('murid').insert([newMurid]);
      }
    }
    setFormMurid({ id: null, nama: '', kelas: '', alamat: '', domisili: '' });
    setShowTambahMurid(false);
  };

  const handleEditMurid = (m) => { setFormMurid(m); setShowTambahMurid(true); };
  
  const handleHapusMurid = async (id) => {
    if (!window.confirm("Hapus data santri ini?")) return;
    setMuridList(muridList.filter(m => m.id !== id));
    if (checkConnection()) await supabase.from('murid').delete().eq('id', id);
  };

  const handleSimpanJadwal = async (e) => {
    e.preventDefault();
    if(!formJadwal.jam_mulai || !formJadwal.kelas || !formJadwal.pelajaran) return alert("Lengkapi form!");
    if (formJadwal.id) {
       const updated = listJadwal.map(j => j.id === formJadwal.id ? formJadwal : j);
       setListJadwal(updated);
       if(checkConnection()) await supabase.from('jadwal_mengajar').update({ hari: formJadwal.hari, jam_mulai: formJadwal.jam_mulai, kelas: formJadwal.kelas, pelajaran: formJadwal.pelajaran }).eq('id', formJadwal.id);
    } else {
       const safeLocalId = Math.floor(Math.random() * 10000000);
       const newJadwal = { ...formJadwal, id: safeLocalId, user_id: user.id, created_at: new Date().toISOString() };
       setListJadwal([...listJadwal, newJadwal]);
       if (checkConnection()) await supabase.from('jadwal_mengajar').insert([newJadwal]);
    }
    setFormJadwal({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
    setShowTambahJadwal(false);
  };

  const handleHapusJadwal = async (id) => {
    if (!window.confirm("Hapus jadwal?")) return;
    setListJadwal(listJadwal.filter(j => j.id !== id));
    if (checkConnection()) await supabase.from('jadwal_mengajar').delete().eq('id', id);
  };

  const handleSimpanAbsen = async (muridId, status) => {
    const tgl = new Date().toISOString().split('T')[0];
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const absenBaru = { id: safeLocalId, murid_id: muridId, status, tanggal: tgl, user_id: user.id };
    setListAbsensi(prev => [absenBaru, ...prev.filter(a => !(a.murid_id === muridId && a.tanggal === tgl))]);
    if (checkConnection()) await supabase.from('absensi').insert([absenBaru]);
  };

  const handleSimpanPerilaku = async (e) => {
    e.preventDefault();
    if (!selectedMuridPerilaku?.id || !formPerilaku.catatan) return alert("Isi Catatan!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const np = { id: safeLocalId, murid_id: selectedMuridPerilaku.id, catatan: formPerilaku.catatan, user_id: user.id, created_at: new Date().toISOString() };
    setListPerilaku([np, ...listPerilaku]);
    setFormPerilaku({ catatan: '' });
    if (checkConnection()) await supabase.from('catatan_perilaku').insert([np]);
  };

  const handleSimpanNilaiIndividu = async (e) => {
    e.preventDefault();
    if (!formNilai.pelajaran || !formNilai.skor) return alert("Lengkapi Form Nilai!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const nn = { id: safeLocalId, murid_id: selectedMuridNilai.id, jenis_ujian: formNilai.jenis, pelajaran: formNilai.pelajaran, skor: parseInt(formNilai.skor), user_id: user.id, created_at: new Date().toISOString() };
    setListNilai([nn, ...listNilai]);
    setFormNilai({ ...formNilai, skor: '' });
    if (checkConnection()) await supabase.from('nilai').insert([nn]);
  };

  const handleSimpanSakuBatas = async (e) => {
    e.preventDefault();
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const nb = { ...formSakuBatas, id: safeLocalId, user_id: user.id, created_at: new Date().toISOString() };
    setListSakuBatas([nb, ...listSakuBatas]);
    setFormSakuBatas({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
    if (checkConnection()) await supabase.from('buku_saku_batas').insert([nb]);
  };

  const handleSimpanSakuTagihan = async (e) => {
    e.preventDefault();
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const nt = { ...formSakuTagihan, id: safeLocalId, user_id: user.id, created_at: new Date().toISOString() };
    setListSakuTagihan([nt, ...listSakuTagihan]);
    setFormSakuTagihan({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
    if (checkConnection()) await supabase.from('buku_saku_tagihan').insert([nt]);
  };

  const handleSimpanCapaianHafalan = async (e) => {
    e.preventDefault();
    if(!formCapaian.capaian) return alert("Kosong!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const nc = { id: safeLocalId, murid_id: selectedMuridHafalan.id, capaian: formCapaian.capaian, tanggal: formCapaian.tanggal, user_id: user.id, created_at: new Date().toISOString() };
    setListCapaian([nc, ...listCapaian]);
    setFormCapaian({ ...formCapaian, capaian: '' });
    if (checkConnection()) await supabase.from('capaian_hafalan').insert([nc]);
  };

  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    if (!formSoal.pelajaran || !formSoal.isi) return alert("Lengkapi form soal!");
    if (formSoal.id) {
      const updated = listBankSoal.map(s => s.id === formSoal.id ? formSoal : s);
      setListBankSoal(updated);
      if(checkConnection()) await supabase.from('bank_soal').update({ pelajaran: formSoal.pelajaran, kelas: formSoal.kelas, batasan: formSoal.batasan, isi_soal: formSoal.isi }).eq('id', formSoal.id);
    } else {
      const safeLocalId = Math.floor(Math.random() * 10000000);
      const ns = { id: safeLocalId, pelajaran: formSoal.pelajaran, kelas: formSoal.kelas, batasan: formSoal.batasan, isi_soal: formSoal.isi, user_id: user.id };
      setListBankSoal([ns, ...listBankSoal]);
      if (checkConnection()) await supabase.from('bank_soal').insert([ns]);
    }
    setFormSoal({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' });
    setSoalTab('arsip');
  };

  const handleHapusSoal = async (id) => {
    if (!window.confirm("Hapus soal?")) return;
    setListBankSoal(listBankSoal.filter(s => s.id !== id));
    if(checkConnection()) await supabase.from('bank_soal').delete().eq('id', id);
  };

  // ====================================================================
  // ENGINE LOGIC INTELLIGENT SATELLITE (DASHBOARD ANALYTICS & TIMING)
  // ====================================================================
  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))].sort();
  const namaHariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hariIni = namaHariList[now.getDay()];
  const jdwlHariIni = listJadwal.filter(j => j.hari === hariIni);

  // Perhitungan Data Dashboard Dinamis Per Ustaz Aktif
  const dashboardStats = {
    kbmHariIni: jdwlHariIni.length,
    fanAktif: [...new Set(listJadwal.map(j => j.pelajaran))].length,
    kelasAktif: listKelasUnik.length,
    targetBulanIni: targetPersen
  };

  const infoDinamisTeaser = jdwlHariIni.length > 0 
    ? `Hari ini Anda memiliki agenda mengajar rutin sebanyak ${jdwlHariIni.length} kelas. Semoga barokah.`
    : `Hari ini aman, tidak ada jadwal KBM wajib di sistem database Anda.`;

  // Gate Check Rendering untuk Loading Status Utama
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

  // Jika Sesi User Kosong, Hadapkan dengan Gerbang Otentikasi
  if (!user) {
    if (authView === 'register') return <Register onRegister={register} onSwitchView={() => setAuthView('login')} />;
    if (authView === 'forgot') return <ForgotPassword onReset={resetPassword} onBack={() => setAuthView('login')} />;
    return <Login onLogin={login} onSwitchView={() => setAuthView('register')} onForgotPassword={() => setAuthView('forgot')} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200 overflow-hidden pb-32 relative">
      {/* HEADER UTAMA PLATFORM */}
      <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-graduation-cap text-lg"></i>
          <h1 className="text-lg font-black tracking-tight">SIM KBM USTAZ</h1>
        </div>
        <div className="flex items-center gap-3">
          {isOffline && <span className="text-[10px] bg-red-500 px-2 py-0.5 rounded font-bold uppercase animate-pulse">Offline</span>}
          <button onClick={syncSemuaDataKeCloud} className="text-white bg-emerald-700 w-8 h-8 rounded-full flex items-center justify-center transition" title="Sinkron Cloud">
            {loading ? <i className="fa-solid fa-spinner fa-spin text-xs"></i> : <i className="fa-solid fa-cloud-arrow-up text-xs"></i>}
          </button>
          <button onClick={logout} className="text-emerald-100 hover:text-white text-sm" title="Keluar Platform"><i className="fa-solid fa-right-from-bracket"></i></button>
        </div>
      </header>

      {/* CORE VIEWPORT HUB */}
      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        
        {/* TAB 0: DASHBOARD PRIBADI */}
        {activeTab === 'dashboard' && (
          <Dashboard profile={profile} stats={dashboardStats} infoDinamis={infoDinamisTeaser} hariIni={hariIni} />
        )}

        {/* TAB 1: JADWAL KBM */}
        {activeTab === 'jadwal' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                   <h3 className="font-bold text-slate-800 text-xs uppercase text-emerald-600">Jadwal Mengajar Anda</h3>
                   <button onClick={() => {setShowTambahJadwal(!showTambahJadwal); setFormJadwal({id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: ''})}} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">
                     {showTambahJadwal ? 'Batal' : '+ Jadwal'}
                   </button>
                </div>
                <div className="space-y-3">
                  {namaHariList.map(h => {
                     const jP = listJadwal.filter(j => j.hari === h);
                     if (jP.length === 0) return null;
                     return (
                       <div key={h} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <p className="text-xs font-bold text-slate-700 mb-1 border-b pb-1">📅 {h}</p>
                          {jP.map(j => (
                             <div key={j.id} className="flex items-center justify-between py-1 text-xs">
                                <span><b>{j.jam_mulai}</b> - {j.pelajaran} (Kls {j.kelas})</span>
                                <button onClick={() => handleHapusJadwal(j.id)} className="text-red-400 font-bold"><i className="fa-solid fa-trash-can"></i></button>
                             </div>
                          ))}
                       </div>
                     )
                  })}
                </div>
            </div>

            {showTambahJadwal && (
              <form onSubmit={handleSimpanJadwal} className="bg-white p-4 rounded-xl border space-y-2">
                <select className="w-full border p-2 text-xs rounded" value={formJadwal.hari} onChange={e => setFormJadwal({...formJadwal, hari: e.target.value})}>
                  {namaHariList.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <input type="time" required className="w-full border p-2 text-xs rounded" value={formJadwal.jam_mulai} onChange={e => setFormJadwal({...formJadwal, jam_mulai: e.target.value})} />
                <input type="text" placeholder="Kelas" required className="w-full border p-2 text-xs rounded" value={formJadwal.kelas} onChange={e => setFormJadwal({...formJadwal, kelas: e.target.value})} />
                <input type="text" placeholder="Pelajaran" required className="w-full border p-2 text-xs rounded" value={formJadwal.pelajaran} onChange={e => setFormJadwal({...formJadwal, pelajaran: e.target.value})} />
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded text-xs">Simpan Jadwal</button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: MANAJEMEN SANTRI / RAPOR */}
        {activeTab === 'rapor' && (
          <div className="space-y-4">
            {!raporKelas && (
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-800 text-xs text-emerald-600 uppercase">Data Kelas Binaan</h3>
                  <button onClick={() => setShowTambahMurid(!showTambahMurid)} className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-1 rounded">
                    {showTambahMurid ? 'Batal' : '+ Santri'}
                  </button>
                </div>

                {showTambahMurid && (
                  <form onSubmit={handleSimpanMurid} className="p-3 bg-slate-50 rounded-xl space-y-2 border">
                    <input type="text" placeholder="Nama Santri" required className="w-full border p-2 text-xs rounded bg-white" value={formMurid.nama} onChange={e => setFormMurid({...formMurid, nama: e.target.value})} />
                    <input type="text" placeholder="Kelas" required className="w-full border p-2 text-xs rounded bg-white" value={formMurid.kelas} onChange={e => setFormMurid({...formMurid, kelas: e.target.value})} />
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-1.5 text-xs rounded">Simpan Santri</button>
                  </form>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {listKelasUnik.map(k => (
                    <button key={k} onClick={() => setRaporKelas(k)} className="bg-slate-50 border p-4 rounded-xl text-center font-bold text-slate-700 hover:border-emerald-500">Kelas {k}</button>
                  ))}
                </div>
              </div>
            )}

            {raporKelas && !selectedMuridRapor && (
              <div className="bg-white p-4 rounded-xl border space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-xs text-slate-700">Daftar Santri Kelas {raporKelas}</h3>
                  <button onClick={() => setRaporKelas('')} className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold">Kembali</button>
                </div>
                {muridList.filter(m => m.kelas === raporKelas).map(m => (
                  <div key={m.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded border text-xs">
                    <span className="font-semibold cursor-pointer" onClick={() => setSelectedMuridRapor(m)}>👤 {m.nama}</span>
                    <button onClick={() => handleHapusMurid(m.id)} className="text-red-500"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                ))}
              </div>
            )}

            {raporKelas && selectedMuridRapor && (
              <div className="bg-white p-4 rounded-xl border space-y-3 text-xs">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{selectedMuridRapor.nama}</h3>
                    <p className="text-[10px] text-slate-400">Kelas {selectedMuridRapor.kelas}</p>
                  </div>
                  <button onClick={() => setSelectedMuridRapor(null)} className="bg-slate-200 px-2 py-1 rounded font-bold text-[10px]">Tutup Rapor</button>
                </div>
                <div>
                   <p className="font-bold text-emerald-600 mb-1">▪️ Rekap Nilai Tugas & Ujian</p>
                   <div className="bg-slate-50 p-2 rounded border">
                      {listNilai.filter(n => n.murid_id === selectedMuridRapor.id).map(n => (
                        <div key={n.id} className="flex justify-between border-b py-1 last:border-0">
                           <span>[{n.jenis_ujian}] {n.pelajaran}</span>
                           <span className="font-bold text-slate-700">{n.skor} Pts</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ABSENSI (KBM LAMA) */}
        {activeTab === 'absen' && (
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-xl border flex items-center justify-between shadow-sm">
              <label className="text-xs font-bold text-slate-500">Pilih Filter Kelas KBM:</label>
              <select className="border p-1 rounded text-xs font-bold bg-white" value={filterKelasAbsen} onChange={e => setFilterKelasAbsen(e.target.value)}>
                <option value="Semua">Semua Kelas</option>
                {listKelasUnik.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              {muridList.filter(m => filterKelasAbsen === 'Semua' || m.kelas === filterKelasAbsen).map(m => {
                const aH = listAbsensi.find(a => a.murid_id === m.id);
                return (
                  <div key={m.id} className="bg-white p-3 rounded-xl border flex items-center justify-between shadow-sm text-xs">
                    <span className="font-bold text-slate-700">{m.nama} (Kls {m.kelas})</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleSimpanAbsen(m.id, 'Hadir')} className={`w-7 h-7 rounded font-bold ${aH?.status === 'Hadir' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>H</button>
                      <button onClick={() => handleSimpanAbsen(m.id, 'Izin')} className={`w-7 h-7 rounded font-bold ${aH?.status === 'Izin' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>I</button>
                      <button onClick={() => handleSimpanAbsen(m.id, 'Alfa')} className={`w-7 h-7 rounded font-bold ${aH?.status === 'Alfa' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>A</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: BUKU SAKU */}
        {activeTab === 'saku' && (
          <div className="space-y-3">
             <div className="flex bg-slate-200 p-1 rounded-lg">
               <button onClick={() => setBukuSakuTab('batas')} className={`flex-1 py-1.5 text-xs font-bold rounded ${bukuSakuTab === 'batas' ? 'bg-white text-emerald-700' : 'text-slate-500'}`}>Batas Kitab</button>
               <button onClick={() => setBukuSakuTab('tagihan')} className={`flex-1 py-1.5 text-xs font-bold rounded ${bukuSakuTab === 'tagihan' ? 'bg-white text-emerald-700' : 'text-slate-500'}`}>Janji Tagihan</button>
             </div>
             {bukuSakuTab === 'batas' && (
               <form onSubmit={handleSimpanSakuBatas} className="bg-white p-4 rounded-xl border space-y-2">
                 <input type="text" placeholder="Kelas" required className="w-full border p-2 text-xs rounded" value={formSakuBatas.kelas} onChange={e => setFormSakuBatas({...formSakuBatas, kelas: e.target.value})} />
                 <input type="text" placeholder="Fan / Kitab" required className="w-full border p-2 text-xs rounded" value={formSakuBatas.fan} onChange={e => setFormSakuBatas({...formSakuBatas, fan: e.target.value})} />
                 <input type="text" placeholder="Materi Terakhir" required className="w-full border p-2 text-xs rounded" value={formSakuBatas.materi} onChange={e => setFormSakuBatas({...formSakuBatas, materi: e.target.value})} />
                 <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded">Simpan Catatan Batas</button>
               </form>
             )}
          </div>
        )}

        {/* TAB 5: CATATAN SIKAP */}
        {activeTab === 'perilaku' && (
          <div className="space-y-4">
            {!perilakuKelas && (
              <div className="bg-white p-4 rounded-xl border">
                <p className="text-xs font-bold text-slate-500 mb-2">Pilih Kelas Binaan:</p>
                <div className="grid grid-cols-2 gap-2">
                  {listKelasUnik.map(k => (
                    <button key={k} onClick={() => setPerilakuKelas(k)} className="bg-slate-50 border p-3 text-xs font-bold rounded-lg text-slate-700">Kelas {k}</button>
                  ))}
                </div>
              </div>
            )}
            {perilakuKelas && !selectedMuridPerilaku && (
              <div className="bg-white p-4 rounded-xl border space-y-1.5">
                {muridList.filter(m => m.kelas === perilakuKelas).map(m => (
                  <button key={m.id} onClick={() => setSelectedMuridPerilaku(m)} className="w-full bg-slate-50 p-2 border text-left text-xs rounded font-medium">{m.nama}</button>
                ))}
              </div>
            )}
            {perilakuKelas && selectedMuridPerilaku && (
              <form onSubmit={handleSimpanPerilaku} className="bg-white p-4 rounded-xl border space-y-3">
                <p className="text-xs font-bold">Catatan Sikap: <span className="text-emerald-600">{selectedMuridPerilaku.nama}</span></p>
                <textarea placeholder="Tulis perkembangan akhlak/pelanggaran..." required className="w-full border rounded p-2 text-xs h-24 outline-none resize-none" value={formPerilaku.catatan} onChange={e => setFormPerilaku({ catatan: e.target.value })}></textarea>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded text-xs">Simpan Catatan</button>
              </form>
            )}
          </div>
        )}

        {/* TAB 6: PENILAIAN AKADEMIK */}
        {activeTab === 'nilai' && (
          <div className="space-y-4">
             <div className="flex bg-slate-200 p-1 rounded-lg">
               <button onClick={() => setNilaiModeTab('ujian')} className={`flex-1 py-1.5 text-xs font-bold rounded ${nilaiModeTab === 'ujian' ? 'bg-white text-emerald-700' : 'text-slate-500'}`}>Nilai Ujian</button>
               <button onClick={() => setNilaiModeTab('hafalan')} className={`flex-1 py-1.5 text-xs font-bold rounded ${nilaiModeTab === 'hafalan' ? 'bg-white text-emerald-700' : 'text-slate-500'}`}>Setoran Hafalan</button>
             </div>
             {nilaiModeTab === 'ujian' && !selectedMuridNilai && (
                <div className="bg-white p-4 rounded-xl border space-y-2">
                   {muridList.map(m => (
                      <button key={m.id} onClick={() => setSelectedMuridNilai(m)} className="w-full bg-slate-50 border p-2 text-xs text-left rounded block font-medium">🎯 {m.nama} (Kelas {m.kelas})</button>
                   ))}
                </div>
             )}
             {selectedMuridNilai && (
                <form onSubmit={handleSimpanNilaiIndividu} className="bg-white p-4 rounded-xl border space-y-2 text-xs">
                   <p className="font-bold">Input Nilai: {selectedMuridNilai.nama}</p>
                   <input type="text" placeholder="Mata Pelajaran" required className="w-full border p-2 rounded" value={formNilai.pelajaran} onChange={e => setFormNilai({...formNilai, pelajaran: e.target.value})} />
                   <input type="number" placeholder="Skor (0-100)" required className="w-full border p-2 rounded font-bold text-emerald-600" value={formNilai.skor} onChange={e => setFormNilai({...formNilai, skor: e.target.value})} />
                   <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded">Simpan Angka Nilai</button>
                </form>
             )}
          </div>
        )}

        {/* TAB 7: ARSIP BANK SOAL UJIAN */}
        {activeTab === 'soal' && (
          <div className="space-y-4">
             <div className="flex bg-slate-200 p-1 rounded-lg">
               <button onClick={() => setSoalTab('arsip')} className={`flex-1 py-1.5 text-xs font-bold rounded ${soalTab === 'arsip' ? 'bg-white text-emerald-700' : 'text-slate-500'}`}>Arsip Soal</button>
               <button onClick={() => setSoalTab('buat')} className={`flex-1 py-1.5 text-xs font-bold rounded ${soalTab === 'buat' ? 'bg-white text-emerald-700' : 'text-slate-500'}`}>Buat Soal</button>
             </div>
             {soalTab === 'buat' && (
                <form onSubmit={handleSimpanSoal} className="bg-white p-4 rounded-xl border space-y-2">
                   <input type="text" placeholder="Mata Pelajaran" required className="w-full border p-2 text-xs rounded" value={formSoal.pelajaran} onChange={e => setFormSoal({...formSoal, pelajaran: e.target.value})} />
                   <textarea placeholder="Tulis teks pertanyaan lembar ujian..." required className="w-full border p-2 text-xs rounded h-28" value={formSoal.isi} onChange={e => setFormSoal({...formSoal, isi: e.target.value})}></textarea>
                   <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded">Simpan Dokumen Soal</button>
                </form>
             )}
             {soalTab === 'arsip' && (
                <div className="space-y-2">
                   {listBankSoal.map(s => (
                      <div key={s.id} className="bg-white border p-3 rounded-xl shadow-sm text-xs relative">
                         <div className="flex justify-between font-bold border-b pb-1 mb-1 text-slate-700">
                            <span>📚 {s.pelajaran}</span>
                            <button onClick={() => handleHapusSoal(s.id)} className="text-red-500"><i className="fa-solid fa-trash"></i></button>
                         </div>
                         <p className="text-slate-600 font-medium whitespace-pre-wrap">{s.isi_soal}</p>
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}

        {/* TAB 8: PROFIL SAYA & CONFIG PLATFORM */}
        {activeTab === 'profil' && (
          <Profil profile={profile} user={user} onRefresh={refreshProfile} />
        )}
      </main>

      {/* FOOTER NAVIGATION BAR (MOBILE BOTTOM FIX BAR) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-between px-1 py-2 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', icon: 'fa-chart-pie', label: 'Beranda' },
          { id: 'jadwal', icon: 'fa-calendar-day', label: 'Jadwal' },
          { id: 'rapor', icon: 'fa-users', label: 'Santri' },
          { id: 'absen', icon: 'fa-clipboard-user', label: 'Absen' },
          { id: 'saku', icon: 'fa-book-bookmark', label: 'Saku' },
          { id: 'perilaku', icon: 'fa-star-half-stroke', label: 'Sikap' },
          { id: 'nilai', icon: 'fa-file-signature', label: 'Nilai' },
          { id: 'soal', icon: 'fa-folder-open', label: 'Soal' },
          { id: 'profil', icon: 'fa-user-gear', label: 'Profil' }
        ].map(m => {
          const isA = activeTab === m.id;
          return (
            <button key={m.id} onClick={() => { setActiveTab(m.id); }} className="flex flex-col items-center justify-center py-0.5 w-10 outline-none">
              <i className={`fa-solid ${m.icon} text-[16px] mb-0.5 ${isA ? 'text-emerald-600 scale-105' : 'text-slate-400'}`}></i>
              <span className={`text-[8px] font-black tracking-tight ${isA ? 'text-emerald-700' : 'text-slate-400'}`}>{m.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
