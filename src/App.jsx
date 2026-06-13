import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { supabase } from './supabase';
import { Lock, UserPlus, BookOpen, CheckSquare, Home, Search, Calendar, Trash2, Download, Filter, RefreshCw, Layers, FileText, Check } from 'lucide-react';

export default function App() {
  // Smart Session Lock (Menggunakan sessionStorage agar tidak melelahkan saat refresh halaman)
  const [isLocked, setIsLocked] = useState(() => {
    return sessionStorage.getItem('ustaz_auth') !== 'true';
  });
  
  const [tab, setTab] = useState('dashboard');
  const [subTabMurid, setSubTabMurid] = useState('santri');
  
  // State Utama Aplikasi
  const [tanggalAbsen, setTanggalAbsen] = useState(new Date().toISOString().split('T')[0]);
  const [pencarian, setPencarian] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [kelasTerpilihForm, setKelasTerpilihForm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // State Tambahan untuk Fitur Jurnal Mengajar
  const [materiInput, setMateriInput] = useState('');
  const [statusSimpanJurnal, setStatusSimpanJurnal] = useState(false);

  // Ambil Data Real-Time (Offline-First via Dexie.js)
  const murid = useLiveQuery(() => db.murid.toArray(), []);
  const daftarKelas = useLiveQuery(() => db.kelas.toArray(), []);
  const semuaAbsensi = useLiveQuery(() => db.absensi.where('tanggal').equals(tanggalAbsen).toArray(), [tanggalAbsen]);
  const semuaJurnal = useLiveQuery(() => db.jurnal.where('tanggal').equals(tanggalAbsen).toArray(), [tanggalAbsen]);

  // Efek Otomatis Mengisi Pilihan Kelas Default di Form
  useEffect(() => {
    if (daftarKelas && daftarKelas.length > 0 && !kelasTerpilihForm) {
      setKelasTerpilihForm(daftarKelas[0].nama);
    }
  }, [daftarKelas]);

  // Efek Otomatis Memuat Jurnal Materi saat Kelas atau Tanggal Diubah
  useEffect(() => {
    if (filterKelas !== 'Semua') {
      const jurnalAda = semuaJurnal?.find(j => j.kelas === filterKelas);
      setMateriInput(jurnalAda ? jurnalAda.materi : '');
    } else {
      setMateriInput('');
    }
    setStatusSimpanJurnal(false);
  }, [filterKelas, tanggalAbsen, semuaJurnal]);

  // --- LOGIKA UTAMA SINKRONISASI (ONLINE & OFFLINE) ---
  const sinkronData = async () => {
    setIsSyncing(true);
    try {
      const lokalKelas = await db.kelas.toArray();
      const lokalMurid = await db.murid.toArray();
      const lokalAbsen = await db.absensi.toArray();
      const lokalJurnal = await db.jurnal.toArray();

      // Unggah Data Lokal ke Supabase Cloud (Menggunakan Upsert berbasis ID)
      if (lokalKelas.length > 0) await supabase.from('kelas').upsert(lokalKelas);
      if (lokalMurid.length > 0) await supabase.from('murid').upsert(lokalMurid);
      if (lokalAbsen.length > 0) await supabase.from('absensi').upsert(lokalAbsen);
      if (lokalJurnal.length > 0) await supabase.from('jurnal').upsert(lokalJurnal);

      // Unduh Data Cloud Terbaru untuk Disimpan ke Memori HP (Offline Backup)
      const { data: cloudKelas } = await supabase.from('kelas').select('*');
      const { data: cloudMurid } = await supabase.from('murid').select('*');
      const { data: cloudAbsen } = await supabase.from('absensi').select('*');
      const { data: cloudJurnal } = await supabase.from('jurnal').select('*');

      if (cloudKelas) await db.kelas.bulkPut(cloudKelas);
      if (cloudMurid) await db.murid.bulkPut(cloudMurid);
      if (cloudAbsen) await db.absensi.bulkPut(cloudAbsen);
      if (cloudJurnal) await db.jurnal.bulkPut(cloudJurnal);

      alert('Alhamdulillah! Sinkronisasi berhasil. Data HP & Cloud sudah sama.');
    } catch (error) {
      console.error(error);
      alert('Koneksi Gagal: Pastikan kuota internet aktif / settingan Supabase benar.');
    }
    setIsSyncing(false);
  };

  // --- KELOLA DATA KELAS ---
  const tambahKelas = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const namaKelas = formData.get('namaKelas')?.trim();
    if (namaKelas) {
      const ada = await db.kelas.where('nama').equalsIgnoreCase(namaKelas).first();
      if (ada) return alert('Nama kelas tersebut sudah terdaftar!');
      await db.kelas.add({ nama: namaKelas });
      e.target.reset();
    }
  };

  const hapusKelas = async (id, nama) => {
    if (window.confirm(`Hapus kelas "${nama}"? Data murid di dalamnya tidak terhapus, namun status kelas mereka akan kosong.`)) {
      await db.kelas.delete(id);
    }
  };

  // --- KELOLA DATA MURID ---
  const tambahMurid = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nama = formData.get('nama')?.trim();
    if (!kelasTerpilihForm) return alert('Silakan buat data kelas terlebih dahulu!');
    if (nama && kelasTerpilihForm) {
      await db.murid.add({ nama, kelas: kelasTerpilihForm });
      e.target.reset();
      alert('Murid berhasil disimpan!');
    }
  };

  const hapusMurid = async (id, nama) => {
    if (window.confirm(`Hapus data ${nama}? Semua riwayat absensi anak ini juga akan dibersihkan dari HP.`)) {
      await db.murid.delete(id);
      const absensiTerkait = await db.absensi.where('murid_id').equals(id).toArray();
      await db.absensi.bulkDelete(absensiTerkait.map(a => a.id));
    }
  };

  // --- KELOLA ABSENSI & JURNAL MATERI ---
  const catatAbsen = async (muridId, status) => {
    const dataAda = await db.absensi.where({ murid_id: muridId, tanggal: tanggalAbsen }).first();
    if (dataAda) {
      await db.absensi.update(dataAda.id, { status });
    } else {
      await db.absensi.add({ murid_id: muridId, status, tanggal: tanggalAbsen });
    }
  };

  const simpanJurnalMateri = async () => {
    if (filterKelas === 'Semua') return alert('Silakan pilih salah satu kelas terlebih dahulu!');
    const dataAda = await db.jurnal.where({ kelas: filterKelas, tanggal: tanggalAbsen }).first();
    if (dataAda) {
      await db.jurnal.update(dataAda.id, { materi: materiInput });
    } else {
      await db.jurnal.add({ kelas: filterKelas, tanggal: tanggalAbsen, materi: materiInput });
    }
    setStatusSimpanJurnal(true);
    setTimeout(() => setStatusSimpanJurnal(false), 2050);
  };

  // --- SISTEM EKSPOR DATA KE LAPORAN EXCEL (.CSV) ---
  const eksporKeExcel = async () => {
    const allMurid = await db.murid.toArray();
    const allAbsen = await db.absensi.toArray();
    const allJurnal = await db.jurnal.toArray();
    
    if (allAbsen.length === 0) return alert('Belum ada rekaman absensi untuk diekspor!');

    let csv = "\uFEFF"; // Kode khusus BOM agar Microsoft Excel langsung membaca huruf/spasi Indonesia dengan rapi
    csv += "Tanggal,Nama Murid,Kelas,Status Kehadiran,Materi Yang Diajarkan Hari Itu\n";
    
    allAbsen.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    allAbsen.forEach(a => {
      const m = allMurid.find(m => m.id === a.murid_id);
      if (m) {
        const statusFull = a.status === 'H' ? 'Hadir' : a.status === 'I' ? 'Izin' : a.status === 'S' ? 'Sakit' : 'Alfa';
        const jurnalMateri = allJurnal.find(j => j.kelas === m.kelas && j.tanggal === a.tanggal);
        const teksMateri = jurnalMateri ? jurnalMateri.materi.replace(/"/g, '""') : '-';
        
        csv += `${a.tanggal},"${m.nama}","${m.kelas}",${statusFull},"${teksMateri}"\n`;
      }
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Lengkap_Absensi_Dan_Jurnal_Mengajar.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PROSES SARINGAN DATA (FILTER) ---
  const muridDifilter = murid?.filter(m => {
    const cocokNama = m.nama.toLowerCase().includes(pencarian.toLowerCase());
    const cocokKelas = filterKelas === 'Semua' || m.kelas === filterKelas;
    return cocokNama && cocokKelas;
  }) || [];
  
  const absensiSesuaiFilter = semuaAbsensi?.filter(a => {
    const m = murid?.find(m => m.id === a.murid_id);
    return m && (filterKelas === 'Semua' || m.kelas === filterKelas);
  }) || [];

  const totalHadir = absensiSesuaiFilter.filter(a => a.status === 'H').length || 0;
  const totalIzin = absensiSesuaiFilter.filter(a => a.status === 'I').length || 0;
  const totalSakit = absensiSesuaiFilter.filter(a => a.status === 'S').length || 0;
  const totalAlfa = absensiSesuaiFilter.filter(a => a.status === 'A').length || 0;

  // --- AKSES LAYAR KUNCI (PIN) ---
  const handlePinChange = (e) => {
    if (e.target.value === '1234') {
      sessionStorage.setItem('ustaz_auth', 'true');
      setIsLocked(false);
    }
  };

  if (isLocked) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-6 text-white">
      <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
        <Lock size={32} className="text-white" />
      </div>
      <h1 className="text-3xl font-black mb-1 tracking-tight">Buku Ustaz</h1>
      <p className="text-slate-400 mb-8 text-xs font-semibold uppercase tracking-widest">Wilayah Jember • Cabang Jember Timur</p>
      
      <input type="password" placeholder="PIN" maxLength="4" 
             className="text-black p-4 w-full max-w-sm rounded-2xl text-center mb-4 text-3xl tracking-[1em] outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all shadow-inner" 
             onChange={handlePinChange} autoFocus />
      <p className="text-xs text-slate-500">Masukkan PIN Keamanan Aplikasi</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-24 shadow-2xl relative">
      {/* HEADER UTAMA */}
      <header className="bg-white px-5 py-4 font-bold border-b text-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><BookOpen size={20}/></div>
          <span className="text-lg font-black tracking-tight text-slate-800">Buku Ustaz Pro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={sinkronData} disabled={isSyncing} className={`p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all ${isSyncing ? 'animate-spin text-emerald-600 bg-emerald-50' : ''}`}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => { sessionStorage.removeItem('ustaz_auth'); setIsLocked(true); }} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 rounded-lg transition-colors"><Lock size={16} /></button>
        </div>
      </header>
      
      <main className="p-4 space-y-4">
        {/* ================= TAB 1: BERANDA ================= */}
        {tab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl shadow-md relative overflow-hidden">
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">Database Aplikasi Umum</p>
              <h2 className="text-2xl font-black mb-4">Sistem Jurnal &amp; Absen</h2>
              <div className="grid grid-cols-2 gap-2 border-t border-white/20 pt-4 mt-2">
                <div>
                  <p className="text-emerald-200 text-xs">Total Semua Murid</p>
                  <p className="text-2xl font-black">{murid?.length || 0} <span className="text-xs font-normal">Santri</span></p>
                </div>
                <div>
                  <p className="text-emerald-200 text-xs">Total Kelas Terdaftar</p>
                  <p className="text-2xl font-black">{daftarKelas?.length || 0} <span className="text-xs font-normal">Kelas</span></p>
                </div>
              </div>
            </div>

            {/* Pintu Pintasan Cloud */}
            <div className="bg-white p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-sm">
              <div>
                <h4 className="font-bold text-sm text-slate-800">Sinkronisasi Cloud</h4>
                <p className="text-[11px] text-slate-400">Amankan data lokal ke database online Supabase</p>
              </div>
              <button onClick={sinkronData} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm">
                <RefreshCw size={12} /> Cloud Sync
              </button>
            </div>

            {/* Ekspor Laporan Komplit */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400"><Download size={16} className="text-blue-500"/> Ekspor Laporan Madrasah</h3>
              <p className="text-xs text-slate-500">Unduh data riwayat kehadiran santri beserta catatan materi ajar harian langsung ke file Excel (.CSV).</p>
              <button onClick={eksporKeExcel} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-600/10">
                <Download size={18}/> Ekspor ke Microsoft Excel
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-400 pt-8">Bantuan IT &amp; Desain No Cantik: 0853 1123 9333</p>
          </div>
        )}

        {/* ================= TAB 2: DATA SANTRI & KELAS ================= */}
        {tab === 'murid' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Navigasi Kecil */}
            <div className="bg-slate-200/70 p-1 rounded-xl grid grid-cols-2 text-center text-xs font-bold">
              <button onClick={() => setSubTabMurid('santri')} className={`py-2 rounded-lg transition-all ${subTabMurid === 'santri' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Kelola Data Murid</button>
              <button onClick={() => setSubTabMurid('kelas')} className={`py-2 rounded-lg transition-all ${subTabMurid === 'kelas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Kelola Data Kelas</button>
            </div>

            {/* SUB-TAB: KELOLA DATA KELAS */}
            {subTabMurid === 'kelas' && (
              <>
                <form onSubmit={tambahKelas} className="bg-white p-4 rounded-2xl border shadow-sm space-y-2">
                  <h3 className="font-bold text-slate-800 text-sm">Buat Kelas Baru</h3>
                  <div className="flex gap-2">
                    <input name="namaKelas" placeholder="Misal: Kelas 4 Daltim banin" className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs focus:bg-white focus:border-emerald-500 transition-all" required />
                    <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-4 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"><Layers size={14}/> Simpan</button>
                  </div>
                </form>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase px-1 tracking-wider">Daftar Kelas Tersimpan</p>
                  {daftarKelas?.map(k => (
                    <div key={k.id} className="p-3.5 bg-white rounded-xl border flex justify-between items-center shadow-sm">
                      <span className="font-bold text-slate-700 text-sm flex items-center gap-2"><Layers size={14} className="text-slate-400" /> {k.nama}</span>
                      <button onClick={() => hapusKelas(k.id, k.nama)} className="text-slate-300 hover:text-rose-600 p-1.5 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {daftarKelas?.length === 0 && <p className="text-center text-xs text-slate-400 py-6 border-2 border-dashed rounded-xl">Belum ada kelas yang dibuat.</p>}
                </div>
              </>
            )}

            {/* SUB-TAB: KELOLA DATA MURID */}
            {subTabMurid === 'santri' && (
              <>
                <form onSubmit={tambahMurid} className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-800 text-sm">Registrasi Pendaftaran Murid</h3>
                  <input name="nama" placeholder="Nama Lengkap Santri" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs" required />
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tempatkan di Kelas</label>
                    <select value={kelasTerpilihForm} onChange={(e) => setKelasTerpilihForm(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700">
                      {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                      {daftarKelas?.length === 0 && <option value="">-- Buat Kelas Terlebih Dahulu --</option>}
                    </select>
                  </div>

                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-600/10">
                    <UserPlus size={16}/> Daftarkan Santri Baru
                  </button>
                </form>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase px-1 tracking-wider">Database Seluruh Santri ({murid?.length || 0})</p>
                  {murid?.map(m => (
                    <div key={m.id} className="p-3.5 bg-white rounded-xl border flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{m.nama}</p>
                        <p className="text-[9px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 inline-block px-1.5 py-0.5 rounded-md mt-1">{m.kelas}</p>
                      </div>
                      <button onClick={() => hapusMurid(m.id, m.nama)} className="text-slate-300 hover:text-rose-600 p-2 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB 3: ABSENSI & JURNAL MATERI ================= */}
        {tab === 'absen' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Kontrol Saringan & Tanggal */}
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3 sticky top-[73px] z-20">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-slate-50 border p-2.5 rounded-xl">
                  <Calendar size={14} className="text-slate-400" />
                  <input type="date" value={tanggalAbsen} onChange={(e) => setTanggalAbsen(e.target.value)} className="w-full font-bold text-slate-700 text-xs bg-transparent outline-none" />
                </div>
                <div className="flex items-center gap-1 bg-slate-50 border p-2.5 rounded-xl">
                  <Filter size={14} className="text-slate-400" />
                  <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="w-full text-xs font-bold text-slate-700 bg-transparent outline-none">
                    <option value="Semua">Semua Kelas</option>
                    {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Cari nama santri..." value={pencarian} onChange={(e) => setPencarian(e.target.value)} className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs focus:bg-white focus:border-emerald-500 transition-all" />
              </div>

              {/* Grafik Statistik Kecil Kehadiran */}
              <div className="grid grid-cols-4 gap-1 pt-1.5 text-[11px] font-bold text-center border-t border-slate-100">
                <div className="text-emerald-600 bg-emerald-50 py-1 rounded-md">Hadir: {totalHadir}</div>
                <div className="text-blue-600 bg-blue-50 py-1 rounded-md">Izin: {totalIzin}</div>
                <div className="text-amber-600 bg-amber-50 py-1 rounded-md">Sakit: {totalSakit}</div>
                <div className="text-rose-600 bg-rose-50 py-1 rounded-md">Alfa: {totalAlfa}</div>
              </div>
            </div>

            {/* INPUT JURNAL MATERI AJAR */}
            {filterKelas !== 'Semua' && (
              <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-2">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><FileText size={14} className="text-emerald-600"/> Jurnal Materi ({filterKelas})</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Tulis Kitab, Bab, atau Halaman hari ini..." value={materiInput} onChange={(e) => setMateriInput(e.target.value)} className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs focus:bg-white focus:border-emerald-500 transition-all" />
                  <button onClick={simpanJurnalMateri} className={`px-4 rounded-xl font-bold text-xs flex items-center gap-1 text-white transition-all ${statusSimpanJurnal ? 'bg-emerald-500' : 'bg-slate-800 hover:bg-slate-900'}`}>
                    {statusSimpanJurnal ? <Check size={14}/> : 'Simpan'}
                  </button>
                </div>
              </div>
            )}

            {/* DAFTAR BARIS ABSENSI MODERN */}
            <div className="space-y-2">
              {muridDifilter.map(m => {
                const statusMurid = semuaAbsensi?.find(a => a.murid_id === m.id)?.status;
                const warnaTombol = {
                  'H': { aktif: 'bg-emerald-600 text-white ring-emerald-200', pasif: 'bg-slate-100 text-slate-600' },
                  'I': { aktif: 'bg-blue-600 text-white ring-blue-200', pasif: 'bg-slate-100 text-slate-600' },
                  'S': { aktif: 'bg-amber-500 text-white ring-amber-200', pasif: 'bg-slate-100 text-slate-600' },
                  'A': { aktif: 'bg-rose-600 text-white ring-rose-200', pasif: 'bg-slate-100 text-slate-600' },
                };

                return (
                  <div key={m.id} className="p-4 bg-white rounded-xl border border-slate-200/70 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-bold text-slate-800 text-sm">{m.nama}</span>
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[130px] shadow-sm">{m.kelas}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['H','I','S','A'].map(s => {
                        const isSelected = statusMurid === s;
                        const kelasWarna = isSelected ? warnaTombol[s].aktif + ' ring-4 shadow-sm font-black' : warnaTombol[s].pasif;
                        return (
                          <button key={s} onClick={() => catatAbsen(m.id, s)} className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${kelasWarna}`}>
                            {s === 'H' ? 'Hadir' : s === 'I' ? 'Izin' : s === 'S' ? 'Sakit' : 'Alfa'}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                );
              })}
              {muridDifilter.length === 0 && <div className="text-center p-12 text-slate-400 text-xs border-2 border-dashed rounded-2xl">Tidak ada santri yang sesuai filter.</div>}
            </div>
          </div>
        )}
      </main>

      {/* NAVIGASI NAV-BAR BAWAH */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200/80 flex justify-around p-2 z-30 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
        {[
          { id: 'dashboard', icon: Home, label: 'Beranda' },
          { id: 'murid', icon: UserPlus, label: 'Santri/Kelas' },
          { id: 'absen', icon: CheckSquare, label: 'Absensi' },
        ].map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} 
                  className={`flex flex-col items-center gap-1 p-2 w-20 rounded-xl transition-all duration-200 ${tab === item.id ? 'text-emerald-600 bg-emerald-50/80 font-black' : 'text-slate-400 hover:bg-slate-50'}`}>
            <item.icon size={20} className={tab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}/>
            <span className="text-[10px] tracking-wide font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
