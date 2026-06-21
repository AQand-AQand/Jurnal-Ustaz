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

  const [activeTab, setActiveTab] = useState('jadwal');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [now, setNow] = useState(new Date());

  // === DATA STATE ===
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

  const [bukuSakuTab, setBukuSakuTab] = useState('batas');
  const [nilaiModeTab, setNilaiModeTab] = useState('ujian');

  // === FORM STATE ===
  const [formMurid, setFormMurid] = useState({ nama: '', kelas: '', alamat: '', domisili: '' });
  const [formBatas, setFormBatas] = useState({ fan: '', batas: '' });
  const [formPerilaku, setFormPerilaku] = useState({ murid_id: '', catatan: '' });
  const [formSoal, setFormSoal] = useState({ pelajaran: '', kelas: '', batasan: '', isi: '' });
  const [formJadwal, setFormJadwal] = useState({ hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  const [formSakuBatas, setFormSakuBatas] = useState({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
  const [formSakuTagihan, setFormSakuTagihan] = useState({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
  const [formCapaian, setFormCapaian] = useState({ capaian: '', tanggal: new Date().toISOString().split('T')[0] });

  const [filterKelasAbsen, setFilterKelasAbsen] = useState('Semua');
  
  // State Navigasi Bergaya untuk Nilai & Hafalan
  const [nilaiKelas, setNilaiKelas] = useState('');
  const [selectedMuridNilai, setSelectedMuridNilai] = useState(null);
  const [formNilai, setFormNilai] = useState({ pelajaran: '', jenis: 'Ulangan', skor: '' });
  const [hafalanKelas, setHafalanKelas] = useState('');
  const [selectedMuridHafalan, setSelectedMuridHafalan] = useState(null);

  // State Navigasi Baru Bergaya untuk Perilaku/Sikap
  const [perilakuKelas, setPerilakuKelas] = useState('');
  const [selectedMuridPerilaku, setSelectedMuridPerilaku] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    
    loadDataLokalOffline();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const timer = setInterval(() => setNow(new Date()), 60000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleBackButton = (e) => {
      if (activeTab !== 'jadwal') {
        e.preventDefault();
        setActiveTab('jadwal');
        window.history.pushState(null, '', window.location.pathname);
      }
    };
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [activeTab]);

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
    if (listJadwal.length > 0) localStorage.setItem('off_jadwal', JSON.stringify(listJadwal));
    if (listSakuBatas.length > 0) localStorage.setItem('off_sakubatas', JSON.stringify(listSakuBatas));
    if (listSakuTagihan.length > 0) localStorage.setItem('off_sakutagihan', JSON.stringify(listSakuTagihan));
    if (listCapaian.length > 0) localStorage.setItem('off_capaian', JSON.stringify(listCapaian));
  }, [muridList, listAbsensi, listBatas, listPerilaku, listNilai, listBankSoal, listJadwal, listSakuBatas, listSakuTagihan, listCapaian]);

  const loadDataLokalOffline = () => {
    setMuridList(JSON.parse(localStorage.getItem('off_murid')) || []);
    setListAbsensi(JSON.parse(localStorage.getItem('off_absen')) || []);
    setListBatas(JSON.parse(localStorage.getItem('off_batas')) || []);
    setListPerilaku(JSON.parse(localStorage.getItem('off_perilaku')) || []);
    setListNilai(JSON.parse(localStorage.getItem('off_nilai')) || []);
    setListBankSoal(JSON.parse(localStorage.getItem('off_soal')) || []);
    setListJadwal(JSON.parse(localStorage.getItem('off_jadwal')) || []);
    setListSakuBatas(JSON.parse(localStorage.getItem('off_sakubatas')) || []);
    setListSakuTagihan(JSON.parse(localStorage.getItem('off_sakutagihan')) || []);
    setListCapaian(JSON.parse(localStorage.getItem('off_capaian')) || []);
  };

  const syncSemuaDataKeCloud = async () => {
    if (!navigator.onLine || !SUPABASE_ANON_KEY) return;
    setLoading(true);
    try {
      const { data: m } = await supabase.from('murid').select('*').order('nama', { ascending: true });
      const { data: a } = await supabase.from('absensi').select('*').order('tanggal', { ascending: false });
      const { data: b } = await supabase.from('batas_mengajar').select('*').order('created_at', { ascending: false });
      const { data: p } = await supabase.from('catatan_perilaku').select('*').order('created_at', { ascending: false });
      const { data: n } = await supabase.from('nilai').select('*').order('created_at', { ascending: false });
      const { data: bs } = await supabase.from('bank_soal').select('*').order('created_at', { ascending: false });
      const { data: jdwl } = await supabase.from('jadwal_mengajar').select('*');
      const { data: skb } = await supabase.from('buku_saku_batas').select('*').order('created_at', { ascending: false });
      const { data: skt } = await supabase.from('buku_saku_tagihan').select('*').order('tanggal', { ascending: true });
      const { data: ch } = await supabase.from('capaian_hafalan').select('*').order('created_at', { ascending: false });

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
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  // === FUNGSI DATA LAMA ===
  const handleSimpanMurid = async (e) => {
    e.preventDefault();
    if (!formMurid.nama || !formMurid.kelas) return alert("Nama dan Kelas wajib diisi!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newMurid = { ...formMurid, id: safeLocalId, ustadz_email: user?.email };
    setMuridList([...muridList, newMurid]);
    setFormMurid({ nama: '', kelas: '', alamat: '', domisili: '' });
    if (checkConnection()) {
      setLoading(true);
      await supabase.from('murid').insert([{ ...newMurid }]);
      setLoading(false);
      syncSemuaDataKeCloud();
    }
  };

  const handleSimpanAbsen = async (muridId, status) => {
    const tanggalHariIni = new Date().toISOString().split('T')[0];
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const absenBaru = { id: safeLocalId, murid_id: muridId, status, tanggal: tanggalHariIni, ustadz_email: user?.email };
    setListAbsensi(prev => [absenBaru, ...prev.filter(a => !(a.murid_id === muridId && a.tanggal === tanggalHariIni))]);
    if (checkConnection()) {
      setLoading(true);
      await supabase.from('absensi').insert([{ murid_id: muridId, status, tanggal: tanggalHariIni, ustadz_email: user?.email }]);
      setLoading(false);
      syncSemuaDataKeCloud();
    }
  };

  const handleSimpanPerilaku = async (e) => {
    e.preventDefault();
    if (!selectedMuridPerilaku?.id || !formPerilaku.catatan) return alert("Tulis catatan perilaku santri terlebih dahulu!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newPrilaku = { id: safeLocalId, murid_id: selectedMuridPerilaku.id, catatan: formPerilaku.catatan, created_at: new Date().toISOString() };
    setListPerilaku([newPrilaku, ...listPerilaku]);
    setFormPerilaku({ ...formPerilaku, catatan: '' });
    alert("Catatan perilaku berhasil ditambahkan!");
    if (checkConnection()) {
      setLoading(true);
      await supabase.from('catatan_perilaku').insert([{ murid_id: newPrilaku.murid_id, catatan: newPrilaku.catatan, ustadz_email: user?.email }]);
      setLoading(false);
      syncSemuaDataKeCloud();
    }
  };

  const handleSimpanNilaiIndividu = async (e) => {
    e.preventDefault();
    if (!formNilai.pelajaran || !formNilai.skor) return alert("Lengkapi Pelajaran dan Skor!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newNilai = { id: safeLocalId, murid_id: selectedMuridNilai.id, jenis_ujian: formNilai.jenis, pelajaran: formNilai.pelajaran, skor: parseInt(formNilai.skor), created_at: new Date().toISOString() };
    setListNilai([newNilai, ...listNilai]);
    setFormNilai({ ...formNilai, skor: '' });
    alert("Nilai berhasil ditambahkan!");
    if (checkConnection()) {
      setLoading(true);
      await supabase.from('nilai').insert([{ murid_id: newNilai.murid_id, jenis_ujian: newNilai.jenis_ujian, pelajaran: newNilai.pelajaran, skor: newNilai.skor, ustadz_email: user?.email }]);
      setLoading(false);
      syncSemuaDataKeCloud();
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
      await supabase.from('bank_soal').insert([{ pelajaran: newSoal.pelajaran, kelas: newSoal.kelas, batasan: newSoal.batasan, isi_soal: newSoal.isi_soal, ustadz_email: user?.email }]);
      setLoading(false);
      syncSemuaDataKeCloud();
    }
  };

  const handleSimpanJadwal = async (e) => {
    e.preventDefault();
    if(!formJadwal.jam_mulai || !formJadwal.kelas || !formJadwal.pelajaran) return alert("Lengkapi form jadwal!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newJadwal = { ...formJadwal, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
    setListJadwal([...listJadwal, newJadwal]);
    setFormJadwal({ hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
    
    if (checkConnection()) {
      setLoading(true);
      await supabase.from('jadwal_mengajar').insert([newJadwal]);
      setLoading(false);
      syncSemuaDataKeCloud();
    }
  };

  const handleHapusJadwal = async (id) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;
    setListJadwal(listJadwal.filter(j => j.id !== id));
    if (checkConnection()) {
      setLoading(true);
      const { error } = await supabase.from('jadwal_mengajar').delete().eq('id', id);
      setLoading(false);
      if (error) {
         alert("Gagal menghapus online. Error: " + error.message);
      } else {
         syncSemuaDataKeCloud();
      }
    }
  };

  const handleSimpanSakuBatas = async (e) => {
    e.preventDefault();
    if(!formSakuBatas.kelas || !formSakuBatas.fan) return alert("Kelas dan Fan wajib diisi!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newSaku = { ...formSakuBatas, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
    setListSakuBatas([newSaku, ...listSakuBatas]);
    setFormSakuBatas({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
    if (checkConnection()) {
      setLoading(true);
      await supabase.from('buku_saku_batas').insert([newSaku]);
      setLoading(false);
      syncSemuaDataKeCloud();
    }
  };

  const handleSimpanSakuTagihan = async (e) => {
    e.preventDefault();
    if(!formSakuTagihan.tanggal || !formSakuTagihan.kelas || !formSakuTagihan.kitab) return alert("Isi form dengan lengkap!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newTagihan = { ...formSakuTagihan, murid_id: formSakuTagihan.murid_id ? parseInt(formSakuTagihan.murid_id) : null, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
    setListSakuTagihan([newTagihan, ...listSakuTagihan]);
    setFormSakuTagihan({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
    if (checkConnection()) {
      setLoading(true);
      await supabase.from('buku_saku_tagihan').insert([newTagihan]);
      setLoading(false);
      syncSemuaDataKeCloud();
    }
  };

  const handleSimpanCapaianHafalan = async (e) => {
    e.preventDefault();
    if(!formCapaian.capaian) return alert("Isi Capaian / Batas Hafalan!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newCapaian = { id: safeLocalId, murid_id: selectedMuridHafalan.id, capaian: formCapaian.capaian, tanggal: formCapaian.tanggal, ustadz_email: user?.email, created_at: new Date().toISOString() };
    setListCapaian([newCapaian, ...listCapaian]);
    setFormCapaian({ ...formCapaian, ...formCapaian, capaian: '' });
    alert("Capaian hafalan ditambahkan!");
    if (checkConnection()) {
      setLoading(true);
      await supabase.from('capaian_hafalan').insert([newCapaian]);
      setLoading(false);
      syncSemuaDataKeCloud();
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
  const namaHariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hariIni = namaHariList[now.getDay()];
  const tanggalHariIniFull = now.toISOString().split('T')[0];
  
  const jadwalHariIni = listJadwal.filter(j => j.hari === hariIni).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
  const waktuKiniStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  const jadwalMendatang = jadwalHariIni.find(j => j.jam_mulai > waktuKiniStr);
  
  let hitungMundurText = "";
  if (jadwalMendatang) {
      const [h, m] = jadwalMendatang.jam_mulai.split(':').map(Number);
      const targetTime = new Date();
      targetTime.setHours(h, m, 0, 0);
      const diffMs = targetTime - now;
      const diffMins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      hitungMundurText = `${hrs > 0 ? hrs + ' Jam ' : ''}${mins} Menit lagi`;
  }

  const peringatanTagihan = listSakuTagihan.filter(t => t.tanggal === tanggalHariIniFull);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200 overflow-hidden pb-36 relative">
      <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-graduation-cap text-lg"></i>
          <h1 className="text-xl font-bold tracking-tight">Buku Ustaz <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full ml-1 font-mono align-top">v5.1</span></h1>
        </div>
        <div className="flex items-center gap-3">
          {deferredPrompt && (
            <button onClick={handleInstallPWA} className="text-[10px] bg-white text-emerald-700 px-2 py-1 rounded font-bold uppercase tracking-wider shadow-sm hover:bg-slate-50">
              <i className="fa-solid fa-download mr-1"></i> Install
            </button>
          )}
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

        {/* TAB 0: JADWAL */}
        {activeTab === 'jadwal' && (
          <div className="space-y-4">
            
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 rounded-2xl shadow-md text-white">
              <p className="text-xs text-emerald-100 font-medium mb-1">Hari ini: {hariIni}</p>
              <h2 className="text-xl font-bold mb-4">
                {jadwalHariIni.length > 0 ? `Anda memiliki ${jadwalHariIni.length} kelas hari ini` : "Tidak ada jadwal kelas hari ini."}
              </h2>
              
              {jadwalMendatang && (
                <div className="bg-white/20 p-3 rounded-xl border border-white/30 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Jadwal Selanjutnya:</p>
                  <p className="text-sm mt-1 flex justify-between">
                     <span><b>{jadwalMendatang.kelas}</b> - {jadwalMendatang.pelajaran}</span>
                     <span className="font-mono bg-white/30 px-2 rounded">{jadwalMendatang.jam_mulai}</span>
                  </p>
                  <div className="mt-2 text-xs bg-emerald-900/40 text-center py-1.5 rounded-lg border border-emerald-500/50">
                    <i className="fa-solid fa-stopwatch mr-1"></i> Mulai dalam: <b>{hitungMundurText}</b>
                  </div>
                </div>
              )}
            </div>

            {peringatanTagihan.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm">
                 <h3 className="text-amber-800 font-bold text-sm mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-bell animate-bounce"></i> Peringatan Hari Ini!
                 </h3>
                 <div className="space-y-2">
                   {peringatanTagihan.map(pt => {
                      const mrd = pt.murid_id ? muridList.find(m => m.id === pt.murid_id)?.nama : "Semua Murid";
                      return (
                        <div key={pt.id} className="bg-white p-2 rounded border border-amber-100 text-xs">
                           <span className="font-bold text-amber-900">{pt.kitab} ({pt.kelas})</span> - {mrd} <br/>
                           <span className="text-slate-600">Target: {pt.target_dari} s/d {pt.target_sampai}</span>
                        </div>
                      )
                   })}
                 </div>
              </div>
            )}

            {/* Input Jadwal */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2">
                <i className="fa-regular fa-calendar-plus"></i> Tambah Jadwal Mengajar Pribadi
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <select className="border p-3 rounded-xl text-sm outline-none focus:ring-2 ring-emerald-500" value={formJadwal.hari} onChange={e => setFormJadwal({...formJadwal, hari: e.target.value})}>
                  {namaHariList.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <input type="time" className="border p-3 rounded-xl text-sm outline-none focus:ring-2 ring-emerald-500" value={formJadwal.jam_mulai} onChange={e => setFormJadwal({...formJadwal, jam_mulai: e.target.value})} />
              </div>
              <input type="text" placeholder="Kelas" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formJadwal.kelas} onChange={e => setFormJadwal({...formJadwal, kelas: e.target.value})} />
              <input type="text" placeholder="Pelajaran / Kitab" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formJadwal.pelajaran} onChange={e => setFormJadwal({...formJadwal, pelajaran: e.target.value})} />
              <button onClick={handleSimpanJadwal} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow hover:bg-emerald-700 transition">
                 Simpan Jadwal
              </button>
            </div>

            {/* Daftar Jadwal & Tombol Hapus */}
            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-3 border-b pb-2">Semua Jadwal Mengajar</h3>
                {namaHariList.map(h => {
                   const jadwalPerHari = listJadwal.filter(j => j.hari === h).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
                   if (jadwalPerHari.length === 0) return null;
                   return (
                     <div key={h} className="mb-4 last:mb-0">
                        <p className="text-xs font-bold bg-slate-100 p-1.5 rounded-md text-slate-600 mb-2">{h}</p>
                        {jadwalPerHari.map(j => (
                           <div key={j.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0 text-sm">
                              <div className="flex-1 flex items-center">
                                <span className="text-emerald-700 font-mono text-xs bg-emerald-50 px-1.5 py-0.5 rounded mr-3">{j.jam_mulai}</span>
                                <span className="text-slate-700 font-medium">{j.pelajaran} <span className="text-xs text-slate-400 font-normal">({j.kelas})</span></span>
                              </div>
                              <button onClick={() => handleHapusJadwal(j.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded bg-red-50 hover:bg-red-100 transition" title="Hapus Jadwal Ini">
                                <i className="fa-solid fa-trash-can text-xs"></i>
                              </button>
                           </div>
                        ))}
                     </div>
                   )
                })}
                {listJadwal.length === 0 && <p className="text-xs text-center text-slate-400 py-2">Belum ada jadwal yang disimpan.</p>}
            </div>
          </div>
        )}
        
        {/* TAB 1: PROFIL & DATABASE MURID */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2 text-emerald-600">
                <i className="fa-solid fa-user-graduate"></i> Profil & Data Base Murid
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
                const absenHariIni = listAbsensi.find(a => a.murid_id === m.id && a.tanggal === tanggalHariIniFull);
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

        {/* TAB 3: BUKU SAKU */}
        {activeTab === 'saku' && (
          <div className="space-y-4">
             <div className="flex bg-slate-200 p-1 rounded-xl">
               <button onClick={() => setBukuSakuTab('batas')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${bukuSakuTab === 'batas' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}>Batas Mengajar</button>
               <button onClick={() => setBukuSakuTab('tagihan')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${bukuSakuTab === 'tagihan' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}>Ulangan/Hafalan</button>
             </div>

             {bukuSakuTab === 'batas' && (
               <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                 <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2"><i className="fa-solid fa-bookmark"></i> Catatan Batas Akhir</h3>
                 <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Kelas" className="border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={formSakuBatas.kelas} onChange={e => setFormSakuBatas({...formSakuBatas, kelas: e.target.value})} />
                    <input type="text" placeholder="Fan / Kitab" className="border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={formSakuBatas.fan} onChange={e => setFormSakuBatas({...formSakuBatas, fan: e.target.value})} />
                 </div>
                 <input type="text" placeholder="Materi Terakhir" className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={formSakuBatas.materi} onChange={e => setFormSakuBatas({...formSakuBatas, materi: e.target.value})} />
                 <input type="text" placeholder="Halaman / Bab" className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={formSakuBatas.halaman} onChange={e => setFormSakuBatas({...formSakuBatas, halaman: e.target.value})} />
                 <input type="text" placeholder="PR / Target Pekan Depan" className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={formSakuBatas.target} onChange={e => setFormSakuBatas({...formSakuBatas, target: e.target.value})} />
                 <textarea placeholder="Catatan Tambahan (Opsional)" className="w-full border rounded-xl p-3 text-sm h-20 outline-none focus:ring-2 ring-emerald-500 resize-none" value={formSakuBatas.catatan} onChange={e => setFormSakuBatas({...formSakuBatas, catatan: e.target.value})}></textarea>
                 
                 <button onClick={handleSimpanSakuBatas} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow flex items-center justify-center gap-2 hover:bg-emerald-700">
                    <i className="fa-solid fa-floppy-disk"></i> Simpan Catatan Batas
                 </button>
               </div>
             )}

             {bukuSakuTab === 'tagihan' && (
               <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                 <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2"><i className="fa-solid fa-list-check"></i> Janji Muhafadhoh / Ulangan</h3>
                 <input type="date" className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500 text-slate-600" value={formSakuTagihan.tanggal} onChange={e => setFormSakuTagihan({...formSakuTagihan, tanggal: e.target.value})} />
                 <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Kelas" className="border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={formSakuTagihan.kelas} onChange={e => setFormSakuTagihan({...formSakuTagihan, kelas: e.target.value})} />
                    <input type="text" placeholder="Kitab/Pelajaran" className="border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={formSakuTagihan.kitab} onChange={e => setFormSakuTagihan({...formSakuTagihan, kitab: e.target.value})} />
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <input type="text" placeholder="Target Dari..." className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={formSakuTagihan.target_dari} onChange={e => setFormSakuTagihan({...formSakuTagihan, target_dari: e.target.value})} />
                    <span className="text-xs text-slate-400 font-bold">S/D</span>
                    <input type="text" placeholder="Sampai..." className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={formSakuTagihan.target_sampai} onChange={e => setFormSakuTagihan({...formSakuTagihan, target_sampai: e.target.value})} />
                 </div>

                 <select className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500" value={formSakuTagihan.murid_id} onChange={e => setFormSakuTagihan({...formSakuTagihan, murid_id: e.target.value})}>
                    <option value="">-- Semua Murid di Kelas Tersebut --</option>
                    {muridList.filter(m => formSakuTagihan.kelas === '' || m.kelas === formSakuTagihan.kelas).map(m => (
                      <option key={m.id} value={m.id}>{m.nama}</option>
                    ))}
                 </select>

                 <button onClick={handleSimpanSakuTagihan} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow flex items-center justify-center gap-2 hover:bg-emerald-700">
                    <i className="fa-solid fa-floppy-disk"></i> Simpan Peringatan Target
                 </button>
               </div>
             )}
          </div>
        )}

        {/* TAB 4: SIKAP / PERILAKU (DENGAN LOGIKA PILIHAN KELAS & MURID SEPERTI MENU NILAI) */}
        {activeTab === 'perilaku' && (
          <div className="space-y-4">
            
            {/* Tahap 1: Pilih Kelas */}
            {!perilakuKelas && (
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2">
                  <i className="fa-solid fa-star-half-stroke"></i> Pilih Kelas (Catatan Perilaku)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {listKelasUnik.map(k => (
                    <button key={k} onClick={() => setPerilakuKelas(k)} className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm hover:bg-emerald-100 transition font-bold text-emerald-700">
                      Kelas {k}
                    </button>
                  ))}
                </div>
                {listKelasUnik.length === 0 && (
                   <p className="text-xs text-center text-slate-400 py-2">Belum ada kelas terdaftar. Tambahkan data murid terlebih dahulu.</p>
                )}
              </div>
            )}

            {/* Tahap 2: Pilih Nama Santri */}
            {perilakuKelas && !selectedMuridPerilaku && (
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Santri Kelas {perilakuKelas}</h3>
                  <button onClick={() => setPerilakuKelas('')} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">Kembali</button>
                </div>
                <div className="space-y-2">
                  {muridList.filter(m => m.kelas === perilakuKelas).map(m => (
                    <button key={m.id} onClick={() => setSelectedMuridPerilaku(m)} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-left flex justify-between items-center hover:border-emerald-400 transition">
                      <div>
                        <span className="font-bold text-slate-700 text-sm block">{m.nama}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          Terakhir: {listPerilaku.find(p => p.murid_id === m.id)?.catatan || 'Belum ada catatan'}
                        </span>
                      </div>
                      <i className="fa-solid fa-chevron-right text-slate-300"></i>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tahap 3: Form Input Catatan Perilaku & Riwayat */}
            {perilakuKelas && selectedMuridPerilaku && (
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Catatan Perilaku <span className="text-emerald-600">{selectedMuridPerilaku.nama}</span></h3>
                  <button onClick={() => setSelectedMuridPerilaku(null)} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">Kembali</button>
                </div>
                
                <div className="space-y-3">
                  <textarea placeholder="Tulis catatan perilaku, kedisiplinan, atau pelanggaran di sini..." className="w-full border rounded-xl p-3 text-sm h-28 focus:ring-2 ring-emerald-500 outline-none resize-none" value={formPerilaku.catatan} onChange={e => setFormPerilaku({...formPerilaku, catatan: e.target.value})}></textarea>
                  <button onClick={handleSimpanPerilaku} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                    <i className="fa-solid fa-floppy-disk"></i> Simpan Catatan Perilaku
                  </button>
                </div>

                {/* Tambahan Sempurna: Riwayat Perilaku Khusus Santri Terpilih */}
                <div className="mt-4 border-t pt-4">
                   <p className="text-xs font-bold text-slate-400 mb-2">Riwayat Catatan</p>
                   <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {listPerilaku.filter(p => p.murid_id === selectedMuridPerilaku.id).map(p => (
                        <div key={p.id} className="bg-slate-50 border p-2 rounded text-xs">
                           <span className="font-bold text-slate-500 text-[10px]">
                             {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : ''}
                           </span><br/>
                           <span className="text-slate-800">{p.catatan}</span>
                        </div>
                      ))}
                      {listPerilaku.filter(p => p.murid_id === selectedMuridPerilaku.id).length === 0 && (
                         <p className="text-[11px] text-slate-400 text-center py-2">Belum ada riwayat catatan perilaku.</p>
                      )}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: NILAI & HAFALAN */}
        {activeTab === 'nilai' && (
          <div className="space-y-4">
             <div className="flex bg-slate-200 p-1 rounded-xl">
               <button onClick={() => setNilaiModeTab('ujian')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${nilaiModeTab === 'ujian' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}>Pencatatan Nilai</button>
               <button onClick={() => setNilaiModeTab('hafalan')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${nilaiModeTab === 'hafalan' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}>Pencapaian Hafalan</button>
             </div>

             {nilaiModeTab === 'ujian' && (
                <div className="space-y-4">
                  {!nilaiKelas && (
                    <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2">
                        <i className="fa-solid fa-file-signature"></i> Pilih Kelas (Nilai)
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {listKelasUnik.map(k => (
                          <button key={k} onClick={() => setNilaiKelas(k)} className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm hover:bg-emerald-100 transition font-bold text-emerald-700">
                            Kelas {k}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {nilaiKelas && !selectedMuridNilai && (
                    <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-bold text-slate-800 text-sm">Santri Kelas {nilaiKelas}</h3>
                        <button onClick={() => setNilaiKelas('')} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">Kembali</button>
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

                  {nilaiKelas && selectedMuridNilai && (
                    <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-bold text-slate-800 text-sm">Input Nilai <span className="text-emerald-600">{selectedMuridNilai.nama}</span></h3>
                        <button onClick={() => setSelectedMuridNilai(null)} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">Kembali</button>
                      </div>
                      
                      <div className="space-y-3">
                        <input type="text" placeholder="Mata Pelajaran / Fan" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formNilai.pelajaran} onChange={e => setFormNilai({...formNilai, pelajaran: e.target.value})} />
                        
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

             {nilaiModeTab === 'hafalan' && (
                <div className="space-y-4">
                   {!hafalanKelas && (
                      <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600 flex items-center gap-2">
                          <i className="fa-solid fa-book-quran"></i> Pilih Kelas (Hafalan)
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {listKelasUnik.map(k => (
                            <button key={k} onClick={() => setHafalanKelas(k)} className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm hover:bg-emerald-100 transition font-bold text-emerald-700">
                              Kelas {k}
                            </button>
                          ))}
                        </div>
                      </div>
                   )}

                   {hafalanKelas && !selectedMuridHafalan && (
                      <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h3 className="font-bold text-slate-800 text-sm">Santri Kelas {hafalanKelas}</h3>
                          <button onClick={() => setHafalanKelas('')} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">Kembali</button>
                        </div>
                        <div className="space-y-2">
                          {muridList.filter(m => m.kelas === hafalanKelas).map(m => (
                            <button key={m.id} onClick={() => setSelectedMuridHafalan(m)} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-left flex justify-between items-center hover:border-emerald-400 transition">
                              <div>
                                <span className="font-bold text-slate-700 text-sm block">{m.nama}</span>
                                <span className="text-[10px] text-slate-400 line-clamp-1">
                                  Terakhir: {listCapaian.find(c => c.murid_id === m.id)?.capaian || 'Belum ada'}
                                </span>
                              </div>
                              <i className="fa-solid fa-chevron-right text-slate-300"></i>
                            </button>
                          ))}
                        </div>
                      </div>
                   )}

                   {hafalanKelas && selectedMuridHafalan && (
                      <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h3 className="font-bold text-slate-800 text-sm">Setoran Hafalan <span className="text-emerald-600">{selectedMuridHafalan.nama}</span></h3>
                          <button onClick={() => setSelectedMuridHafalan(null)} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">Kembali</button>
                        </div>
                        <div className="space-y-3">
                          <input type="date" className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-emerald-500 text-slate-600" value={formCapaian.tanggal} onChange={e => setFormCapaian({...formCapaian, tanggal: e.target.value})} />
                          <textarea placeholder="Capaian setoran hafalan (Contoh: Surat Al-Mulk ayat 1-10)" className="w-full border rounded-xl p-3 text-sm h-20 outline-none focus:ring-2 ring-emerald-500 resize-none" value={formCapaian.capaian} onChange={e => setFormCapaian({...formCapaian, capaian: e.target.value})}></textarea>
                          
                          <button onClick={handleSimpanCapaianHafalan} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow hover:bg-emerald-700 disabled:opacity-50">
                            <i className="fa-solid fa-microphone-lines mr-1"></i> Simpan Setoran
                          </button>
                        </div>

                        <div className="mt-4 border-t pt-4">
                           <p className="text-xs font-bold text-slate-400 mb-2">Riwayat Hafalan</p>
                           <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {listCapaian.filter(c => c.murid_id === selectedMuridHafalan.id).map(c => (
                                 <div key={c.id} className="bg-slate-50 border p-2 rounded text-xs">
                                    <span className="font-bold text-slate-600">{c.tanggal}</span><br/>
                                    <span className="text-slate-800">{c.capaian}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      </div>
                   )}
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
            <textarea placeholder="Tulis butir pertanyaan soal..." className="w-full border rounded-xl p-3 text-sm h-28 resize-none" value={formSoal.isi} onChange={e => setFormSoal({...formSoal, isi: e.target.value})}></textarea>
            <button onClick={handleSimpanSoal} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow hover:bg-emerald-700">Simpan Soal</button>
          </div>
        )}
      </main>

      {/* FOOTER NAVIGASI BAWAH: LABEL DATABASE DIUBAH JADI PROFIL AGAR MUDAH DICARI */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 flex justify-between px-2 py-1.5 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {[
          { id: 'jadwal', icon: 'fa-calendar-day', label: 'Jadwal' },
          { id: 'database', icon: 'fa-users-line', label: 'Profil' },
          { id: 'absen', icon: 'fa-clipboard-user', label: 'Absen' },
          { id: 'saku', icon: 'fa-book-bookmark', label: 'Saku' },
          { id: 'perilaku', icon: 'fa-star-half-stroke', label: 'Sikap' },
          { id: 'nilai', icon: 'fa-file-signature', label: 'Nilai' },
          { id: 'soal', icon: 'fa-folder-open', label: 'Soal' }
        ].map(menu => {
          const isAct = activeTab === menu.id;
          return (
            <button key={menu.id} onClick={() => { setActiveTab(menu.id); setNilaiKelas(''); setSelectedMuridNilai(null); setHafalanKelas(''); setSelectedMuridHafalan(null); setPerilakuKelas(''); setSelectedMuridPerilaku(null); }} className="flex flex-col items-center justify-center outline-none py-1 rounded-lg w-12">
              <i className={`fa-solid ${menu.icon} text-[18px] mb-1 transition-transform ${isAct ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}></i>
              <span className={`text-[8px] font-extrabold ${isAct ? 'text-emerald-700' : 'text-slate-500'}`}>{menu.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}