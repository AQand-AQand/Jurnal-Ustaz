import React, { useState, useEffect } from 'react'; // [cite: 90]
import { createClient } from '@supabase/supabase-js'; // [cite: 90]
import jsPDF from 'jspdf'; // [cite: 90]
import 'jspdf-autotable'; // [cite: 90]

// === CONFIG & INITIALIZATION ===
const SUPABASE_URL = "https://gjfdxqhwwytcgylokksq.supabase.co"; // [cite: 91]
const SUPABASE_ANON_KEY = "sb_publishable_1SSrr1ebYfBvZ7V60egzfg__Q_wz_Pm"; // [cite: 91]
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // [cite: 91]

export default function App() { // [cite: 92]
  // --- CORE & AUTH STATE ---
  const [user, setUser] = useState(null); // [cite: 92]
  const [authEmail, setAuthEmail] = useState(''); // [cite: 92]
  const [authPassword, setAuthPassword] = useState(''); // [cite: 93]
  const [activeTab, setActiveTab] = useState('absen'); // [cite: 93]
  const [loading, setLoading] = useState(false); // [cite: 114]
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // [cite: 93]
  const [deferredPrompt, setDeferredPrompt] = useState(null); // [cite: 94]
  const [now, setNow] = useState(new Date()); // [cite: 94]

  // --- DATABASE DATA STATE ---
  const [muridList, setMuridList] = useState([]); // [cite: 95]
  const [listAbsensi, setListAbsensi] = useState([]); // [cite: 95]
  const [listPerilaku, setListPerilaku] = useState([]); // [cite: 96]
  const [listNilai, setListNilai] = useState([]); // [cite: 96]
  const [listBankSoal, setListBankSoal] = useState([]); // [cite: 96]
  const [listJadwal, setListJadwal] = useState([]); // [cite: 96]
  const [listSakuBatas, setListSakuBatas] = useState([]); // [cite: 97]
  
  // (Data Baru yang Diperluas untuk Menu Saku & Papan Pengumuman)
  const [listMuhafadhoh, setListMuhafadhoh] = useState([]);
  const [listCatatanLain, setListCatatanLain] = useState([]);
  const [listJanjiUlangan, setListJanjiUlangan] = useState([]);

  // --- UI & TAB CONTROL STATE ---
  const [absenTab, setAbsenTab] = useState('harian'); // [cite: 97]
  const [soalTab, setSoalTab] = useState('arsip'); // [cite: 98]
  const [sakuTab, setSakuTab] = useState('batas'); 
  const [nilaiTab, setNilaiTab] = useState('input');

  // --- FORM & FIELD STATES (MODERNIZED DATA STRUCTURE) ---
  const [formMurid, setFormMurid] = useState({ id: null, nama: '', kelas: '', alamat: '', domisili: '' }); // [cite: 98]
  const [formJadwal, setFormJadwal] = useState({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' }); // [cite: 101]
  const [editingJadwalId, setEditingJadwalId] = useState(null); // Mode edit jadwal
  
  const [formSakuBatas, setFormSakuBatas] = useState({ kelas: '', pelajaran: '', bab_terakhir: '', halaman_terakhir: '', catatan: '' });
  const [formMuhafadhoh, setFormMuhafadhoh] = useState({ tanggal_janji: '', kelas: '', materi: '', target: '', catatan_belum_hafal: '' });
  const [formCatatanLain, setFormCatatanLain] = useState({ id: null, isi: '' });

  const [formPerilaku, setFormPerilaku] = useState({ murid_id: '', kelas: '', catatan: '' }); 
  const [formNilaiMatrix, setFormNilaiMatrix] = useState({}); // Menyimpan input nilai spreadsheet massal
  const [formNilaiConfig, setFormNilaiConfig] = useState({ pelajaran: '', jenis: 'Ulangan' });
  const [formSoal, setFormSoal] = useState({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' }); // [cite: 100]
  const [editingSoalId, setEditingSoalId] = useState(null); // Mode edit soal

  // --- FILTER & REPORT VIEW STATES ---
  const [filterKelasAbsen, setFilterKelasAbsen] = useState(''); // [cite: 104]
  const [draftAbsen, setDraftAbsen] = useState({}); // [cite: 104]
  const [absenBulan, setAbsenBulan] = useState(new Date().toISOString().slice(0, 7)); // [cite: 105]
  const [absenTahun, setAbsenTahun] = useState(new Date().getFullYear().toString());
  const [absenKelasBulanan, setAbsenKelasBulanan] = useState(''); // [cite: 105]
  const [absenRekapType, setAbsenRekapType] = useState('bulanan'); // bulanan / tahunan

  const [filterKelasSikap, setFilterKelasSikap] = useState('');
  const [filterKelasNilai, setFilterKelasNilai] = useState('');
  const [selectedMuridRapor, setSelectedMuridRapor] = useState(null); // null berarti rekap persentase kelas

  // === SYSTEM EFFECTS (OFFLINE RECOVERY & CLOUD SYNC) ===
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null)); // [cite: 107]
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null)); // [cite: 107]
    
    // Sinkronisasi data awal dari LocalStorage ke State Aplikasi [cite: 107]
    setMuridList(JSON.parse(localStorage.getItem('off_murid')) || []); // [cite: 107]
    setListAbsensi(JSON.parse(localStorage.getItem('off_absen')) || []); // [cite: 107]
    setListPerilaku(JSON.parse(localStorage.getItem('off_perilaku')) || []); // [cite: 107]
    setListNilai(JSON.parse(localStorage.getItem('off_nilai')) || []); // [cite: 107]
    setListBankSoal(JSON.parse(localStorage.getItem('off_soal')) || []); // [cite: 107]
    setListJadwal(JSON.parse(localStorage.getItem('off_jadwal')) || []); // [cite: 107]
    setListSakuBatas(JSON.parse(localStorage.getItem('off_sakubatas')) || []); // [cite: 107]
    setListMuhafadhoh(JSON.parse(localStorage.getItem('off_muhafadhoh')) || []);
    setListCatatanLain(JSON.parse(localStorage.getItem('off_catatanlain')) || []);
    setListJanjiUlangan(JSON.parse(localStorage.getItem('off_janjiulangan')) || []);

    const handleOnline = () => setIsOffline(false); // [cite: 107]
    const handleOffline = () => setIsOffline(true); // [cite: 107, 108]
    window.addEventListener('online', handleOnline); // [cite: 108]
    window.addEventListener('offline', handleOffline); // [cite: 108]
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); }); // [cite: 108, 109]

    const timer = setInterval(() => setNow(new Date()), 1000); // Dipercepat ke 1 detik untuk kalkulasi countdown realtime
    return () => { 
      subscription.unsubscribe(); // [cite: 109]
      window.removeEventListener('online', handleOnline); // [cite: 109]
      window.removeEventListener('offline', handleOffline); // [cite: 109]
      clearInterval(timer); // [cite: 109]
    };
  }, []);

  // Simpan Otomatis State ke LocalStorage saat Berubah (Mendukung Fitur Offline 100%) [cite: 111]
  useEffect(() => {
    localStorage.setItem('off_murid', JSON.stringify(muridList)); // [cite: 111]
    localStorage.setItem('off_absen', JSON.stringify(listAbsensi)); // [cite: 111]
    localStorage.setItem('off_perilaku', JSON.stringify(listPerilaku)); // [cite: 111]
    localStorage.setItem('off_nilai', JSON.stringify(listNilai)); // [cite: 111]
    localStorage.setItem('off_soal', JSON.stringify(listBankSoal)); // [cite: 111]
    localStorage.setItem('off_jadwal', JSON.stringify(listJadwal)); // [cite: 111]
    localStorage.setItem('off_sakubatas', JSON.stringify(listSakuBatas)); // [cite: 111]
    localStorage.setItem('off_muhafadhoh', JSON.stringify(listMuhafadhoh));
    localStorage.setItem('off_catatanlain', JSON.stringify(listCatatanLain));
    localStorage.setItem('off_janjiulangan', JSON.stringify(listJanjiUlangan));
  }, [muridList, listAbsensi, listPerilaku, listNilai, listBankSoal, listJadwal, listSakuBatas, listMuhafadhoh, listCatatanLain, listJanjiUlangan]); // [cite: 111]

  useEffect(() => { if (user && !isOffline) syncSemuaDataKeCloud(); }, [user, isOffline]); // [cite: 110]

  // Sinkronisasi data dengan Cloud Supabase Database [cite: 113]
  const syncSemuaDataKeCloud = async () => {
    if (!navigator.onLine || !SUPABASE_ANON_KEY) return; // [cite: 113]
    setLoading(true); // [cite: 114]
    try {
      const { data: m } = await supabase.from('murid').select('*').order('nama', { ascending: true }); // [cite: 114]
      const { data: a } = await supabase.from('absensi').select('*').order('tanggal', { ascending: false }); // [cite: 115]
      const { data: p } = await supabase.from('catatan_perilaku').select('*').order('created_at', { ascending: false }); // [cite: 116]
      const { data: n } = await supabase.from('nilai').select('*').order('created_at', { ascending: false }); // [cite: 117]
      const { data: bs } = await supabase.from('bank_soal').select('*').order('created_at', { ascending: false }); // [cite: 118]
      const { data: jdwl } = await supabase.from('jadwal_mengajar').select('*'); // [cite: 118]
      const { data: skb } = await supabase.from('buku_saku_batas').select('*').order('created_at', { ascending: false }); // [cite: 119]
      const { data: mhf } = await supabase.from('muhafadhoh').select('*').order('tanggal_janji', { ascending: true });
      const { data: ctl } = await supabase.from('catatan_lain').select('*').order('created_at', { ascending: false });

      if (m) setMuridList(m); // [cite: 119]
      if (a) setListAbsensi(a); // [cite: 119]
      if (p) setListPerilaku(p); // [cite: 120]
      if (n) setListNilai(n); // [cite: 120]
      if (bs) setListBankSoal(bs); // [cite: 120]
      if (jdwl) setListJadwal(jdwl); // [cite: 120]
      if (skb) setListSakuBatas(skb); // [cite: 120]
      if (mhf) setListMuhafadhoh(mhf);
      if (ctl) setListCatatanLain(ctl);
      
      // Ekstrak otomatis janji ulangan dari bank soal yang memiliki batasan info
      if (bs) {
        const janji = bs.filter(s => s.batasan).map(s => ({ id: s.id, kelas: s.kelas, keterangan: `Ulangan/Ujian ${s.pelajaran}: ${s.batasan}` }));
        setListJanjiUlangan(janji);
      }
    } catch (err) { 
      console.log(err); // [cite: 120]
    } finally { 
      setLoading(false); // [cite: 121]
    }
  };

  const checkConnection = () => { 
    if (isOffline || !SUPABASE_ANON_KEY) { // [cite: 121]
      return false; // [cite: 122]
    } 
    return true; // [cite: 122]
  };

  // --- GLOBAL EXPORT LOGIC UTILITIES ---
  const generatePDF = (title, headers, body, extraInfo = []) => { // [cite: 122]
    const doc = new jsPDF(); // [cite: 122]
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18); doc.setTextColor(5, 150, 105); doc.text(title, 14, 20); // [cite: 123]
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10); doc.setTextColor(100, 116, 139); // [cite: 123]
    let startY = 28; // [cite: 123]
    extraInfo.forEach((info) => { doc.text(info, 14, startY); startY += 6; }); // [cite: 124]
    doc.autoTable({  // [cite: 125]
      startY: startY + 4,  // [cite: 125]
      head: [headers],  // [cite: 125]
      body: body,  // [cite: 125]
      theme: 'grid',  // [cite: 125]
      headStyles: { fillColor: [5, 150, 105], fontSize: 10, fontStyle: 'bold', halign: 'center' },  // [cite: 125]
      styles: { fontSize: 9, font: "Helvetica", textColor: [51, 65, 85] },  // [cite: 125]
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    doc.save(`${title.replace(/ /g, '_')}.pdf`); // [cite: 126]
  };

  const shareWA = (text) => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`); // [cite: 128]
  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))].sort(); // [cite: 146]

  // Abaikan sisa render UI asli di bawah ini terlebih dahulu (Akan dikirim di Bagian 2)
  // Untuk menjaga kestabilan editor, kita tutup kurung penutup komponen secara sintaksis di file akhir nanti.
  
  // === AUTHENTICATION & PWA HANDLERS ===
  const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
  const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
  if (error) throw error;
  } catch (err) {
  alert("Gagal Masuk: " + err.message);
  } finally {
  setLoading(false);
  }
  };
  
  const handleRegister = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
  const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
  if (error) throw error;
  alert("Pendaftaran Berhasil! Silakan periksa email masuk Anda untuk konfirmasi pendaftaran.");
  } catch (err) {
  alert("Gagal Daftar: " + err.message);
  } finally {
  setLoading(false);
  }
  };
  
  const handleLogout = async () => {
  if (!window.confirm("Apakah Anda yakin ingin keluar dari aplikasi?")) return;
  setLoading(true);
  await supabase.auth.signOut();
  setLoading(false);
  };
  
  const handleInstallPWA = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
  setDeferredPrompt(null);
  }
  };
  
  
  // =========================================================
  // === CORE RENDER CONTAINER & APPLICATION LAYOUT SHELL ===
  // =========================================================
  return (
  <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased selection:bg-emerald-500 selection:text-white">
  
  {/* 1. GLOBAL PREMIUM LOADING SPINNER */}
  {loading && (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
  <div className="relative flex items-center justify-center">
  <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-lg"></div>
  <i className="fa-solid fa-book-quran text-emerald-500 absolute animate-pulse"></i>
  </div>
  <p className="mt-4 text-sm font-semibold text-white tracking-wide animate-pulse">Memproses data ustaz...</p>
  </div>
  )}
  
  {/* 2. MODERN AUTHENTICATION VIEW (IF NOT LOGGED IN) */}
  {!user ? (
  <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-tr from-emerald-900 via-emerald-800 to-teal-950">
  <div className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 transition-all">
  <div className="text-center">
  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-md transform hover:rotate-6 transition-transform">
  <i className="fa-solid fa-graduation-cap text-3xl"></i>
  </div>
  <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">Ahlan wa Sahlan</h2>
  <p className="mt-2 text-xs text-slate-500 font-medium tracking-wide">
  Aplikasi <span className="text-emerald-600 font-bold">Buku Ustaz Digital</span> • Manajemen Kelas Modern
  </p>
  </div>
  
  <form className="mt-8 space-y-5" onSubmit={handleLogin}>
  <div className="space-y-4 rounded-md">
  <div>
  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Akun Ustaz</label>
  <div className="relative">
  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
  <i className="fa-solid fa-envelope text-xs"></i>
  </span>
  <input
  type="email"
  required
  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
  placeholder="ustaz.mengajar@pesantren.com"
  value={authEmail}
  onChange={(e) => setAuthEmail(e.target.value)}
  />
  </div>
  </div>
  
  <div>
  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Kata Sandi</label>
  <div className="relative">
  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
  <i className="fa-solid fa-lock text-xs"></i>
  </span>
  <input
  type="password"
  required
  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
  placeholder="••••••••"
  value={authPassword}
  onChange={(e) => setAuthPassword(e.target.value)}
  />
  </div>
  </div>
  </div>
  
  <div className="grid grid-cols-2 gap-4 pt-2">
  <button
  type="submit"
  className="flex w-full justify-center items-center rounded-xl bg-emerald-600 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.97] transition-all duration-150"
  >
  <i className="fa-solid fa-right-to-bracket mr-2 text-xs"></i> Masuk
  </button>
  <button
  type="button"
  onClick={handleRegister}
  className="flex w-full justify-center items-center rounded-xl bg-slate-100 border border-slate-200 py-3 px-4 text-sm font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.97] transition-all duration-150"
  >
  <i className="fa-solid fa-user-plus mr-2 text-xs"></i> Daftar Baru
  </button>
  </div>
  </form>
  
  <div className="text-center pt-2 border-t border-slate-100">
  <p className="text-[10px] text-slate-400">
  Mendukung penyimpanan offline otomatis (PWA) jika jaringan terputus.
  </p>
  </div>
  </div>
  </div>
  ) : (
  
  /* 3. MAIN APP SHELL WORKSPACE CONTAINER */
  <div className="pb-28 pt-16 max-w-md mx-auto bg-slate-50 min-h-screen shadow-2xl relative border-x border-slate-200/60">
  
  {/* STICKY TOP HEADER BAR */}
  <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/60 z-50 max-w-md mx-auto px-4 flex items-center justify-between shadow-sm">
  <div className="flex items-center space-x-3">
  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
  <i className="fa-solid fa-book-open-reader text-sm"></i>
  </div>
  <div>
  <h1 className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">Buku Ustaz</h1>
  <p className="text-[10px] mt-1 font-semibold">
  {isOffline ? (
  <span className="flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/40">
  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5"></span> Mode Offline
  </span>
  ) : (
  <span className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/40">
  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span> Sinkron Cloud
  </span>
  )}
  </p>
  </div>
  </div>
  
  <div className="flex items-center space-x-2">
  <button 
  onClick={syncSemuaDataKeCloud}
  title="Sinkronisasi Awan"
  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
  >
  <i className="fa-solid fa-arrows-rotate text-sm"></i>
  </button>
  <button
  onClick={handleLogout}
  className="flex items-center justify-center h-9 px-3 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all active:scale-95"
  >
  <i className="fa-solid fa-power-off mr-1.5"></i> Keluar
  </button>
  </div>
  </header>
  
  {/* APP INSTALL APP BANNER */}
  {deferredPrompt && (
  <div className="mx-4 mt-4 p-3.5 bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl text-white shadow-xl flex items-center justify-between transform transition-all duration-300">
  <div className="flex items-center space-x-3">
  <div className="p-2 bg-white/10 rounded-xl">
  <i className="fa-solid fa-mobile-screen text-lg"></i>
  </div>
  <div>
  <h4 className="text-xs font-bold leading-tight">Pasang Aplikasi di HP</h4>
  <p className="text-[10px] opacity-80 mt-0.5">Ringan, cepat, & tanpa kuota internet</p>
  </div>
  </div>
  <button
  onClick={handleInstallPWA}
  className="bg-white text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-black shadow-md hover:bg-slate-50 active:scale-95 transition-all"
  >
  INSTALL
  </button>
  </div>
  )}
  
  {/* MAIN CONTAINER VIEWPORT FOR ACTIVE TABS */}
  <main className="p-4 transition-all duration-300">
  {/* Slot konten per tab diletakkan di bawah baris ini */}
  
  {/* === TAB 1: MENU JADWAL & PAPAN PENGUMUMAN MODERN === */}
  {activeTab === 'jadwal' && (() => {
  // --- Logika Kalkulasi Papan Pengumuman Real-time ---
  const listNamaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hariIniIndo = listNamaHari[now.getDay()];
  const jamMenitDetikSekarang = now.toTimeString().slice(0, 8); // Format "HH:mm:ss"
  
  // Ambil jadwal mengajar hari ini, urutkan berdasarkan jam mulai terawal
  const jadwalHariIni = listJadwal
  .filter(j => j.hari === hariIniIndo)
  .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
  
  // Cari kelas terdekat yang akan masuk berikutnya pada hari ini
  const kelasBerikutnya = jadwalHariIni.find(j => (j.jam_mulai + ":00") > jamMenitDetikSekarang);
  
  let teksHitungMundur = "Tidak ada jadwal kelas tersisa untuk hari ini.";
  let statusCountdownAktif = false;
  
  if (kelasBerikutnya) {
  const [jamTarget, menitTarget] = kelasBerikutnya.jam_mulai.split(':').map(Number);
  const objekWaktuTarget = new Date(now);
  objekWaktuTarget.setHours(jamTarget, menitTarget, 0, 0);
  
  const selisihMilidetik = objekWaktuTarget - now;
  if (selisihMilidetik > 0) {
  statusCountdownAktif = true;
  const totalDetik = Math.floor(selisihMilidetik / 1000);
  const jamSisa = Math.floor(totalDetik / 3600);
  const menitSisa = Math.floor((totalDetik % 3600) / 60);
  const detikSisa = totalDetik % 60;
  
  teksHitungMundur = `${jamSisa.toString().padStart(2, '0')}:${menitSisa.toString().padStart(2, '0')}:${detikSisa.toString().padStart(2, '0')}`;
  }
  }
  
  // Pengendali Aksi Simpan & Pembaruan (Edit) Jadwal
  const eksekusiSimpanJadwal = async (e) => {
  e.preventDefault();
  if (!formJadwal.jam_mulai || !formJadwal.kelas || !formJadwal.pelajaran) {
  return alert("Harap lengkapi seluruh kolom formulir jadwal!");
  }
  
  setLoading(true);
  try {
  if (editingJadwalId) {
  // Skenario Mode Edit Data
  const daftarJadwalDiperbarui = listJadwal.map(j => 
  j.id === editingJadwalId ? { ...j, ...formJadwal } : j
  );
  setListJadwal(daftarJadwalDiperbarui);
  
  if (checkConnection()) {
  await supabase.from('jadwal_mengajar').update(formJadwal).eq('id', editingJadwalId);
  }
  alert("Jadwal berhasil diperbarui!");
  setEditingJadwalId(null);
  } else {
  // Skenario Tambah Data Baru
  const idBaru = Math.floor(Math.random() * 1000000);
  const itemJadwalBaru = { 
  ...formJadwal, 
  id: idBaru, 
  ustadz_email: user?.email 
  };
  setListJadwal([...listJadwal, itemJadwalBaru]);
  
  if (checkConnection()) {
  await supabase.from('jadwal_mengajar').insert([itemJadwalBaru]);
  }
  alert("Jadwal mengajar baru berhasil ditambahkan!");
  }
  
  // Reset Formulir & UI
  setFormJadwal({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  setShowTambahJadwal(false);
  } catch (err) {
  console.error(err);
  } finally {
  setLoading(false);
  }
  };
  
  const pemicuEditJadwal = (jadwal) => {
  setEditingJadwalId(jadwal.id);
  setFormJadwal({
  hari: jadwal.hari,
  jam_mulai: jadwal.jam_mulai,
  kelas: jadwal.kelas,
  pelajaran: jadwal.pelajaran
  });
  setShowTambahJadwal(true);
  window.scrollTo({ top: 100, behavior: 'smooth' });
  };
  
  const eksekusiHapusJadwal = async (id) => {
  if (!window.confirm("Apakah ustadz yakin ingin menghapus jadwal mengajar ini?")) return;
  setLoading(true);
  try {
  setListJadwal(listJadwal.filter(j => j.id !== id));
  if (checkConnection()) {
  await supabase.from('jadwal_mengajar').delete().eq('id', id);
  }
  alert("Jadwal terhapus.");
  } catch (err) {
  console.error(err);
  } finally {
  setLoading(false);
  }
  };
  
  return (
  <div className="space-y-6 animate-fadeIn">
  
  {/* ====== SECTION A, B, C: PAPAN PENGUMUMAN DIGITAL PREMIUM ====== */}
  <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden border border-emerald-500/20">
  <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
  <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
  
  {/* Header Papan */}
  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
  <div className="flex items-center space-x-2">
  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
  <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase">Papan Pengumuman Ustaz</h3>
  </div>
  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-slate-300">
  {hariIniIndo}, {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
  </span>
  </div>
  
  {/* ITEM A: Sapaan Modern & Status Mengajar Hari Ini */}
  <div className="space-y-1 mb-4">
  <p className="text-sm font-medium text-slate-300">Ahlan ustaz,</p>
  {jadwalHariIni.length > 0 ? (
  <div className="text-xs text-emerald-100/90 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
  Anda hari ini memiliki <span className="text-emerald-400 font-bold">{jadwalHariIni.length} jadwal</span> mengajar. 
  Kelas terdekat adalah <span className="text-white font-bold">Fan {jadwalHariIni[0].pelajaran}</span> di <span className="text-white font-bold">Kelas {jadwalHariIni[0].kelas}</span>.
  </div>
  ) : (
  <p className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
  Alhamdulillah, Anda tidak memiliki jadwal mengajar formal pada hari ini.
  </p>
  )}
  </div>
  
  {/* ITEM B: Countdown Masuk Kelas Interaktif */}
  <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 flex items-center justify-between mb-4">
  <div>
  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hitung Mundur Kelas</h4>
  <p className="text-[11px] font-semibold text-slate-200 mt-0.5">
  {kelasBerikutnya ? `Masuk Kelas ${kelasBerikutnya.kelas} (${kelasBerikutnya.pelajaran})` : 'Jadwal Selesai'}
  </p>
  </div>
  <div className="text-right">
  {statusCountdownAktif ? (
  <span className="font-mono text-xl font-black tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/30 shadow-inner">
  {teksHitungMundur}
  </span>
  ) : (
  <span className="text-xs text-slate-400 font-medium italic">{teksHitungMundur}</span>
  )}
  </div>
  </div>
  
  {/* ITEM C: Memo Janji Ulangan & Agenda Penting */}
  <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
  <h4 className="text-[10px] font-black uppercase tracking-wider text-teal-400 mb-2 flex items-center">
  <i className="fa-solid fa-bell mr-1.5 text-xs"></i> Janji Ulangan & Agenda Kelas
  </h4>
  {listJanjiUlangan.length > 0 ? (
  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
  {listJanjiUlangan.map((agenda, index) => (
  <div key={index} className="flex items-start text-[11px] space-x-2 text-slate-200 bg-black/20 p-1.5 rounded-lg">
  <i className="fa-solid fa-circle-exclamation text-amber-400 mt-0.5 text-[9px]"></i>
  <span><strong className="text-amber-400">[Kls {agenda.kelas}]</strong> {agenda.keterangan}</span>
  </div>
  ))}
  </div>
  ) : (
  <p className="text-[10px] text-slate-400 italic">Belum ada agenda ulangan atau catatan khusus terdekat.</p>
  )}
  </div>
  </div>
  
  {/* ====== BAGIAN JADWAL UTAMA: LIST DATA & CRUD FORM ====== */}
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60">
  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
  <div>
  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Daftar Jadwal Mengajar</h3>
  <p className="text-[10px] text-slate-400 font-medium">Atur jam tatap muka kurikulum madrasah</p>
  </div>
  <button
  onClick={() => {
  setEditingJadwalId(null);
  setFormJadwal({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  setShowTambahJadwal(!showTambahJadwal);
  }}
  className={`flex items-center space-x-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all active:scale-95 ${
  showTambahJadwal && !editingJadwalId
  ? 'bg-slate-100 text-slate-600'
  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
  }`}
  >
  <i className={`fa-solid ${showTambahJadwal && !editingJadwalId ? 'fa-xmark' : 'fa-plus'}`}></i>
  <span>{showTambahJadwal && !editingJadwalId ? 'Tutup' : 'Tambah'}</span>
  </button>
  </div>
  
  {/* Formulir Tambah/Edit Jadwal Modern */}
  {showTambahJadwal && (
  <form onSubmit={eksekusiSimpanJadwal} className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl mb-5 space-y-3 shadow-inner animate-slideDown">
  <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
  <h4 className="text-xs font-black text-slate-700 uppercase">
  {editingJadwalId ? '📝 Edit Formulir Jadwal' : '✨ Formulir Jadwal Baru'}
  </h4>
  {editingJadwalId && (
  <button 
  type="button" 
  onClick={() => {
  setEditingJadwalId(null);
  setFormJadwal({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  setShowTambahJadwal(false);
  }}
  className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold"
  >
  Batal Edit
  </button>
  )}
  </div>
  
  <div className="grid grid-cols-2 gap-3">
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hari</label>
  <select 
  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={formJadwal.hari} 
  onChange={e => setFormJadwal({ ...formJadwal, hari: e.target.value })}
  >
  {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map(h => <option key={h} value={h}>{h}</option>)}
  </select>
  </div>
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jam Mulai</label>
  <input 
  type="time" 
  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={formJadwal.jam_mulai} 
  onChange={e => setFormJadwal({ ...formJadwal, jam_mulai: e.target.value })}
  />
  </div>
  </div>
  
  <div className="grid grid-cols-3 gap-3">
  <div className="col-span-1">
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kelas</label>
  <input 
  type="text" 
  placeholder="Ex: 3-A"
  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={formJadwal.kelas} 
  onChange={e => setFormJadwal({ ...formJadwal, kelas: e.target.value })}
  />
  </div>
  <div className="col-span-2">
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Pelajaran / Fan Kitab</label>
  <input 
  type="text" 
  placeholder="Ex: Jurumiyah"
  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={formJadwal.pelajaran} 
  onChange={e => setFormJadwal({ ...formJadwal, pelajaran: e.target.value })}
  />
  </div>
  </div>
  
  <button 
  type="submit" 
  className="w-full bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-md shadow-emerald-600/10 hover:bg-emerald-700 transition-all active:scale-95"
  >
  {editingJadwalId ? 'Perbarui Jadwal Mengajar' : 'Simpan Jadwal Mengajar'}
  </button>
  </form>
  )}
  
  {/* Rendering Elegan List Jadwal Mingguan */}
  <div className="space-y-4">
  {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map(hari => {
  const jadwalHariTertentu = listJadwal
  .filter(j => j.hari === hari)
  .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
  
  if (jadwalHariTertentu.length === 0) return null;
  
  return (
  <div key={hari} className="border border-slate-100 rounded-2xl bg-slate-50/50 p-3 shadow-sm">
  <h4 className="text-xs font-black text-slate-700 border-b border-slate-200/50 pb-1.5 mb-2.5 flex items-center justify-between">
  <span>📅 Hari {hari}</span>
  <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">{jadwalHariTertentu.length} Sesi</span>
  </h4>
  
  <div className="space-y-2">
  {jadwalHariTertentu.map(j => (
  <div key={j.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-xs hover:border-emerald-300 transition-all">
  <div className="flex items-center space-x-3">
  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono text-xs font-bold border border-emerald-100">
  {j.jam_mulai}
  </div>
  <div>
  <h5 className="text-xs font-extrabold text-slate-800 leading-tight">{j.pelajaran}</h5>
  <p className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5 tracking-wide">KELAS {j.kelas}</p>
  </div>
  </div>
  
  <div className="flex items-center space-x-1">
  <button 
  onClick={() => pemicuEditJadwal(j)}
  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
  title="Edit Jadwal"
  >
  <i className="fa-solid fa-pen-to-square text-xs"></i>
  </button>
  <button 
  onClick={() => eksekusiHapusJadwal(j.id)}
  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
  title="Hapus Jadwal"
  >
  <i className="fa-solid fa-trash-can text-xs"></i>
  </button>
  </div>
  </div>
  ))}
  </div>
  </div>
  );
  })}
  
  {listJadwal.length === 0 && (
  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
  <i className="fa-solid fa-calendar-xmark text-2xl opacity-60 mb-2 block"></i>
  <p className="text-xs font-semibold">Ustadz belum menyusun jadwal mengajar.</p>
  <p className="text-[10px] opacity-80 mt-0.5">Tekan tombol + Tambah di atas untuk memulai.</p>
  </div>
  )}
  </div>
  </div>
  </div>
  );
  })()}
  
  {/* === TAB 2: MENU SANTRI (DATABASE MURID MODERN) === */}
  {activeTab === 'santri' && (() => {
  // --- Handler Simpan & Hapus Data Murid ---
  const eksekusiSimpanMurid = async (e) => {
  e.preventDefault();
  if (!formMurid.nama || !formMurid.kelas) {
  return alert("Nama dan Kelas wajib diisi!");
  }
  
  setLoading(true);
  try {
  const idBaru = Math.floor(Math.random() * 1000000);
  const dataMuridBaru = {
  id: idBaru,
  nama: formMurid.nama,
  kelas: formMurid.kelas,
  alamat: formMurid.alamat || '-',
  domisili: formMurid.domisili || '-',
  ustadz_email: user?.email
  };
  
  // Mengurutkan ulang list santri secara alfabetis setelah ditambah
  setMuridList(prev => [...prev, dataMuridBaru].sort((a, b) => a.nama.localeCompare(b.nama)));
  
  if (checkConnection()) {
  await supabase.from('murid').insert([dataMuridBaru]);
  }
  
  alert("Alhamdulillah, data santri berhasil ditambahkan!");
  // Reset form & tutup panel
  setFormMurid({ id: null, nama: '', kelas: '', alamat: '', domisili: '', _showForm: false });
  } catch (err) {
  console.error(err);
  alert("Terjadi kesalahan saat menyimpan data.");
  } finally {
  setLoading(false);
  }
  };
  
  const eksekusiHapusMurid = async (id, nama) => {
  if (!window.confirm(`Yakin ingin menghapus santri bernama ${nama}? Catatan absensi dan nilainya mungkin akan menjadi yatim (tanpa identitas) jika ikut terhapus.`)) return;
  
  setLoading(true);
  try {
  setMuridList(muridList.filter(m => m.id !== id));
  if (checkConnection()) {
  await supabase.from('murid').delete().eq('id', id);
  }
  } catch (e) {
  console.error(e);
  } finally {
  setLoading(false);
  }
  };
  
  // Mengekstrak daftar kelas yang tersedia dari seluruh data murid
  const kelasTersedia = [...new Set(muridList.map(m => m.kelas))].sort();
  
  return (
  <div className="space-y-6 animate-fadeIn">
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60">
  
  {/* Header Modul & Tombol Aksi */}
  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
  <div>
  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Data Base Santri</h3>
  <p className="text-[10px] text-slate-400 font-medium">Manajemen data murid per kelas</p>
  </div>
  <button
  onClick={() => setFormMurid(prev => ({ ...prev, _showForm: !prev._showForm }))}
  className={`flex items-center space-x-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all active:scale-95 ${
  formMurid._showForm
  ? 'bg-slate-100 text-slate-600'
  : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
  }`}
  >
  <i className={`fa-solid ${formMurid._showForm ? 'fa-xmark' : 'fa-user-plus'}`}></i>
  <span>{formMurid._showForm ? 'Tutup' : 'Tambah'}</span>
  </button>
  </div>
  
  {/* Formulir Registrasi Santri Baru Modern */}
  {formMurid._showForm && (
  <form onSubmit={eksekusiSimpanMurid} className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl mb-5 space-y-3 shadow-inner animate-slideDown">
  <h4 className="text-xs font-black text-slate-700 uppercase border-b border-slate-200/50 pb-2 mb-2">
  ✨ Registrasi Santri Baru
  </h4>
  
  <div className="grid grid-cols-3 gap-3">
  <div className="col-span-2">
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
  <input 
  type="text" 
  required
  placeholder="Ex: Ahmad Fulan"
  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={formMurid.nama} 
  onChange={e => setFormMurid({ ...formMurid, nama: e.target.value })}
  />
  </div>
  <div className="col-span-1">
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kelas</label>
  <input 
  type="text" 
  required
  placeholder="Ex: 3-A"
  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={formMurid.kelas} 
  onChange={e => setFormMurid({ ...formMurid, kelas: e.target.value })}
  />
  </div>
  </div>
  
  <div className="grid grid-cols-2 gap-3">
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Domisili Asal</label>
  <input 
  type="text" 
  placeholder="Ex: Surabaya"
  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={formMurid.domisili} 
  onChange={e => setFormMurid({ ...formMurid, domisili: e.target.value })}
  />
  </div>
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alamat (Asrama/Kamar)</label>
  <input 
  type="text" 
  placeholder="Ex: Asrama Al-Fatih 01"
  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={formMurid.alamat} 
  onChange={e => setFormMurid({ ...formMurid, alamat: e.target.value })}
  />
  </div>
  </div>
  
  <button 
  type="submit" 
  className="w-full bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-md shadow-emerald-600/10 hover:bg-emerald-700 transition-all active:scale-95 mt-2"
  >
  <i className="fa-solid fa-floppy-disk mr-1.5"></i> Simpan Data Santri
  </button>
  </form>
  )}
  
  {/* Rendering Daftar Santri yang Dikelompokkan per Kelas */}
  <div className="space-y-4">
  {kelasTersedia.length === 0 ? (
  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
  <i className="fa-solid fa-users-slash text-2xl opacity-60 mb-2 block"></i>
  <p className="text-xs font-semibold">Belum ada data santri.</p>
  <p className="text-[10px] opacity-80 mt-0.5">Mulai dengan menambahkan murid pertama.</p>
  </div>
  ) : (
  kelasTersedia.map(kelas => {
  const muridDiKelasIni = muridList.filter(m => m.kelas === kelas);
  
  return (
  <div key={kelas} className="border border-slate-100 rounded-2xl bg-slate-50/50 shadow-sm overflow-hidden animate-fadeIn">
  
  {/* Header Label Kelas */}
  <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200/50 flex justify-between items-center">
  <h4 className="text-xs font-black text-slate-700 uppercase flex items-center">
  <i className="fa-solid fa-layer-group text-emerald-600 mr-2 text-[10px]"></i>
  Kelas {kelas}
  </h4>
  <span className="text-[9px] font-bold bg-white text-emerald-700 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
  {muridDiKelasIni.length} Murid
  </span>
  </div>
  
  {/* List Murid dalam Kelas */}
  <div className="divide-y divide-slate-100">
  {muridDiKelasIni.map((m, idx) => (
  <div key={m.id} className="p-3 bg-white hover:bg-slate-50 transition-colors flex justify-between items-center">
  <div className="flex items-start space-x-3">
  {/* Indikator Nomor Urut */}
  <div className="w-6 h-6 shrink-0 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold border border-emerald-100 mt-0.5 shadow-inner">
  {idx + 1}
  </div>
  
  {/* Detail Identitas Murid */}
  <div>
  <p className="text-xs font-bold text-slate-800 leading-tight">{m.nama}</p>
  <div className="text-[9px] text-slate-500 font-medium mt-1 flex flex-wrap gap-2">
  {m.domisili && m.domisili !== '-' && (
  <span className="flex items-center"><i className="fa-solid fa-location-dot text-rose-400 mr-1"></i>{m.domisili}</span>
  )}
  {m.alamat && m.alamat !== '-' && (
  <span className="flex items-center"><i className="fa-solid fa-house text-blue-400 mr-1"></i>{m.alamat}</span>
  )}
  {(!m.domisili || m.domisili === '-') && (!m.alamat || m.alamat === '-') && (
  <span className="text-slate-400 italic">Identitas lokasi belum diisi</span>
  )}
  </div>
  </div>
  </div>
  
  {/* Tombol Hapus */}
  <button 
  onClick={() => eksekusiHapusMurid(m.id, m.nama)}
  className="w-8 h-8 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center shrink-0"
  title="Hapus Data Santri"
  >
  <i className="fa-solid fa-trash-can text-[11px]"></i>
  </button>
  </div>
  ))}
  </div>
  </div>
  );
  })
  )}
  </div>
  </div>
  </div>
  );
  })()}
  
  {/* === TAB 3: MENU ABSENSI MODERN === */}
  {activeTab === 'absen' && (() => {
  // --- Logika Tanggal & Waktu ---
  const namaHariIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  const hariIni = namaHariIndo[now.getDay()];
  const tanggalHariIni = now.getDate();
  const bulanHariIni = namaBulanIndo[now.getMonth()];
  const tahunHariIni = now.getFullYear();
  const stringTglHariIni = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
  
  // --- Handler Absen Harian ---
  const setStatusAbsen = (muridId, status) => {
  setDraftAbsen(prev => ({ ...prev, [muridId]: status }));
  };
  
  const eksekusiSimpanAbsenMasal = async () => {
  if (!filterKelasAbsen) return alert("Silakan pilih kelas terlebih dahulu!");
  
  setLoading(true);
  const muridDiKelas = muridList.filter(m => m.kelas === filterKelasAbsen);
  let daftarAbsenLama = [...listAbsensi];
  const absenBaruUntukDisimpan = [];
  
  muridDiKelas.forEach(m => {
  // Ambil status dari draft (jika baru diubah), atau dari data yang sudah ada sebelumnya
  const statusFinal = draftAbsen[m.id] || daftarAbsenLama.find(a => a.murid_id === m.id && a.tanggal === stringTglHariIni)?.status;
  
  if (statusFinal) {
  // Hapus data lama di hari yang sama agar tidak duplikat (Upsert manual)
  daftarAbsenLama = daftarAbsenLama.filter(a => !(a.murid_id === m.id && a.tanggal === stringTglHariIni));
  
  const itemAbsenBaru = {
  id: Math.floor(Math.random() * 1000000),
  murid_id: m.id,
  status: statusFinal,
  tanggal: stringTglHariIni,
  ustadz_email: user?.email
  };
  daftarAbsenLama.unshift(itemAbsenBaru);
  absenBaruUntukDisimpan.push(itemAbsenBaru);
  }
  });
  
  setListAbsensi(daftarAbsenLama);
  
  if (checkConnection() && absenBaruUntukDisimpan.length > 0) {
  try {
  // Hapus data cloud untuk tanggal & kelas ini terlebih dahulu (Mencegah ganda)
  const idMuridKelas = muridDiKelas.map(m => m.id);
  await supabase.from('absensi').delete()
  .eq('tanggal', stringTglHariIni)
  .in('murid_id', idMuridKelas);
  
  // Insert data terbaru
  await supabase.from('absensi').insert(absenBaruUntukDisimpan);
  } catch (e) {
  console.error("Gagal sinkron absen ke cloud:", e);
  }
  }
  
  setLoading(false);
  alert(`Alhamdulillah, data absensi Kelas ${filterKelasAbsen} hari ini berhasil disimpan/diperbarui!`);
  };
  
  // --- Logika Rekapitulasi (Di Render Langsung di Layar) ---
  const muridRekap = absenKelasBulanan ? muridList.filter(m => m.kelas === absenKelasBulanan) : [];
  const dataRekapTampil = muridRekap.map(m => {
  const absenMuridTerkait = listAbsensi.filter(a => {
  const cocokMurid = a.murid_id === m.id;
  const cocokWaktu = absenRekapType === 'bulanan' 
  ? a.tanggal.startsWith(absenBulan) 
  : a.tanggal.startsWith(absenTahun);
  return cocokMurid && cocokWaktu;
  });
  
  return {
  nama: m.nama,
  h: absenMuridTerkait.filter(x => x.status === 'Hadir').length,
  i: absenMuridTerkait.filter(x => x.status === 'Izin').length,
  a: absenMuridTerkait.filter(x => x.status === 'Alfa').length,
  };
  });
  
  // --- Handler Cetak & Bagikan Rekap ---
  const teksWAFormal = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYang terhormat Bapak/Ibu Wali Santri,\nBerikut kami sampaikan laporan rekapitulasi kehadiran santri *Kelas ${absenKelasBulanan}* untuk periode *${absenRekapType === 'bulanan' ? absenBulan : Tahun + absenTahun}*.\n\nMohon periksa dokumen PDF yang dilampirkan oleh ustadz untuk melihat rincian kehadiran putra/putri Anda.\n\nTerima kasih atas perhatian dan kerjasamanya. Semoga para santri senantiasa diberikan kemudahan dalam menuntut ilmu.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.`;
  
  const eksekusiCetakRekap = () => {
  const bodyTable = dataRekapTampil.map(d => [d.nama, d.h, d.i, d.a]);
  const judul = `Laporan Kehadiran Kelas ${absenKelasBulanan}`;
  const infoEkstra = [
  `Periode: ${absenRekapType === 'bulanan' ? absenBulan : absenTahun}`,
  `Dicetak pada: ${tanggalHariIni} ${bulanHariIni} ${tahunHariIni}`
  ];
  generatePDF(judul, ["Nama Santri", "Hadir", "Izin", "Alfa"], bodyTable, infoEkstra);
  };
  
  const kelasTersedia = [...new Set(muridList.map(m => m.kelas))].sort();
  
  return (
  <div className="space-y-5 animate-fadeIn">
  
  {/* Switcher Tab Harian & Rekap */}
  <div className="flex bg-slate-200/70 p-1.5 rounded-2xl shadow-inner mb-2">
  <button 
  onClick={() => setAbsenTab('harian')} 
  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl transition-all duration-300 ${absenTab === 'harian' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
  >
  Absen Harian
  </button>
  <button 
  onClick={() => setAbsenTab('arsip')} 
  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl transition-all duration-300 ${absenTab === 'arsip' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
  >
  Rekapitulasi
  </button>
  </div>
  
  {/* === PANEL ABSEN HARIAN === */}
  {absenTab === 'harian' && (
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 animate-slideUp">
  
  {/* Keterangan Waktu Real-Time Modern */}
  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl mb-5 shadow-md flex items-center justify-between">
  <div>
  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-0.5">Jurnal Kehadiran</p>
  <h4 className="text-lg font-black leading-none">{hariIni}</h4>
  <p className="text-xs font-medium text-emerald-50 mt-1">
  {tanggalHariIni} {bulanHariIni} {tahunHariIni}
  </p>
  </div>
  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
  <i className="fa-solid fa-calendar-check text-2xl text-white"></i>
  </div>
  </div>
  
  {/* Filter Kelas */}
  <div className="mb-4">
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Pilih Kelas</label>
  <select 
  className="w-full border border-slate-200 bg-slate-50 py-2.5 px-4 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
  value={filterKelasAbsen} 
  onChange={e => setFilterKelasAbsen(e.target.value)}
  >
  <option value="">-- Sentuh untuk memilih kelas --</option>
  {kelasTersedia.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  </div>
  
  {/* Daftar Murid & Input Absen */}
  {filterKelasAbsen ? (
  <div className="space-y-3 mt-5">
  <h4 className="text-xs font-bold text-slate-400 border-b border-slate-100 pb-2 mb-3">
  Daftar Santri Kelas {filterKelasAbsen}
  </h4>
  
  {muridList.filter(m => m.kelas === filterKelasAbsen).map((m, index) => {
  // Cek status saat ini (Prioritas: Draft > Database Lama > Kosong)
  const statusAktif = draftAbsen[m.id] || listAbsensi.find(a => a.murid_id === m.id && a.tanggal === stringTglHariIni)?.status || '';
  
  return (
  <div key={m.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center transition-all hover:border-emerald-200">
  <div className="flex items-center space-x-3">
  <div className="w-7 h-7 rounded-full bg-white text-slate-500 font-bold text-[10px] flex items-center justify-center border border-slate-200 shadow-sm">
  {index + 1}
  </div>
  <div>
  <h4 className="font-extrabold text-slate-800 text-xs">{m.nama}</h4>
  {statusAktif ? (
  <p className="text-[9px] font-bold text-emerald-600 mt-0.5"><i className="fa-solid fa-check-circle mr-1"></i>Telah diisi</p>
  ) : (
  <p className="text-[9px] font-bold text-rose-500 mt-0.5"><i className="fa-solid fa-circle-exclamation mr-1"></i>Belum diisi</p>
  )}
  </div>
  </div>
  
  <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
  <button 
  onClick={() => setStatusAbsen(m.id, 'Hadir')} 
  className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${statusAktif === 'Hadir' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-100'}`}
  >H</button>
  <button 
  onClick={() => setStatusAbsen(m.id, 'Izin')} 
  className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${statusAktif === 'Izin' ? 'bg-amber-400 text-white shadow-md shadow-amber-400/30' : 'text-slate-400 hover:bg-slate-100'}`}
  >I</button>
  <button 
  onClick={() => setStatusAbsen(m.id, 'Alfa')} 
  className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${statusAktif === 'Alfa' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'text-slate-400 hover:bg-slate-100'}`}
  >A</button>
  </div>
  </div>
  );
  })}
  
  <button 
  onClick={eksekusiSimpanAbsenMasal} 
  className="w-full bg-emerald-600 text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 mt-6 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center"
  >
  <i className="fa-solid fa-floppy-disk mr-2"></i> Simpan & Edit Absensi
  </button>
  </div>
  ) : (
  <div className="text-center py-6 text-slate-400">
  <i className="fa-solid fa-arrow-pointer text-2xl opacity-50 mb-2"></i>
  <p className="text-xs font-semibold">Pilih kelas untuk memunculkan daftar santri.</p>
  </div>
  )}
  </div>
  )}
  
  {/* === PANEL REKAPITULASI (ARSIP) === */}
  {absenTab === 'arsip' && (
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 animate-slideUp">
  <div className="border-b border-slate-100 pb-3 mb-4">
  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Laporan Kehadiran</h3>
  <p className="text-[10px] text-slate-400 font-medium">Rekapitulasi bulanan & tahunan</p>
  </div>
  
  {/* Panel Filter Rekapitulasi */}
  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3 mb-5">
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">A. Pilih Kelas</label>
  <select 
  className="w-full border border-slate-200 bg-white py-2 px-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500"
  value={absenKelasBulanan} 
  onChange={e => setAbsenKelasBulanan(e.target.value)}
  >
  <option value="">-- Pilih Kelas --</option>
  {kelasTersedia.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  </div>
  
  <div className="grid grid-cols-2 gap-3">
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">B. Jenis Rekap</label>
  <select 
  className="w-full border border-slate-200 bg-white py-2 px-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500"
  value={absenRekapType} 
  onChange={e => setAbsenRekapType(e.target.value)}
  >
  <option value="bulanan">Bulanan</option>
  <option value="tahunan">Tahunan</option>
  </select>
  </div>
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">C. Waktu</label>
  {absenRekapType === 'bulanan' ? (
  <input 
  type="month" 
  className="w-full border border-slate-200 bg-white py-1.5 px-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500"
  value={absenBulan} 
  onChange={e => setAbsenBulan(e.target.value)} 
  />
  ) : (
  <input 
  type="number" 
  placeholder="Contoh: 2024"
  className="w-full border border-slate-200 bg-white py-2 px-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500"
  value={absenTahun} 
  onChange={e => setAbsenTahun(e.target.value)} 
  />
  )}
  </div>
  </div>
  </div>
  
  {/* Tampilan Data Rekap Langsung di Layar */}
  {absenKelasBulanan && (absenBulan || absenTahun) ? (
  <div className="animate-fadeIn">
  <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center">
  <i className="fa-solid fa-table-list mr-1.5 text-emerald-600"></i> Pratinjau Data Rekapitulasi
  </h4>
  
  <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-inner">
  <table className="w-full text-left border-collapse">
  <thead>
  <tr className="bg-slate-100 text-[10px] text-slate-600 uppercase">
  <th className="p-2 border-b border-slate-200 font-black">Nama Santri</th>
  <th className="p-2 border-b border-slate-200 font-black text-center text-emerald-600">H</th>
  <th className="p-2 border-b border-slate-200 font-black text-center text-amber-500">I</th>
  <th className="p-2 border-b border-slate-200 font-black text-center text-rose-500">A</th>
  </tr>
  </thead>
  <tbody className="bg-white">
  {dataRekapTampil.length > 0 ? dataRekapTampil.map((d, idx) => (
  <tr key={idx} className="text-xs font-semibold text-slate-700 hover:bg-slate-50">
  <td className="p-2 border-b border-slate-100 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{d.nama}</td>
  <td className="p-2 border-b border-slate-100 text-center">{d.h}</td>
  <td className="p-2 border-b border-slate-100 text-center">{d.i}</td>
  <td className="p-2 border-b border-slate-100 text-center">{d.a}</td>
  </tr>
  )) : (
  <tr>
  <td colSpan="4" className="p-4 text-center text-[10px] text-slate-400 font-medium">Tidak ada data murid di kelas ini.</td>
  </tr>
  )}
  </tbody>
  </table>
  </div>
  
  {/* Tombol Ekspor Formal */}
  <div className="grid grid-cols-2 gap-3 mt-5">
  <button 
  onClick={eksekusiCetakRekap} 
  className="flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95"
  >
  <i className="fa-solid fa-file-pdf mr-1.5 text-sm"></i> Unduh PDF
  </button>
  <button 
  onClick={() => shareWA(teksWAFormal)} 
  className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
  >
  <i className="fa-brands fa-whatsapp mr-1.5 text-sm"></i> Bagikan (WA)
  </button>
  </div>
  </div>
  ) : (
  <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl bg-slate-50">
  <p className="text-[10px] font-semibold text-slate-400">Lengkapi filter di atas untuk melihat data.</p>
  </div>
  )}
  </div>
  )}
  
  </div>
  );
  })()}
  
  {/* === TAB 4: MENU BUKU SAKU (JURNAL & CATATAN USTAZ) === */}
  {activeTab === 'buku' && (() => {
  // Local UI State untuk Buku Saku (Filter Kelas pada Form)
  const [filterKelasBuku, setFilterKelasBuku] = React.useState('');
  const [filterJenisLihat, setFilterJenisLihat] = React.useState('Semua');
  
  // --- Handler Simpan & Hapus Buku Saku ---
  const eksekusiSimpanBukuSaku = async (e) => {
  e.preventDefault();
  if (!formBukuSaku.tanggal || !formBukuSaku.keterangan || !formBukuSaku.jenis) {
  return alert("Tanggal, Jenis Catatan, dan Keterangan wajib diisi!");
  }
  
  setLoading(true);
  try {
  const idBaru = Math.floor(Math.random() * 1000000);
  const dataCatatanBaru = {
  id: idBaru,
  jenis: formBukuSaku.jenis,
  tanggal: formBukuSaku.tanggal,
  keterangan: formBukuSaku.keterangan,
  murid_id: formBukuSaku.murid_id || null,
  kelas_terkait: filterKelasBuku || null,
  ustadz_email: user?.email
  };
  
  // Menambahkan catatan baru ke urutan paling atas
  setListBukuSaku([dataCatatanBaru, ...listBukuSaku]);
  
  if (checkConnection()) {
  await supabase.from('buku_saku').insert([dataCatatanBaru]);
  }
  
  alert("Alhamdulillah, catatan berhasil disimpan!");
  // Reset Form
  setFormBukuSaku({ id: null, jenis: 'Batas Mengajar', keterangan: '', tanggal: new Date().toISOString().split('T')[0], murid_id: '', _showForm: false });
  setFilterKelasBuku('');
  } catch (err) {
  console.error(err);
  } finally {
  setLoading(false);
  }
  };
  
  const eksekusiHapusBukuSaku = async (id) => {
  if (!window.confirm("Apakah ustadz yakin ingin menghapus catatan ini secara permanen?")) return;
  setLoading(true);
  try {
  setListBukuSaku(listBukuSaku.filter(b => b.id !== id));
  if (checkConnection()) {
  await supabase.from('buku_saku').delete().eq('id', id);
  }
  } catch (e) {
  console.error(e);
  } finally {
  setLoading(false);
  }
  };
  
  // Mendapatkan daftar murid berdasarkan kelas yang dipilih di form
  const muridTersediaUntukForm = filterKelasBuku ? muridList.filter(m => m.kelas === filterKelasBuku) : [];
  const kelasUnik = [...new Set(muridList.map(m => m.kelas))].sort();
  
  // Filter Tampilan Data
  const catatanDitampilkan = listBukuSaku
  .filter(b => filterJenisLihat === 'Semua' ? true : b.jenis === filterJenisLihat)
  .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  
  return (
  <div className="space-y-6 animate-fadeIn">
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60">
  
  {/* Header Modul */}
  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
  <div>
  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Buku Saku Digital</h3>
  <p className="text-[10px] text-slate-400 font-medium">Jurnal mengajar & catatan santri</p>
  </div>
  <button
  onClick={() => setFormBukuSaku(prev => ({ 
  ...prev, 
  _showForm: !prev._showForm,
  tanggal: new Date().toISOString().split('T')[0] // Set tanggal hari ini saat dibuka
  }))}
  className={`flex items-center space-x-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all active:scale-95 ${
  formBukuSaku._showForm
  ? 'bg-slate-100 text-slate-600'
  : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
  }`}
  >
  <i className={`fa-solid ${formBukuSaku._showForm ? 'fa-xmark' : 'fa-pen-clip'}`}></i>
  <span>{formBukuSaku._showForm ? 'Tutup' : 'Tulis Baru'}</span>
  </button>
  </div>
  
  {/* Formulir Input Catatan Modern */}
  {formBukuSaku._showForm && (
  <form onSubmit={eksekusiSimpanBukuSaku} className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl mb-6 space-y-3 shadow-inner animate-slideDown">
  <div className="grid grid-cols-2 gap-3 mb-1">
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal</label>
  <input 
  type="date" 
  required
  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={formBukuSaku.tanggal || ''} 
  onChange={e => setFormBukuSaku({ ...formBukuSaku, tanggal: e.target.value })}
  />
  </div>
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kategori Catatan</label>
  <select 
  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={formBukuSaku.jenis} 
  onChange={e => setFormBukuSaku({ ...formBukuSaku, jenis: e.target.value })}
  >
  <option value="Batas Mengajar">📖 Batas Mengajar</option>
  <option value="Setoran Hafalan">📿 Setoran Hafalan</option>
  <option value="Catatan Bebas">📌 Catatan Bebas</option>
  </select>
  </div>
  </div>
  
  {/* Opsi Target (Opsional: Bisa untuk satu kelas atau spesifik satu murid) */}
  <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2">
  <p className="text-[10px] font-bold text-slate-400 uppercase">Target Catatan (Opsional)</p>
  <div className="grid grid-cols-2 gap-3">
  <select 
  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={filterKelasBuku} 
  onChange={e => {
  setFilterKelasBuku(e.target.value);
  setFormBukuSaku({ ...formBukuSaku, murid_id: '' }); // Reset murid jika kelas berubah
  }}
  >
  <option value="">Semua / Umum</option>
  {kelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  
  <select 
  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
  value={formBukuSaku.murid_id || ''} 
  onChange={e => setFormBukuSaku({ ...formBukuSaku, murid_id: e.target.value })}
  disabled={!filterKelasBuku}
  >
  <option value="">Seluruh Santri</option>
  {muridTersediaUntukForm.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
  </select>
  </div>
  </div>
  
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Isi Keterangan / Catatan</label>
  <textarea 
  required
  rows="3"
  placeholder={formBukuSaku.jenis === 'Batas Mengajar' ? "Contoh: Kitab Jurumiyah Bab Fa'il halaman 24..." : "Tulis rincian catatan di sini..."}
  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
  value={formBukuSaku.keterangan || ''} 
  onChange={e => setFormBukuSaku({ ...formBukuSaku, keterangan: e.target.value })}
  ></textarea>
  </div>
  
  <button 
  type="submit" 
  className="w-full bg-emerald-600 text-white text-xs font-bold py-3 rounded-xl shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
  >
  <i className="fa-solid fa-floppy-disk mr-1.5"></i> Simpan Catatan
  </button>
  </form>
  )}
  
  {/* Filter Tampilan Feed Linimasa */}
  <div className="flex space-x-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
  {['Semua', 'Batas Mengajar', 'Setoran Hafalan', 'Catatan Bebas'].map(jenis => (
  <button
  key={jenis}
  onClick={() => setFilterJenisLihat(jenis)}
  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
  filterJenisLihat === jenis 
  ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
  }`}
  >
  {jenis === 'Batas Mengajar' && '📖 '}
  {jenis === 'Setoran Hafalan' && '📿 '}
  {jenis === 'Catatan Bebas' && '📌 '}
  {jenis}
  </button>
  ))}
  </div>
  
  {/* Rendering Linimasa (Timeline Feed) */}
  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
  {catatanDitampilkan.length === 0 ? (
  <div className="text-center py-10 relative z-10 bg-white/80 backdrop-blur-sm rounded-xl">
  <i className="fa-solid fa-box-open text-3xl text-slate-300 mb-2"></i>
  <p className="text-xs font-semibold text-slate-500">Belum ada catatan untuk kategori ini.</p>
  </div>
  ) : (
  catatanDitampilkan.map((buku) => {
  // Menentukan styling berdasarkan jenis catatan
  let iconClass = "fa-pen";
  let colorClass = "text-slate-500 bg-slate-100 border-slate-200";
  let badgeClass = "bg-slate-100 text-slate-600";
  
  if (buku.jenis === 'Batas Mengajar') {
  iconClass = "fa-book-open-reader";
  colorClass = "text-blue-500 bg-blue-50 border-blue-200";
  badgeClass = "bg-blue-100 text-blue-700";
  } else if (buku.jenis === 'Setoran Hafalan') {
  iconClass = "fa-award";
  colorClass = "text-emerald-500 bg-emerald-50 border-emerald-200";
  badgeClass = "bg-emerald-100 text-emerald-700";
  } else if (buku.jenis === 'Catatan Bebas') {
  iconClass = "fa-thumbtack";
  colorClass = "text-amber-500 bg-amber-50 border-amber-200";
  badgeClass = "bg-amber-100 text-amber-700";
  }
  
  // Mencari nama murid jika ada
  const muridTerkait = buku.murid_id ? muridList.find(m => m.id === String(buku.murid_id) || m.id === Number(buku.murid_id)) : null;
  
  return (
  <div key={buku.id} className="relative z-10 flex items-start animate-slideUp">
  {/* Ikon Linimasa */}
  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm z-20 bg-white ${colorClass.split(' ')[0]} ${colorClass.split(' ')[2]}`}>
  <i className={`fa-solid ${iconClass} text-[11px]`}></i>
  </div>
  
  {/* Kartu Konten */}
  <div className="ml-3 flex-1 bg-white border border-slate-100 shadow-sm p-3.5 rounded-2xl hover:border-slate-300 transition-all">
  <div className="flex justify-between items-start mb-1.5">
  <div className="flex flex-wrap items-center gap-1.5 mb-1">
  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${badgeClass}`}>
  {buku.jenis}
  </span>
  <span className="text-[10px] font-bold text-slate-400">
  <i className="fa-regular fa-calendar mr-1"></i>
  {buku.tanggal}
  </span>
  </div>
  <button 
  onClick={() => eksekusiHapusBukuSaku(buku.id)}
  className="text-slate-300 hover:text-rose-500 transition-colors p-1"
  title="Hapus Catatan"
  >
  <i className="fa-solid fa-trash-can text-[10px]"></i>
  </button>
  </div>
  
  {/* Label Target (Kelas / Murid) */}
  {(buku.kelas_terkait || muridTerkait) && (
  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-600 mb-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 inline-flex">
  {buku.kelas_terkait && (
  <span><i className="fa-solid fa-users text-slate-400 mr-1"></i>Kelas {buku.kelas_terkait}</span>
  )}
  {buku.kelas_terkait && muridTerkait && <span className="text-slate-300 mx-1">|</span>}
  {muridTerkait && (
  <span className="text-emerald-700"><i className="fa-solid fa-user text-emerald-500 mr-1"></i>{muridTerkait.nama}</span>
  )}
  </div>
  )}
  
  <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
  {buku.keterangan}
  </p>
  </div>
  </div>
  );
  })
  )}
  </div>
  
  </div>
  </div>
  );
  })()}
  
  {/* === TAB 5: MENU NILAI (INPUT UJIAN & RAPOR DIGITAL) === */}
  {activeTab === 'nilai' && (() => {
  // Local UI State untuk Modul Nilai
  const [nilaiTab, setNilaiTab] = React.useState('input');
  const [filterKelasNilai, setFilterKelasNilai] = React.useState('');
  const [filterPelajaran, setFilterPelajaran] = React.useState('');
  const [filterUjian, setFilterUjian] = React.useState('');
  const [draftNilai, setDraftNilai] = React.useState({});
  
  // Mengekstrak daftar data dinamis untuk dropdown
  const kelasTersedia = [...new Set(muridList.map(m => m.kelas))].sort();
  // Ambil mata pelajaran unik dari jadwal mengajar yang sudah didaftarkan ustaz
  const pelajaranTersedia = [...new Set(listJadwal.map(j => j.pelajaran))].sort();
  const daftarUjian = ["Ulangan Harian 1", "Ulangan Harian 2", "UTS (Tengah Semester)", "UAS (Akhir Semester)", "Ujian Praktik / Setoran Akhir"];
  
  // Fungsi Kalkulasi Predikat Cerdas
  const hitungPredikat = (skor) => {
  if (skor === '' || skor === undefined || skor === null) return '-';
  const n = Number(skor);
  if (n >= 90) return { huruf: 'A', warna: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (n >= 80) return { huruf: 'B', warna: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (n >= 70) return { huruf: 'C', warna: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { huruf: 'D', warna: 'text-rose-600 bg-rose-50 border-rose-200' };
  };
  
  // --- Handler Form Input Nilai ---
  const setInputDraftNilai = (muridId, skor) => {
  // Batasi nilai dari 0 hingga 100
  let val = parseInt(skor);
  if (isNaN(val)) val = '';
  else if (val > 100) val = 100;
  else if (val < 0) val = 0;
  
  setDraftNilai(prev => ({ ...prev, [muridId]: val }));
  };
  
  const eksekusiSimpanNilaiMasal = async () => {
  if (!filterKelasNilai || !filterPelajaran || !filterUjian) {
  return alert("Harap lengkapi pilihan Kelas, Mata Pelajaran, dan Jenis Ujian terlebih dahulu!");
  }
  
  setLoading(true);
  const muridDiKelas = muridList.filter(m => m.kelas === filterKelasNilai);
  let daftarNilaiLama = [...listNilai]; // listNilai dari state global
  const nilaiBaruDisimpan = [];
  
  muridDiKelas.forEach(m => {
  const nilaiInput = draftNilai[m.id];
  // Cek apakah ada input di draft, jika tidak pakai nilai yang sudah ada di database lokal
  const nilaiAwalDB = daftarNilaiLama.find(n => n.murid_id === m.id && n.pelajaran === filterPelajaran && n.jenis_ujian === filterUjian)?.nilai;
  const skorFinal = nilaiInput !== undefined ? nilaiInput : nilaiAwalDB;
  
  if (skorFinal !== undefined && skorFinal !== '') {
  // Buang data lama untuk kombinasi ini guna mencegah duplikasi
  daftarNilaiLama = daftarNilaiLama.filter(n => !(n.murid_id === m.id && n.pelajaran === filterPelajaran && n.jenis_ujian === filterUjian));
  
  const itemBaru = {
  id: Math.floor(Math.random() * 1000000),
  murid_id: m.id,
  pelajaran: filterPelajaran,
  jenis_ujian: filterUjian,
  nilai: Number(skorFinal),
  ustadz_email: user?.email
  };
  daftarNilaiLama.push(itemBaru);
  nilaiBaruDisimpan.push(itemBaru);
  }
  });
  
  setListNilai(daftarNilaiLama);
  
  // Sinkronisasi ke Supabase Cloud
  if (checkConnection() && nilaiBaruDisimpan.length > 0) {
  try {
  const idMuridKelas = muridDiKelas.map(m => m.id);
  await supabase.from('nilai_santri').delete()
  .eq('pelajaran', filterPelajaran)
  .eq('jenis_ujian', filterUjian)
  .in('murid_id', idMuridKelas);
  
  await supabase.from('nilai_santri').insert(nilaiBaruDisimpan);
  } catch (e) {
  console.error("Gagal sinkron nilai ke cloud:", e);
  }
  }
  
  setLoading(false);
  alert(`Alhamdulillah, nilai ${filterPelajaran} - ${filterUjian} Kelas ${filterKelasNilai} berhasil disimpan!`);
  };
  
  // --- Logika Rekapitulasi & Rapor ---
  const muridRekap = filterKelasNilai ? muridList.filter(m => m.kelas === filterKelasNilai) : [];
  const dataRekapTampil = muridRekap.map(m => {
  const dataNilaiDB = listNilai.find(n => n.murid_id === m.id && n.pelajaran === filterPelajaran && n.jenis_ujian === filterUjian);
  return {
  nama: m.nama,
  nilai: dataNilaiDB ? dataNilaiDB.nilai : 'Belum Ujian'
  };
  });
  
  // --- Handler Ekspor PDF & WA ---
  const teksWAPengumumanNilai = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYang terhormat Bapak/Ibu Wali Santri,\nBerikut kami sampaikan bahwa ustadz telah mempublikasikan hasil *${filterUjian}* untuk mata pelajaran *${filterPelajaran}* pada *Kelas ${filterKelasNilai}*.\n\nUntuk melihat rincian capaian nilai putra/putri Anda secara lengkap, mohon periksa dokumen Rapor Digital (PDF) yang dilampirkan bersama pesan ini.\n\nDemikian pemberitahuan ini kami sampaikan. Semoga para santri terus diberikan semangat dalam belajar dan menghafal.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.`;
  
  const eksekusiCetakRapor = () => {
  const bodyTable = dataRekapTampil.map((d, index) => [
  (index + 1).toString(),
  d.nama,
  d.nilai.toString(),
  d.nilai !== 'Belum Ujian' ? hitungPredikat(d.nilai).huruf : '-'
  ]);
  
  const judul = `Rapor Santri - Kelas ${filterKelasNilai}`;
  const infoEkstra = [
  `Mata Pelajaran: ${filterPelajaran}`,
  `Jenis Evaluasi: ${filterUjian}`,
  `Dicetak Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
  ];
  
  generatePDF(judul, ["No", "Nama Santri", "Skor Nilai", "Predikat"], bodyTable, infoEkstra);
  };
  
  return (
  <div className="space-y-5 animate-fadeIn">
  
  {/* Switcher Tab Modul Nilai */}
  <div className="flex bg-slate-200/70 p-1.5 rounded-2xl shadow-inner mb-2">
  <button 
  onClick={() => setNilaiTab('input')} 
  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl transition-all duration-300 ${nilaiTab === 'input' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
  >
  <i className="fa-solid fa-pen-nib mr-1"></i> Input Nilai
  </button>
  <button 
  onClick={() => setNilaiTab('rekap')} 
  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl transition-all duration-300 ${nilaiTab === 'rekap' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
  >
  <i className="fa-solid fa-print mr-1"></i> Cetak Rapor
  </button>
  </div>
  
  {/* === PANEL FILTER GLOBAL (Digunakan oleh Tab Input & Rekap) === */}
  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-3xl shadow-sm space-y-3">
  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Parameter Evaluasi</h4>
  <div className="grid grid-cols-2 gap-3">
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kelas</label>
  <select 
  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
  value={filterKelasNilai} 
  onChange={e => setFilterKelasNilai(e.target.value)}
  >
  <option value="">-- Pilih --</option>
  {kelasTersedia.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  </div>
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pelajaran</label>
  <select 
  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
  value={filterPelajaran} 
  onChange={e => setFilterPelajaran(e.target.value)}
  >
  <option value="">-- Fan Kitab --</option>
  {pelajaranTersedia.map(p => <option key={p} value={p}>{p}</option>)}
  </select>
  </div>
  </div>
  <div>
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jenis Evaluasi / Ujian</label>
  <select 
  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
  value={filterUjian} 
  onChange={e => setFilterUjian(e.target.value)}
  >
  <option value="">-- Pilih Jenis Evaluasi Akademik --</option>
  {daftarUjian.map(u => <option key={u} value={u}>{u}</option>)}
  </select>
  </div>
  </div>
  
  {/* === PANEL INPUT NILAI === */}
  {nilaiTab === 'input' && (
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 animate-slideUp">
  <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-end">
  <div>
  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Jurnal Penilaian</h3>
  <p className="text-[10px] text-slate-400 font-medium">Input capaian akademik per santri</p>
  </div>
  <div className="text-[9px] font-bold text-slate-400 flex flex-col items-end">
  <span>A (90-100) • B (80-89)</span>
  <span>C (70-79) • D (0-69)</span>
  </div>
  </div>
  
  {filterKelasNilai && filterPelajaran && filterUjian ? (
  <div className="space-y-3 mt-2">
  {muridList.filter(m => m.kelas === filterKelasNilai).map((m, index) => {
  // Mencari skor saat ini: Draft -> Database
  const skorDB = listNilai.find(n => n.murid_id === m.id && n.pelajaran === filterPelajaran && n.jenis_ujian === filterUjian)?.nilai;
  const skorAktif = draftNilai[m.id] !== undefined ? draftNilai[m.id] : (skorDB !== undefined ? skorDB : '');
  const predikatInfo = hitungPredikat(skorAktif);
  
  return (
  <div key={m.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center transition-all hover:border-emerald-200">
  <div className="flex items-center space-x-3 w-[60%]">
  <div className="w-7 h-7 rounded-full bg-white text-slate-500 font-bold text-[10px] flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
  {index + 1}
  </div>
  <h4 className="font-extrabold text-slate-800 text-xs truncate pr-2">{m.nama}</h4>
  </div>
  
  <div className="flex items-center space-x-2 w-[40%] justify-end">
  {/* Indikator Predikat */}
  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] border shadow-sm ${predikatInfo.warna}`}>
  {predikatInfo.huruf}
  </div>
  
  {/* Input Skor (Numerik) */}
  <input 
  type="number" 
  min="0" max="100"
  placeholder="0-100"
  className="w-16 bg-white border border-slate-300 rounded-xl py-1.5 px-2 text-center text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
  value={skorAktif}
  onChange={(e) => setInputDraftNilai(m.id, e.target.value)}
  />
  </div>
  </div>
  );
  })}
  
  <button 
  onClick={eksekusiSimpanNilaiMasal} 
  className="w-full bg-emerald-600 text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 mt-6 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center"
  >
  <i className="fa-solid fa-floppy-disk mr-2"></i> Publikasikan Nilai
  </button>
  </div>
  ) : (
  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50 mt-4">
  <i className="fa-solid fa-sliders text-2xl opacity-50 mb-2 block"></i>
  <p className="text-xs font-semibold">Tentukan parameter evaluasi di atas.</p>
  <p className="text-[10px] opacity-80 mt-0.5">Daftar santri akan muncul otomatis.</p>
  </div>
  )}
  </div>
  )}
  
  {/* === PANEL CETAK RAPOR & REKAP === */}
  {nilaiTab === 'rekap' && (
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 animate-slideUp">
  <div className="border-b border-slate-100 pb-3 mb-4">
  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Rapor Digital</h3>
  <p className="text-[10px] text-slate-400 font-medium">Pratinjau nilai & ekspor laporan PDF</p>
  </div>
  
  {filterKelasNilai && filterPelajaran && filterUjian ? (
  <div className="animate-fadeIn">
  {/* Banner Info */}
  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-3 mb-4 flex items-center space-x-3">
  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
  <i className="fa-solid fa-circle-check"></i>
  </div>
  <div>
  <p className="text-[10px] font-bold text-emerald-800 uppercase">Rekapitulasi Aktif</p>
  <p className="text-[11px] font-semibold text-emerald-900 mt-0.5">{filterPelajaran} • {filterUjian}</p>
  </div>
  </div>
  
  {/* Tabel Pratinjau Rapor */}
  <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-inner">
  <table className="w-full text-left border-collapse">
  <thead>
  <tr className="bg-slate-100 text-[10px] text-slate-600 uppercase">
  <th className="p-2 border-b border-slate-200 font-black">Nama Santri</th>
  <th className="p-2 border-b border-slate-200 font-black text-center">Skor</th>
  <th className="p-2 border-b border-slate-200 font-black text-center">PDKT</th>
  </tr>
  </thead>
  <tbody className="bg-white">
  {dataRekapTampil.length > 0 ? dataRekapTampil.map((d, idx) => {
  const pr = d.nilai !== 'Belum Ujian' ? hitungPredikat(d.nilai) : { huruf: '-', warna: 'text-slate-400' };
  return (
  <tr key={idx} className="text-xs font-semibold text-slate-700 hover:bg-slate-50">
  <td className="p-2 border-b border-slate-100 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{d.nama}</td>
  <td className="p-2 border-b border-slate-100 text-center font-black">
  {d.nilai === 'Belum Ujian' ? <span className="text-[9px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded">KOSONG</span> : d.nilai}
  </td>
  <td className="p-2 border-b border-slate-100 text-center">
  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${pr.warna}`}>{pr.huruf}</span>
  </td>
  </tr>
  );
  }) : (
  <tr>
  <td colSpan="3" className="p-4 text-center text-[10px] text-slate-400 font-medium">Tidak ada data murid di kelas ini.</td>
  </tr>
  )}
  </tbody>
  </table>
  </div>
  
  {/* Tombol Ekspor Formal Rapor */}
  <div className="grid grid-cols-2 gap-3 mt-5">
  <button 
  onClick={eksekusiCetakRapor} 
  className="flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95"
  >
  <i className="fa-solid fa-file-pdf mr-1.5 text-sm"></i> Unduh PDF
  </button>
  <button 
  onClick={() => shareWA(teksWAPengumumanNilai)} 
  className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
  >
  <i className="fa-brands fa-whatsapp mr-1.5 text-sm"></i> Bagikan (WA)
  </button>
  </div>
  </div>
  ) : (
  <div className="text-center py-6 text-slate-400">
  <i className="fa-solid fa-print text-2xl opacity-40 mb-2"></i>
  <p className="text-[11px] font-semibold">Gunakan filter parameter di atas untuk memunculkan rekap rapor.</p>
  </div>
  )}
  </div>
  )}
  
  </div>
  );
  })()}
  
  {/* === TAB 6: MENU KAS / INFAQ KELAS === */}
  {activeTab === 'kas' && (
  <div className="space-y-6 animate-fadeIn">
  <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
  <div className="relative z-10 flex items-center justify-between">
  <div>
  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-1">Total Saldo Infaq</p>
  <h2 className="text-2xl font-black tracking-tight">Rp 0</h2>
  </div>
  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
  <i className="fa-solid fa-wallet text-xl"></i>
  </div>
  </div>
  </div>
  
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 text-center">
  <div className="w-16 h-16 mx-auto bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-3">
  <i className="fa-solid fa-person-digging text-2xl"></i>
  </div>
  <h3 className="text-sm font-black text-slate-700">Modul Sedang Dikembangkan</h3>
  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
  Fitur pencatatan kas, infaq, dan denda pelanggaran santri akan segera hadir pada pembaruan aplikasi versi berikutnya.
  </p>
  </div>
  </div>
  )}
  
  {/* === TAB 7: PROFIL & PENGATURAN === */}
  {activeTab === 'profil' && (
  <div className="space-y-5 animate-fadeIn">
  {/* Kartu Identitas Akun */}
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 text-center relative overflow-hidden">
  <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center border-4 border-emerald-50 shadow-lg mb-4">
  <i className="fa-solid fa-user-tie text-3xl"></i>
  </div>
  <h2 className="text-sm font-black text-slate-800 tracking-tight">{user?.email}</h2>
  <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-full mt-2">
  Ustaz / Pendidik
  </p>
  </div>
  
  {/* Daftar Menu Pengaturan */}
  <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-200/60">
  <button 
  onClick={syncSemuaDataKeCloud} 
  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all"
  >
  <div className="flex items-center space-x-3">
  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
  <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
  </div>
  <div className="text-left">
  <h4 className="text-xs font-bold text-slate-700">Sinkronisasi Cloud</h4>
  <p className="text-[9px] text-slate-400 font-medium">Paksakan pencadangan data lokal</p>
  </div>
  </div>
  <i className="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
  </button>
  
  <div className="h-px bg-slate-100 mx-4"></div>
  
  <button 
  onClick={handleLogout} 
  className="w-full flex items-center justify-between p-4 hover:bg-rose-50 rounded-2xl transition-all group"
  >
  <div className="flex items-center space-x-3">
  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
  <i className="fa-solid fa-right-from-bracket text-xs"></i>
  </div>
  <div className="text-left">
  <h4 className="text-xs font-bold text-rose-600">Keluar Akun</h4>
  <p className="text-[9px] text-rose-400 font-medium">Akhiri sesi aplikasi saat ini</p>
  </div>
  </div>
  </button>
  </div>
  
  {/* Copyright App Info */}
  <div className="text-center text-[10px] text-slate-400 font-medium pt-4 pb-2">
  <p className="font-bold text-slate-500">Buku Ustaz Digital v1.0.0</p>
  <p className="mt-1">© {new Date().getFullYear()} Aplikasi Manajemen Kelas Pesantren.</p>
  <p>Semoga senantiasa bernilai jariyah.</p>
  </div>
  </div>
  )}
  </main>
  
  {/* ========================================================= */}
  {/* === BOTTOM NAVIGATION BAR (7 TABS EKSKLUSIF) === */}
  {/* ========================================================= */}
  <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/60 pb-safe z-50 max-w-md mx-auto px-1 shadow-[0_-4px_25px_-10px_rgba(0,0,0,0.1)]">
  <div className="flex justify-between items-center py-2 px-1">
  {[
  { id: 'jadwal', icon: 'fa-calendar-days', label: 'Jadwal' },
  { id: 'santri', icon: 'fa-users', label: 'Santri' },
  { id: 'absen', icon: 'fa-clipboard-user', label: 'Absen' },
  { id: 'buku', icon: 'fa-book-journal-whills', label: 'Jurnal' },
  { id: 'nilai', icon: 'fa-star', label: 'Nilai' },
  { id: 'kas', icon: 'fa-wallet', label: 'Infaq' },
  { id: 'profil', icon: 'fa-user-gear', label: 'Profil' }
  ].map(tab => {
  const isActive = activeTab === tab.id;
  return (
  <button
  key={tab.id}
  onClick={() => setActiveTab(tab.id)}
  className={`flex flex-col items-center justify-center w-[14%] py-1 space-y-1 transition-all duration-300 ${
  isActive ? 'text-emerald-600 transform scale-110' : 'text-slate-400 hover:text-emerald-500'
  }`}
  >
  <div className={`relative flex items-center justify-center h-7 w-7 rounded-full transition-all ${isActive ? 'bg-emerald-50' : 'bg-transparent'}`}>
  <i className={`fa-solid ${tab.icon} text-[13px] ${isActive ? 'drop-shadow-sm' : ''}`}></i>
  {/* Indikator titik hijau di bawah icon yang aktif */}
  {isActive && <span className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>}
  </div>
  <span className={`text-[8px] font-black tracking-wide ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
  {tab.label}
  </span>
  </button>
  );
  })}
  </div>
  </nav>
  
  </div>
  )}
  </div>
  );
  }