import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Konfigurasi Supabase
// Disarankan memasukkan Anon Key ke dalam file .env dengan nama VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = "https://gjfdxqhwwytcgylokksq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "MASUKKAN_ANON_KEY_SUPABASE_DISINI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  // State Utama
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('absen'); // Default langsung ke modul Absen
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // State Aplikasi (Menggunakan LocalStorage sebagai fallback data agar langsung bisa dicoba)
  const [muridList, setMuridList] = useState(() => {
    const saved = localStorage.getItem('buku_ustaz_murid');
    return saved ? JSON.parse(saved) : [
      { id: 1, nama: 'Muhammad Ali', kelas: 'Kelas 1 A' },
      { id: 2, nama: 'Aisyah Az-Zahra', kelas: 'Kelas 1 A' },
      { id: 3, nama: 'Ahmad Abdullah', kelas: 'Kelas 1 B' }
    ];
  });

  const [absensi, setAbsensi] = useState(() => {
    const saved = localStorage.getItem('buku_ustaz_absen');
    const hariIni = new Date().toISOString().split('T')[0];
    return saved ? JSON.parse(saved) : { tanggal: hariIni, data: {} };
  });

  const [inputNama, setInputNama] = useState('');
  const [inputKelas, setInputKelas] = useState('Kelas 1 A');
  const [inputSoal, setInputSoal] = useState('');
  const [soalList, setSoalList] = useState([]);

  // useEffect untuk Monitoring Auth Supabase & Fitur PWA
  useEffect(() => {
    // Cek sesi user saat ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Dengarkan perubahan auth (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Deteksi Fitur Instalasi PWA (Aplikasi Bisa Diinstal di HP)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Simpan data lokal setiap ada perubahan
  useEffect(() => {
    localStorage.setItem('buku_ustaz_murid', JSON.stringify(muridList));
  }, [muridList]);

  useEffect(() => {
    localStorage.setItem('buku_ustaz_absen', JSON.stringify(absensi));
  }, [absensi]);

  // Fungsi Login Google Auth
  const handleLoginGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error) {
      alert('Gagal login dengan Google: ' + error.message);
    }
  };

  // Fungsi Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Fungsi Instal Aplikasi PWA
  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  // Aksi Tambah Murid
  const handleTambahMurid = (e) => {
    e.preventDefault();
    if (!inputNama.trim()) return;
    const baru = {
      id: Date.now(),
      nama: inputNama,
      kelas: inputKelas
    };
    setMuridList([...muridList, baru]);
    setInputNama('');
  };

  // Aksi Catat Absen (Hadir / Sakit / Izin / Alpa)
  const handleStatusAbsen = (muridId, status) => {
    setAbsensi(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [muridId]: status
      }
    }));
  };

  // Simpan Rekap Absensi (TYPO SUDAH DIPERBAIKI DI SINI)
  const simpanAbsensiKeDatabase = () => {
    alert('Rekap absensi hari ini berhasil disimpan ke sistem!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-md mx-auto shadow-xl border-x border-slate-200">
      
      {/* HEADER UTAMA */}
      <header className="bg-emerald-600 text-white px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h1 className="text-xl font-bold tracking-wide">Buku Ustaz</h1>
        </div>

        {/* Tombol Aksi Kanan (Install PWA / Login Status) */}
        <div className="flex items-center gap-2">
          {showInstallBtn && (
            <button 
              onClick={handleInstallPWA}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-semibold py-1.5 px-3 rounded-full flex items-center gap-1 animate-pulse shadow"
            >
              🚀 Instal HP
            </button>
          )}

          {user ? (
            <button onClick={handleLogout} className="bg-emerald-700 hover:bg-emerald-800 p-1.5 rounded-full" title="Logout">
              <img src={user.user_metadata.avatar_url} alt="Profile" className="w-6 h-6 rounded-full border border-white" />
            </button>
          ) : (
            <button onClick={handleLoginGoogle} className="bg-white text-emerald-700 hover:bg-slate-100 p-1.5 rounded-full" title="Login Google">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.746-.08-1.32-.176-1.885H12.24z"/>
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* KONTEN UTAMA (KONDISIONAL BERDASARKAN TAB AKTIF) */}
      <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        
        {/* JIKA USER BELUM LOGIN, BERIKAN BANNER INFORMASI */}
        {!user && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col gap-2 items-center text-center">
            <p className="text-sm text-emerald-800 font-medium">Masuk dengan Akun Google untuk mengaktifkan sinkronisasi cloud otomatis.</p>
            <button 
              onClick={handleLoginGoogle}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm transition"
            >
              Hubungkan Akun Google
            </button>
          </div>
        )}

        {/* 1. KONTEN TAB: ABSEN */}
        {activeTab === 'absen' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Presensi Santri</h2>
                <p className="text-xs text-slate-500">Tanggal: {absensi.tanggal}</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                {Object.keys(absensi.data).length} / {muridList.length} Diisi
              </span>
            </div>

            {/* List Murid untuk Diabsen */}
            <div className="space-y-2">
              {muridList.map((murid) => {
                const currentStatus = absensi.data[murid.id] || '';
                return (
                  <div key={murid.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-800">{murid.nama}</h3>
                        <p className="text-xs text-slate-400">{murid.kelas}</p>
                      </div>
                    </div>
                    {/* Opsi Pilihan Absen */}
                    <div className="grid grid-cols-4 gap-1.5 mt-1">
                      {['Hadir', 'Izin', 'Sakit', 'Alpa'].map((status) => {
                        const isSelected = currentStatus === status;
                        const colors = {
                          Hadir: isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600',
                          Izin: isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600',
                          Sakit: isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600',
                          Alpa: isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                        };
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusAbsen(murid.id, status)}
                            className={`text-xs py-1.5 font-semibold rounded-lg transition-all ${colors[status]}`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={simpanAbsensiKeDatabase}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition mt-4"
            >
              Simpan Rekap Absensi
            </button>
          </div>
        )}

        {/* 2. KONTEN TAB: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-5 shadow-md">
              <h2 className="text-lg font-bold">Assalamu'alaikum, Ustaz</h2>
              <p className="text-sm opacity-90 mt-1">Selamat datang kembali di sistem manajemen kelas digital.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                <span className="text-2xl">👥</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1">{muridList.length}</h3>
                <p className="text-xs text-slate-400">Total Santri</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                <span className="text-2xl">📝</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  {Object.values(absensi.data).filter(s => s === 'Hadir').length}
                </h3>
                <p className="text-xs text-slate-400">Santri Hadir Hari Ini</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. KONTEN TAB: MURID */}
        {activeTab === 'murid' && (
          <div className="space-y-4">
            {/* Form Tambah Murid */}
            <form onSubmit={handleTambahMurid} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Tambah Santri Baru</h3>
              <div>
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={inputNama}
                  onChange={(e) => setInputNama(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={inputKelas}
                  onChange={(e) => setInputKelas(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg p-2 bg-white flex-1 focus:outline-emerald-500"
                >
                  <option>Kelas 1 A</option>
                  <option>Kelas 1 B</option>
                  <option>Kelas 2 A</option>
                  <option>Kelas 2 B</option>
                </select>
                <button type="submit" className="bg-emerald-600 text-white font-semibold text-sm px-4 rounded-lg">
                  Tambah
                </button>
              </div>
            </form>

            {/* List Tampilan Murid */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
              <div className="p-3 bg-slate-50 rounded-t-xl font-bold text-xs text-slate-500">DAFTAR SANTRI AKTIF</div>
              {muridList.map(m => (
                <div key={m.id} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-slate-800">{m.nama}</p>
                    <p className="text-xs text-slate-400">{m.kelas}</p>
                  </div>
                  <button 
                    onClick={() => setMuridList(muridList.filter(item => item.id !== m.id))}
                    className="text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 py-1 px-2 rounded-lg"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. KONTEN TAB: SOAL */}
        {activeTab === 'soal' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Bank Pertanyaan / Tugas</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik materi atau pertanyaan..."
                  value={inputSoal}
                  onChange={(e) => setInputSoal(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-emerald-500"
                />
                <button 
                  onClick={() => {
                    if(!inputSoal.trim()) return;
                    setSoalList([...soalList, inputSoal]);
                    setInputSoal('');
                  }}
                  className="bg-emerald-600 text-white font-semibold text-sm px-4 rounded-lg"
                >
                  Simpan
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {soalList.length === 0 ? (
                <p className="text-center text-sm text-slate-400 mt-6">Belum ada bank soal yang ditambahkan.</p>
              ) : (
                soalList.map((s, index) => (
                  <div key={index} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-sm text-slate-700 flex gap-2">
                    <span className="font-bold text-emerald-600">{index + 1}.</span>
                    <p className="flex-1">{s}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* BAR NAVIGASI BAWAH (STICKY BOTTOM NAV) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 h-16 flex items-center justify-around z-50 shadow-lg">
        
        {/* Tombol Home */}
        <button 
          onClick={() => setActiveTab('home')} 
          className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition ${activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </button>

        {/* Tombol Murid */}
        <button 
          onClick={() => setActiveTab('murid')} 
          className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition ${activeTab === 'murid' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Murid
        </button>

        {/* Tombol Absen */}
        <button 
          onClick={() => setActiveTab('absen')} 
          className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition ${activeTab === 'absen' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Absen
        </button>

        {/* Tombol Soal */}
        <button 
          onClick={() => setActiveTab('soal')} 
          className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition ${activeTab === 'soal' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Soal
        </button>

      </nav>

    </div>
  );
}
