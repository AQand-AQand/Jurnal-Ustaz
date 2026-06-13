import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Lock, UserPlus, BookOpen, CheckSquare, Home, Search, Calendar, Trash2, FileSpreadsheet, FileWord, Filter } from 'lucide-react';

// Daftar Kelas Sesuai Kebutuhan Ustaz
const DAFTAR_KELAS = [
  "Kelas 4 Daltim banin",
  "Kelas 6 daltim banat",
  "Kelas 1 Ulya dalbar",
  "Kelas 2 ulya dalbar"
];

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [tab, setTab] = useState('dashboard');
  
  // State Navigasi & Filter Modern
  const [tanggalAbsen, setTanggalAbsen] = useState(new Date().toISOString().split('T')[0]);
  const [pencarian, setPencarian] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [pilihKelasBaru, setPilihKelasBaru] = useState(DAFTAR_KELAS[0]);

  // Pengambilan Data Real-Time dari Database Lokal (Dexie)
  const murid = useLiveQuery(() => db.murid.toArray(), []);
  const semuaAbsensi = useLiveQuery(() => db.absensi.where('tanggal').equals(tanggalAbsen).toArray(), [tanggalAbsen]);

  // --- FUNGSI MANAJEMEN MURID ---
  const tambahMurid = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nama = formData.get('nama');
    if (nama && pilihKelasBaru) {
      await db.murid.add({ nama, kelas: pilihKelasBaru });
      e.target.reset();
      alert(`Berhasil menambahkan ${nama}`);
    }
  };

  const hapusMurid = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus murid bernama "${nama}"? Semua riwayat absennya juga akan terhapus.`)) {
      await db.murid.delete(id);
      const absensiTerkait = await db.absensi.where('murid_id').equals(id).toArray();
      const idAbsensi = absensiTerkait.map(a => a.id);
      await db.absensi.bulkDelete(idAbsensi);
    }
  };

  // --- FUNGSI ABSENSI MODERN ---
  const catatAbsen = async (muridId, status) => {
    const dataAda = await db.absensi.where({ murid_id: muridId, tanggal: tanggalAbsen }).first();
    if (dataAda) {
      await db.absensi.update(dataAda.id, { status });
    } else {
      await db.absensi.add({ murid_id: muridId, status, tanggal: tanggalAbsen });
    }
  };

  // --- LOGIKA FILTER DATA ---
  const muridDifilter = murid?.filter(m => {
    const cocokNama = m.nama.toLowerCase().includes(pencarian.toLowerCase());
    const cocokKelas = filterKelas === 'Semua' || m.kelas === filterKelas;
    return cocokNama && cocokKelas;
  }) || [];

  // Rekap Statistik Hari Ini
  const totalHadir = semuaAbsensi?.filter(a => a.status === 'H').length || 0;
  const totalIzin = semuaAbsensi?.filter(a => a.status === 'I').length || 0;
  const totalSakit = semuaAbsensi?.filter(a => a.status === 'S').length || 0;
  const totalAlfa = semuaAbsensi?.filter(a => a.status === 'A').length || 0;

  // --- FITUR EKSPOR DATA (EXCEL & WORD) ---
  const eksporKeExcel = async () => {
    const dataMurid = await db.murid.toArray();
    const dataAbsen = await db.absensi.toArray();
    if (dataAbsen.length === 0) return alert('Belum ada data absensi untuk diekspor!');

    const petaMurid = {};
    dataMurid.forEach(m => petaMurid[m.id] = m);

    let isiCSV = "\uFEFF"; // BOM untuk Excel agar mendukung karakter Indonesia dengan rapi
    isiCSV += "Tanggal,Nama Murid,Kelas,Status Kehadiran\n";

    dataAbsen.forEach(a => {
      const m = petaMurid[a.murid_id] || { nama: 'Dihapus', kelas: '-' };
      const statusPanjang = a.status === 'H' ? 'Hadir' : a.status === 'I' ? 'Izin' : a.status === 'S' ? 'Sakit' : 'Alfa';
      isiCSV += `"${a.tanggal}","${m.nama}","${m.kelas}","${statusPanjang}"\n`;
    });

    stewardDownload(isiCSV, `Laporan_Absen_Excel_${tanggalAbsen}.csv`, 'text/csv;charset=utf-8;');
  };

  const eksporKeWord = async () => {
    const dataMurid = await db.murid.toArray();
    const dataAbsen = await db.absensi.toArray();
    if (dataAbsen.length === 0) return alert('Belum ada data absensi untuk diekspor!');

    const petaMurid = {};
    dataMurid.forEach(m => petaMurid[m.id] = m);

    let htmlWord = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>Laporan Absensi Buku Ustaz</title><style>table {border-collapse:collapse; width:100%;} th,td {border:1px solid #333; padding:8px; text-align:left;} th {background-color:#f2f2f2; font-weight:bold;}</style></head>
    <body>
      <h2 style='text-align:center;'>LAPORAN REKAPITULASI ABSENSI MURID</h2>
      <p style='text-align:center;'>Cabang Jember Timur - WILAYAH JEMBER</p>
      <hr/>
      <table border='1'>
        <thead>
          <tr><th>Tanggal</th><th>Nama Murid</th><th>Kelas</th><th>Status</th></tr>
        </thead>
        <tbody>`;

    dataAbsen.forEach(a => {
      const m = petaMurid[a.murid_id] || { nama: 'Dihapus', kelas: '-' };
      const statusPanjang = a.status === 'H' ? 'Hadir' : a.status === 'I' ? 'Izin' : a.status === 'S' ? 'Sakit' : 'Alfa';
      htmlWord += `<tr><td>${a.tanggal}</td><td>${m.nama}</td><td>${m.kelas}</td><td><b>${statusPanjang}</b></td></tr>`;
    });

    htmlWord += `</tbody></table></body></html>`;
    stewardDownload(htmlWord, `Laporan_Absen_Word_${tanggalAbsen}.doc`, 'application/msword');
  };

  const stewardDownload = (konten, namaFile, tipeMime) => {
    const blob = new Blob([konten], { type: tipeMime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", namaFile);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- HALAMAN KUNCI PIN ---
  if (isLocked) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-6 text-white text-center">
      <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30 animate-pulse">
        <Lock size={32} className="text-white" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-1">Buku Ustaz Pro</h1>
      <p className="text-slate-400 mb-8 font-medium text-sm">Cabang Jember Timur • WILAYAH JEMBER</p>
      
      <input type="password" placeholder="••••" maxLength="4" 
             className="text-black p-4 w-full max-w-sm rounded-2xl text-center mb-4 text-3xl tracking-[0.5em] font-bold outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all shadow-inner" 
             onChange={(e) => { if(e.target.value === '1234') setIsLocked(false); }} autoFocus />
      <p className="text-xs text-slate-500">Masukkan 4 digit PIN Pengaman</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-24 shadow-2xl relative flex flex-col justify-between selection:bg-emerald-200">
      <div>
        {/* HEADER UTAMA */}
        <header className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <BookOpen size={20}/>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Buku Ustaz Pro</h1>
              <p className="text-[10px] text-slate-400 font-medium">Jember Timur</p>
            </div>
          </div>
          <button onClick={() => setIsLocked(true)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-lg transition-colors">
            <Lock size={16} />
          </button>
        </header>
        
        <main className="p-4 space-y-4">
          
          {/* ================= TAB BERANDA ================= */}
          {tab === 'dashboard' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Banner Utama */}
              <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <p className="text-emerald-200 text-xs font-bold tracking-wider uppercase mb-1">Selamat Datang Ustaz</p>
                <h2 className="text-2xl font-bold leading-tight">Aplikasi Pengendali Kelas & Rekap Absen</h2>
                <div className="mt-6 flex justify-between items-center border-t border-white/20 pt-4">
                  <div>
                    <p className="text-emerald-100 text-[10px] uppercase font-bold">Total Santri Terdaftar</p>
                    <p className="text-3xl font-black">{murid?.length || 0} <span className="text-xs font-normal">Anak</span></p>
                  </div>
                  <span className="text-[11px] bg-white/20 px-3 py-1 rounded-full font-semibold backdrop-blur-sm">Offline-Ready</span>
                </div>
              </div>

              {/* Box Statistik Kehadiran */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Calendar size={16} className="text-emerald-600"/> Statistik Kehadiran Hari Ini
                  </h3>
                  <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">{tanggalAbsen}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase mb-0.5">Hadir</p>
                    <p className="text-xl font-black text-emerald-700">{totalHadir}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold uppercase mb-0.5">Izin</p>
                    <p className="text-xl font-black text-blue-700">{totalIzin}</p>
                  </div>
                  <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                    <p className="text-[10px] text-amber-600 font-bold uppercase mb-0.5">Sakit</p>
                    <p className="text-xl font-black text-amber-700">{totalSakit}</p>
                  </div>
                  <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
                    <p className="text-[10px] text-rose-600 font-bold uppercase mb-0.5">Alfa</p>
                    <p className="text-xl font-black text-rose-700">{totalAlfa}</p>
                  </div>
                </div>
              </div>

              {/* PANEL EKSPOR DATA LAPORAN */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Unduh Dokumen Laporan</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Ekspor seluruh riwayat absensi santri yang tersimpan di sistem ke dalam format Microsoft Excel atau Word untuk pelaporan berkala.</p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button onClick={eksporKeExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm shadow-emerald-600/20">
                    <FileSpreadsheet size={16}/> Ekspor ke Excel
                  </button>
                  <button onClick={eksporKeWord} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm shadow-blue-600/20">
                    <FileWord size={16}/> Ekspor ke Word
                  </button>
                </div>
              </div>

              <div className="text-center pt-4">
                 <p className="text-[10px] text-slate-400">Kontak Pengembang IT: 0853 1123 9333</p>
              </div>
            </div>
          )}

          {/* ================= TAB MURID ================= */}
          {tab === 'murid' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Form Input Tambah Murid */}
              <form onSubmit={tambahMurid} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Pendaftaran Murid Baru</h3>
                <div className="space-y-2">
                  <input name="nama" placeholder="Nama Lengkap Santri" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all" required />
                  
                  {/* Dropdown pilihan kelas otomatis */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-bold uppercase">Pilih Kelas</label>
                    <select 
                      value={pilihKelasBaru} 
                      onChange={(e) => setPMRstate(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-700"
                    >
                      {DAFTAR_KELAS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm">
                  <UserPlus size={16}/> Daftarkan Murid
                </button>
              </form>

              {/* Daftar Tampilan Murid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Santri ({murid?.length || 0})</p>
                  
                  {/* Filter Kelas Pendukung */}
                  <select 
                    value={filterKelas} 
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="text-xs font-bold text-emerald-600 bg-emerald-50 border-none rounded-lg p-1.5 outline-none"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {DAFTAR_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {muridDifilter.map(m => (
                    <div key={m.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{m.nama}</p>
                        <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-1">{m.kelas}</p>
                      </div>
                      <button onClick={() => hapusMurid(m.id, m.nama)} className="text-slate-300 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {muridDifilter.length === 0 && (
                    <div className="text-center p-8 text-slate-400 border border-dashed rounded-xl text-xs">Belum ada murid di kategori kelas ini</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB ABSENSI MODERN ================= */}
          {tab === 'absen' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              
              {/* Header Kontrol Panel Absensi */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 sticky top-[72px] z-20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar size={16} className="text-slate-400" />
                    <input 
                      type="date" 
                      value={tanggalAbsen} 
                      onChange={(e) => setTanggalAbsen(e.target.value)}
                      className="w-full p-1 font-bold text-slate-700 text-sm outline-none bg-transparent"
                    />
                  </div>
                  
                  <select 
                    value={filterKelas} 
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-slate-100 rounded-xl p-2 outline-none border-none"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {DAFTAR_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari nama santri..." 
                    value={pencarian}
                    onChange={(e) => setPencarian(e.target.value)}
                    className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-xs transition-all"
                  />
                </div>
              </div>

              {/* Grid Barisan Kartu Absen Modern */}
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {muridDifilter.map(m => {
                  const statusMurid = semuaAbsensi?.find(a => a.murid_id === m.id)?.status;
                  
                  // Palet warna tombol modern saat ditekan/aktif
                  const warnaTombol = {
                    'H': { aktif: 'bg-emerald-500 text-white ring-emerald-100', pasif: 'bg-slate-50 text-slate-600 hover:bg-emerald-50' },
                    'I': { aktif: 'bg-blue-500 text-white ring-blue-100', pasif: 'bg-slate-50 text-slate-600 hover:bg-blue-50' },
                    'S': { aktif: 'bg-amber-500 text-white ring-amber-100', pasif: 'bg-slate-50 text-slate-600 hover:bg-amber-50' },
                    'A': { aktif: 'bg-rose-500 text-white ring-rose-100', pasif: 'bg-slate-50 text-slate-600 hover:bg-rose-50' },
                  };

                  return (
                    <div key={m.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2.5">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 text-sm leading-tight">{m.nama}</span>
                        <span className="text-[9px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">{m.kelas}</span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-1.5">
                        {['H','I','S','A'].map(s => {
                          const isSelected = statusMurid === s;
                          const kelasWarna = isSelected ? warnaTombol[s].aktif + ' ring-4 shadow-sm scale-95' : warnaTombol[s].pasif;
                          
                          return (
                            <button 
                              key={s} 
                              onClick={() => catatAbsen(m.id, s)} 
                              className={`py-2 rounded-xl text-xs font-black transition-all duration-150 tracking-wide ${kelasWarna}`}
                            >
                              {s === 'H' ? 'Hadir' : s === 'I' ? 'Izin' : s === 'S' ? 'Sakit' : 'Alfa'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  );
                })}
                {muridDifilter.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-8">Tidak menemukan santri yang dicari.</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* NAVIGASI MENU BAWAH */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-100 flex justify-around p-2 z-30 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {[
          { id: 'dashboard', icon: Home, label: 'Beranda' },
          { id: 'murid', icon: UserPlus, label: 'Santri' },
          { id: 'absen', icon: CheckSquare, label: 'Absensi' },
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setTab(item.id)} 
            className={`flex flex-col items-center gap-0.5 p-2 w-20 rounded-xl transition-all duration-200 ${tab === item.id ? 'text-emerald-600 bg-emerald-50 font-bold' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <item.icon size={20} className={tab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}/>
            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
