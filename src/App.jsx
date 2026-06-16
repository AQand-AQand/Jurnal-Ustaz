import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Konfigurasi Koneksi Supabase Anda
const SUPABASE_URL = "https://gjfdxqhwwytcgylokksq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);

  // --- State Komponen Data Base ---
  const [muridList, setMuridList] = useState([]);
  const [formSantri, setFormSantri] = useState({ nama: '', kelas: 'Kelas 1 A', alamat: '', domisili: '' });

  // --- State Komponen Modul Soal ---
  const [modeSoal, setModeSoal] = useState('menu'); // Pilihan: 'menu', 'buat', 'bank'
  const [formSoal, setFormSoal] = useState({ pelajaran: '', kelas: 'Kelas 1 A', batasan: '', isi: '' });
  const [listBankSoal, setListBankSoal] = useState([]);
  const [folderTerpilih, setFolderTerpilih] = useState(null);

  // Efek Siklus Pertama Kali Aplikasi Dijalankan
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    loadLocalData();
    return () => subscription.unsubscribe();
  }, []);

  // Otomatis Sinkronisasi Saat Ustadz Berhasil Terhubung Akun Google
  useEffect(() => { 
    if (user) syncSemuaData(); 
  }, [user]);

  // Membaca Backup Data Lokal di HP (Fitur Offline)
  const loadLocalData = () => {
    const s = localStorage.getItem('local_santri');
    const b = localStorage.getItem('local_bank_soal');
    if (s) setMuridList(JSON.parse(s));
    if (b) setListBankSoal(JSON.parse(b));
  };

  // Sinkronisasi Ganda Menarik Data Terbaru dari Cloud Supabase
  const syncSemuaData = async () => {
    setLoading(true);
    const { data: s } = await supabase.from('santri').select('*').order('nama');
    const { data: b } = await supabase.from('bank_soal').select('*').order('created_at', { ascending: false });
    if (s) { setMuridList(s); localStorage.setItem('local_santri', JSON.stringify(s)); }
    if (b) { setListBankSoal(b); localStorage.setItem('local_bank_soal', JSON.stringify(b)); }
    setLoading(false);
  };

  // Aksi Tombol Simpan Profil Santri ke Data Base
  const handleSimpanSantri = async (e) => {
    e.preventDefault();
    if (!formSantri.nama) return alert("Nama santri wajib diisi!");
    
    const baru = { ...formSantri, id: Date.now() };
    const updateList = [...muridList, baru];
    
    // Simpan Offline Terlebih Dahulu
    setMuridList(updateList);
    localStorage.setItem('local_santri', JSON.stringify(updateList));
    
    // Dorong ke Online Cloud jika Akun Google Aktif
    if (user) {
      await supabase.from('santri').insert([formSantri]);
    }
    
    setFormSantri({ nama: '', kelas: 'Kelas 1 A', alamat: '', domisili: '' });
    alert("Data berhasil ditambahkan ke Data Base!");
  };

  // Aksi Tombol Simpan Soal (Menyimpan Ganda: Offline & Online)
  const handleSimpanSoal = async () => {
    if (!formSoal.pelajaran || !formSoal.isi) {
      return alert("Mohon isi nama Fan Pelajaran dan Kolom Soal terlebih dahulu!");
    }
    
    const baru = { ...formSoal, id: Date.now(), isi_soal: formSoal.isi };
    const updateBank = [baru, ...listBankSoal];
    
    // 1. Simpan Instan ke Memori HP (Offline Aman)
    setListBankSoal(updateBank);
    localStorage.setItem('local_bank_soal', JSON.stringify(updateBank));
    
    // 2. Kirim ke Database Cloud Supabase
    if (user) {
      await supabase.from('bank_soal').insert([{
        pelajaran: formSoal.pelajaran.trim(),
        kelas: formSoal.kelas,
        batasan: formSoal.batasan,
        isi_soal: formSoal.isi,
        ustadz_email: user.email
      }]);
    }
    
    setFormSoal({ pelajaran: '', kelas: 'Kelas 1 A', batasan: '', isi: '' });
    alert("Soal berhasil disimpan di HP (Offline) & Cloud (Online)!");
    setModeSoal('menu');
  };

  // Logika Otomatis Pengelompokan Menjadi Folder Berdasarkan Fan/Pelajaran
  const folders = listBankSoal.reduce((acc, item) => {
    const namaFan = item.pelajaran || "Lainnya";
    if (!acc[namaFan]) acc[namaFan] = [];
    acc[namaFan].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200 overflow-hidden">
      
      {/* 🟢 TOP NAVIGATION BAR */}
      <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-book-open text-lg"></i>
          <h1 className="text-xl font-bold tracking-tight">Buku Ustaz <span className="text-[10px] bg-emerald-850 px-2 py-0.5 rounded-full ml-1">v2.0</span></h1>
        </div>
        {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
      </header>

      {/* 📱 KONTEN UTAMA (SCROLLABLE) */}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-28">
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-5">
             <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-3xl text-white shadow-lg mb-4 relative overflow-hidden">
                <div className="absolute right-[-20px] bottom-[-20px] text-emerald-500 text-9xl font-black opacity-20">📚</div>
                <h2 className="text-xl font-bold">Ahlan wa Sahlan,</h2>
                <p className="text-xs opacity-90 mt-1">Sistem manajemen madrasah berbasis cloud dan offline siap digunakan.</p>
                
                {!user ? (
                  <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="mt-4 bg-white text-emerald-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-2 hover:bg-emerald-50 transition">
                    <i className="fa-brands fa-google text-red-500"></i> Hubungkan Akun Google
                  </button>
                ) : (
                  <div className="mt-4 inline-flex items-center gap-2 bg-emerald-900/40 px-3 py-1.5 rounded-lg text-xs font-medium">
                    <div className="w-2 height-2 w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                    Terhubung: {user.email}
                  </div>
                )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                   <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Data Base Santri</span>
                   <p className="text-3xl font-black text-emerald-600 mt-2">{muridList.length} <span className="text-xs font-normal text-slate-400">Anak</span></p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                   <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Koleksi Bank Soal</span>
                   <p className="text-3xl font-black text-emerald-600 mt-2">{listBankSoal.length} <span className="text-xs font-normal text-slate-400">Soal</span></p>
                </div>
             </div>
          </div>
        )}

        {/* TAB 2: DATA BASE (Pembaruan Fitur Menu Murid) */}
        {activeTab === 'database' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 space-y-3">
              <div className="flex items-center gap-2 border-b pb-2 mb-1">
                <i className="fa-solid fa-user-plus text-emerald-600"></i>
                <h3 className="font-bold text-slate-800 text-sm">Pendaftaran Data Base Santri</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Nama Lengkap</label>
                <input type="text" placeholder="Masukkan nama lengkap santri" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none bg-slate-50/50" value={formSantri.nama} onChange={e => setFormSantri({...formSantri, nama: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Kelas Madrasah</label>
                <select className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-slate-50/50 outline-none focus:ring-2 ring-emerald-500" value={formSantri.kelas} onChange={e => setFormSantri({...formSantri, kelas: e.target.value})}>
                  {['Kelas 1 A', 'Kelas 1 B', 'Kelas 2 A', 'Kelas 2 B'].map(k => <option key={k}>{k}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Alamat Rumah</label>
                <input type="text" placeholder="Contoh: Kaliwates, Jember" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none bg-slate-50/50" value={formSantri.alamat} onChange={e => setFormSantri({...formSantri, alamat: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Domisili Tinggal</label>
                <input type="text" placeholder="Contoh: Asrama Sunan Ampel / Luar Pondok" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none bg-slate-50/50" value={formSantri.domisili} onChange={e => setFormSantri({...formSantri, domisili: e.target.value})} />
              </div>

              <button onClick={handleSimpanSantri} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition shadow-md mt-2 flex items-center justify-center gap-2">
                <i className="fa-solid fa-floppy-disk"></i> Simpan ke Data Base
              </button>
            </div>
            
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Daftar Santri Aktif</p>
              {muridList.map(m => (
                <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                  <div className="absolute right-3 top-3 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase px-2 py-1 rounded-md">
                    {m.kelas}
                  </div>
                  <p className="font-bold text-slate-800 pr-16">{m.nama}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                    <p className="truncate">📍 <span className="font-medium">Alamat:</span> {m.alamat || '-'}</p>
                    <p className="truncate">🏠 <span className="font-medium">Domisili:</span> {m.domisili || '-'}</p>
                  </div>
                </div>
              ))}
              {muridList.length === 0 && <p className="text-center text-xs text-slate-400 py-6">Belum ada data santri di database.</p>}
            </div>
          </div>
        )}

        {/* TAB 3: MODUL SOAL */}
        {activeTab === 'soal' && (
          <div className="space-y-4">
            
            {/* TAMPILAN MENU UTAMA SOAL */}
            {modeSoal === 'menu' && (
              <div className="space-y-4 pt-4">
                <div className="text-center pb-2">
                  <h3 className="font-bold text-slate-800 text-base">Modul Ujian & Bank Soal</h3>
                  <p className="text-xs text-slate-400">Kelola pembuatan dan arsip berkas soal ujian madrasah</p>
                </div>
                
                <button onClick={() => setModeSoal('buat')} className="w-full bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 text-left hover:border-emerald-500 transition group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">Buat Soal Ujian Baru</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Tulis lembar pertanyaan ujian baru secara instan</span>
                  </div>
                </button>

                <button onClick={() => setModeSoal('bank')} className="w-full bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 text-left hover:border-emerald-500 transition group">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl group-hover:bg-amber-500 group-hover:text-white transition">
                    <i className="fa-solid fa-folder-open"></i>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">Buka Bank Soal Arsip</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Lihat kumpulan soal otomatis terkelompok per-Fan</span>
                  </div>
                </button>
              </div>
            )}

            {/* FITUR 1: FORMULIR BUAT SOAL */}
            {modeSoal === 'buat' && (
              <div className="space-y-4">
                <button onClick={() => setModeSoal('menu')} className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  <i className="fa-solid fa-arrow-left"></i> Kembali ke Menu Soal
                </button>
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-file-pen text-emerald-600"></i> Lembar Formulir Soal Baru
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Fan / Pelajaran</label>
                      <input type="text" placeholder="Misal: Tauhid, Fiqih" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none bg-slate-50/50" value={formSoal.pelajaran} onChange={e => setFormSoal({...formSoal, pelajaran: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Untuk Kelas</label>
                      <select className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-slate-50/50 outline-none focus:ring-2 ring-emerald-500" value={formSoal.kelas} onChange={e => setFormSoal({...formSoal, kelas: e.target.value})}>
                         {['Kelas 1 A', 'Kelas 1 B', 'Kelas 2 A', 'Kelas 2 B'].map(k => <option key={k}>{k}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Batasan Ruang Lingkup Materi</label>
                    <input type="text" placeholder="Contoh: Bab 1 s/d 4 atau Semester Ganjil" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none bg-slate-50/50" value={formSoal.batasan} onChange={e => setFormSoal({...formSoal, batasan: e.target.value})} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Layar Lembar Kosong Soal</label>
                    <textarea placeholder="Tuliskan butir-butir soal pertanyaan di sini secara urut..." rows="9" className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 ring-emerald-500 outline-none bg-slate-50 font-mono" value={formSoal.isi} onChange={e => setFormSoal({...formSoal, isi: e.target.value})}></textarea>
                  </div>

                  <button onClick={handleSimpanSoal} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                    <i className="fa-solid fa-cloud-arrow-up"></i> 💾 Save Offline & Online
                  </button>
                </div>
              </div>
            )}

            {/* FITUR 2: BANK SOAL BERBASIS FOLDER OTOMATIS */}
            {modeSoal === 'bank' && (
              <div className="space-y-4">
                <button onClick={() => { if(folderTerpilih) setFolderTerpilih(null); else setModeSoal('menu'); }} className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  <i className="fa-solid fa-arrow-left"></i> {folderTerpilih ? "Keluar Folder" : "Kembali ke Menu Soal"}
                </button>
                
                {/* 📂 Tampilan Folder Grid Utama */}
                {!folderTerpilih ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(folders).map(fan => (
                      <button key={fan} onClick={() => setFolderTerpilih(fan)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/70 flex flex-col items-center text-center gap-2 hover:border-amber-400 hover:bg-amber-50/20 transition relative overflow-hidden group">
                        <span className="text-5xl text-amber-400 group-hover:scale-110 transition duration-200">📁</span>
                        <span className="font-bold text-slate-800 text-xs truncate w-full mt-1">Soal {fan}</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-medium">{folders[fan].length} Berkas</span>
                      </button>
                    ))}
                    {Object.keys(folders).length === 0 && (
                      <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-dashed text-slate-400">
                        <p className="text-3xl">📭</p>
                        <p className="text-xs mt-2 font-medium">Belum ada arsip soal yang tersimpan.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 📑 Tampilan Kumpulan Soal di Dalam Folder yang Terpilih */
                  <div className="space-y-3.5">
                    <div className="bg-amber-50 border border-amber-200/70 p-3 rounded-xl flex items-center gap-2 text-amber-800">
                      <span>📂</span>
                      <p className="text-xs font-bold">Arsip Folder: <span className="underline uppercase">{folderTerpilih}</span></p>
                    </div>
                    
                    {folders[folderTerpilih].map(s => (
                      <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{s.kelas}</span>
                          <span className="text-emerald-600">📖 {s.batasan || "Semua Materi"}</span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">{s.isi_soal || s.isi}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* 📱 BOTTOM NAVIGATION BAR (BOTTOM NAV) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200/80 h-22 flex items-center justify-around z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.04)] px-3">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center w-full py-2 transition ${activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400'}`}>
           <i className={`fa-solid fa-house mb-1 text-base ${activeTab === 'home' ? 'text-lg' : ''}`}></i>
           <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
        </button>
        <button onClick={() => setActiveTab('database')} className={`flex flex-col items-center justify-center w-full py-2 transition ${activeTab === 'database' ? 'text-emerald-600' : 'text-slate-400'}`}>
           <i className={`fa-solid fa-database mb-1 text-base ${activeTab === 'database' ? 'text-lg' : ''}`}></i>
           <span className="text-[9px] font-bold uppercase tracking-wider">Data Base</span>
        </button>
        <button onClick={() => { setActiveTab('soal'); setModeSoal('menu'); }} className={`flex flex-col items-center justify-center w-full py-2 transition ${activeTab === 'soal' ? 'text-emerald-600' : 'text-slate-400'}`}>
           <i className={`fa-solid fa-file-lines mb-1 text-base ${activeTab === 'soal' ? 'text-lg' : ''}`}></i>
           <span className="text-[9px] font-bold uppercase tracking-wider">Soal</span>
        </button>
      </nav>

    </div>
  );
}
