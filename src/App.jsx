import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { supabase, loginDenganGoogle, logoutGoogle } from './supabase';
import { 
  BookOpen, Home, Database, CheckSquare, Award, HelpCircle, 
  BookOpenCheck, Calendar, Clock, RefreshCw, LogOut, Plus, 
  Trash2, Search, Printer, Edit3, Save, AlertCircle, Check, MapPin
} from 'lucide-react';

export default function App() {
  // --- STATE OTENTIKASI & KEAMANAN ---
  const [userCloud, setUserCloud] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- STATE NAVIGASI & FORM ---
  const [tabUtama, setTabUtama] = useState('dashboard');
  const [subTabDb, setSubTabDb] = useState('input'); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [pencarianMurid, setPencarianMurid] = useState('');
  const [filterKelasGlobal, setFilterKelasGlobal] = useState('Semua');
  const [tanggalGlobal, setTanggalGlobal] = useState(new Date().toISOString().split('T')[0]);

  // --- STATE EDIT DATA MURID ---
  const [muridEditId, setMuridEditId] = useState(null);
  const [formEditData, setFormEditData] = useState({ nama: '', kelas: '', alamat: '', domisili: '' });

  // --- STATE INPUT DATA MENARIK LAINNYA ---
  const [soalForm, setSoalForm] = useState({ kelas: '', fan_pelajaran: '', teks_soal: '' });
  const [jadwalForm, setJadwalForm] = useState({ hari: 'Senin', jam: '', kelas: '', mata_pelajaran: '' });

  // --- AMBIL DATA DARI DATABASE LOKAL (DEXIE LIVE QUERY) ---
  const daftarKelas = useLiveQuery(() => db.kelas.toArray(), []);
  const daftarMurid = useLiveQuery(() => db.murid.toArray(), []);
  const daftarAbsensi = useLiveQuery(() => db.absensiv2.where('tanggal').equals(tanggalGlobal).toArray(), [tanggalGlobal]);
  const daftarNilai = useLiveQuery(() => db.nilai.toArray(), []);
  const daftarSoal = useLiveQuery(() => db.bank_soal.toArray(), []);
  const daftarBatas = useLiveQuery(() => db.batas_pelajaran.toArray(), []);
  const daftarMuhafadhoh = useLiveQuery(() => db.muhafadhoh.toArray(), []);
  const daftarAcara = useLiveQuery(() => db.undangan_rapat.toArray(), []);
  const daftarJadwal = useLiveQuery(() => db.jadwal_mengajar.toArray(), []);

  // --- PROTEKSI ANTI ACCIDENTAL REFRESH / BACK ---
  useEffect(() => {
    const proteksiKeluar = (e) => {
      e.preventDefault();
      e.returnValue = 'Apakah Anda yakin ingin mematikan halaman aplikasi? Pastikan data sudah tersinkron.';
    };
    window.addEventListener('beforeunload', proteksiKeluar);
    return () => window.removeEventListener('beforeunload', proteksiKeluar);
  }, []);

  // --- PANTAU STATUS LOGIN GOOGLE USER ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserCloud(session?.user || null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserCloud(session?.user || null);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- ENGIN SINKRONISASI MANAJEMEN DATA ---
  const jalankanSinkronisasi = async () => {
    if (!userCloud) return alert('Silakan login menggunakan akun Google terlebih dahulu untuk mencadangkan data!');
    setIsSyncing(true);
    try {
      const k = await db.kelas.toArray();
      const m = await db.murid.toArray();
      const a = await db.absensiv2.toArray();
      const n = await db.nilai.toArray();
      const s = await db.bank_soal.toArray();
      const b = await db.batas_pelajaran.toArray();
      const h = await db.muhafadhoh.toArray();
      const u = await db.undangan_rapat.toArray();
      const j = await db.jadwal_mengajar.toArray();

      if (k.length > 0) await supabase.from('kelas').upsert(k);
      if (m.length > 0) await supabase.from('murid').upsert(m);
      if (a.length > 0) await supabase.from('absensiv2').upsert(a);
      if (n.length > 0) await supabase.from('nilai').upsert(n);
      if (s.length > 0) await supabase.from('bank_soal').upsert(s);
      if (b.length > 0) await supabase.from('batas_pelajaran').upsert(b);
      if (h.length > 0) await supabase.from('muhafadhoh').upsert(h);
      if (u.length > 0) await supabase.from('undangan_rapat').upsert(u);
      if (j.length > 0) await supabase.from('jadwal_mengajar').upsert(j);

      alert('Sukses! Seluruh data offline lokal Anda berhasil diunggah dan diamankan ke Cloud Supabase.');
    } catch (err) {
      console.error(err);
      alert('Gagal Sinkronisasi: Koneksi terputus atau struktur tabel cloud belum siap.');
    }
    setIsSyncing(false);
  };

  // --- FORMULA PENGHITUNGAN NILAI KUSTOM ---
  const kalkulasiNilaiAkhir = (ulangan, tulis, lisan) => {
    const u = parseFloat(ulangan) || 0;
    const t = parseFloat(tulis) || 0;
    const l = parseFloat(lisan) || 0;
    const rataUjian = (t + l) / 2;
    
    if (rataUjian < 60) {
      return parseFloat(((rataUjian + (0.7 * u)) / 2).toFixed(2));
    }
    return parseFloat(((rataUjian + u) / 2).toFixed(2));
  };

  // --- HANDLER SUBMIT MODUL-MODUL ---
  const handleTambahKelas = async (e) => {
    e.preventDefault();
    const nama = new FormData(e.target).get('namaKelas')?.trim();
    if (nama) {
      await db.kelas.add({ nama });
      e.target.reset();
    }
  };

  const handleTambahMurid = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      nama: fd.get('nama')?.trim(),
      kelas: fd.get('kelas'),
      alamat: fd.get('alamat')?.trim(),
      domisili: fd.get('domisili')?.trim()
    };
    if (data.nama && data.kelas) {
      await db.murid.add(data);
      e.target.reset();
      alert('Santri baru sukses didaftarkan!');
    }
  };

  const handleSimpanEditMurid = async (e) => {
    e.preventDefault();
    if (muridEditId) {
      await db.murid.update(muridEditId, formEditData);
      setMuridEditId(null);
      alert('Perubahan data murid berhasil disimpan!');
    }
  };

  const handleCatatAbsen = async (muridId, status) => {
    const ada = await db.absensiv2.where({ murid_id: muridId, tanggal: tanggalGlobal }).first();
    if (ada) {
      await db.absensiv2.update(ada.id, { status });
    } else {
      await db.absensiv2.add({ murid_id: muridId, status, tanggal: tanggalGlobal });
    }
  };

  const handleSimpanNilai = async (muridId, field, value) => {
    const dataAda = await db.nilai.where('murid_id').equals(muridId).first();
    const current = dataAda || { murid_id: muridId, ulangan: 0, ujian_tulis: 0, ujian_lisan: 0, akhlaq: 0 };
    current[field] = parseFloat(value) || 0;
    current.total = kalkulasiNilaiAkhir(current.ulangan, current.ujian_tulis, current.ujian_lisan);
    
    if (dataAda) {
      await db.nilai.update(dataAda.id, current);
    } else {
      await db.nilai.add(current);
    }
  };

  const handleTambahSoal = async (e) => {
    e.preventDefault();
    if (soalForm.kelas && soalForm.fan_pelajaran && soalForm.teks_soal) {
      await db.bank_soal.add(soalForm);
      setSoalForm({ ...soalForm, teks_soal: '' });
      alert('Soal pelajaran berhasil ditambahkan ke bank data!');
    }
  };

  const handleSimpanBatasPelajaran = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const kelas = fd.get('kelas');
    const mp = fd.get('mp');
    if (!kelas || !mp) return;

    const ada = await db.batas_pelajaran.where({ kelas, mata_pelajaran: mp }).first();
    const payload = {
      kelas,
      mata_pelajaran: mp,
      bab: fd.get('bab'),
      halaman: fd.get('halaman'),
      pr_target: fd.get('pr'),
      catatan: fd.get('catatan')
    };

    if (ada) {
      await db.batas_pelajaran.update(ada.id, payload);
    } else {
      await db.batas_pelajaran.add(payload);
    }
    alert('Batas akhir pelajaran sukses diperbarui!');
  };

  const handleSimpanMuhafadhoh = async (muridId, field, value) => {
    const ada = await db.muhafadhoh.where('murid_id').equals(muridId).first();
    const payload = ada || { murid_id: muridId, setoran_terakhir: '', target_berikutnya: '', status_lancar: 'Lancar' };
    payload[field] = value;
    
    if (ada) {
      await db.muhafadhoh.update(ada.id, payload);
    } else {
      await db.muhafadhoh.add(payload);
    }
  };

  const handleTambahRapat = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await db.undangan_rapat.add({
      acara: fd.get('acara'),
      tanggal: fd.get('tanggal'),
      jam: fd.get('jam'),
      tempat: fd.get('tempat')
    });
    e.target.reset();
    alert('Agenda kegiatan undangan berhasil dimasukkan!');
  };

  const handleTambahJadwal = async (e) => {
    e.preventDefault();
    if (jadwalForm.kelas && jadwalForm.mata_pelajaran) {
      await db.jadwal_mengajar.add(jadwalForm);
      alert('Jadwal mengajar berhasil ditambahkan!');
    }
  };

  // --- FILTERING LOGIC ---
  const muridSesuaiFilter = daftarMurid?.filter(m => {
    const cocokNama = m.nama.toLowerCase().includes(pencarianMurid.toLowerCase());
    const cocokKelas = filterKelasGlobal === 'Semua' || m.kelas === filterKelasGlobal;
    return cocokNama && cocokKelas;
  }) || [];

  // --- LOGIKA NOTIFIKASI DASHBOARD ---
  const hariIni = new Date().toLocaleDateString('id-ID', { weekday: 'Long' });
  const jadwalHariIni = daftarJadwal?.filter(j => j.hari.toLowerCase() === hariIni.toLowerCase()) || [];

  // --- PRINT PERINTAH LAPORAN REKAP ---
  const triggerPrintLaporan = () => {
    window.print();
  };

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f2f5]">
        <div className="animate-spin text-[#1877f2]"><RefreshCw size={40} /></div>
        <p className="mt-4 text-sm font-semibold text-slate-500">Mempersiapkan Lapisan Keamanan Google...</p>
      </div>
    );
  }

  // --- GERBANG LOGIN UTAMA (GOOGLE AUTH) ---
  if (!userCloud) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f2f5] p-6">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-sm w-full text-center border border-slate-200">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#1877f2] to-[#166fe5] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <BookOpen size={44} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#1877f2] tracking-tight">Buku Ustaz Pro</h1>
          <p className="text-xs text-slate-500 mt-1 mb-6 uppercase tracking-wider font-bold">Pesantren &amp; Madrasah Ledger</p>
          
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-left text-xs text-amber-700 mb-6 flex gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>Gunakan Otentikasi Google Cloud demi proteksi enkripsi sandi data tingkat tinggi.</span>
          </div>

          <button onClick={loginDenganGoogle} className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-3 px-4 rounded-md transition-colors shadow-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.746-.08-1.32-.176-1.885H12.24z"/>
            </svg>
            Masuk dengan Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-800 antialiased flex flex-col print:bg-white print:text-black">
      
      {/* ATAS: HEADER UTAMA */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center space-x-3">
          <div className="bg-[#1877f2] p-2 rounded-lg text-white">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-[#1877f2]">Buku Ustaz Pro</h1>
            <p className="text-[10px] text-slate-400 font-semibold">{userCloud.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button onClick={jalankanSinkronisasi} disabled={isSyncing} className={`flex items-center gap-1 bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-700 font-bold text-xs py-2 px-3 rounded-md transition-colors ${isSyncing ? 'animate-spin' : ''}`}>
            <RefreshCw size={14} /> {isSyncing ? 'Proses...' : 'Sync Cloud'}
          </button>
          <button onClick={logoutGoogle} className="bg-rose-100 hover:bg-rose-200 text-rose-700 p-2 rounded-md transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* TENGAH: ISI KONTEN */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-24 print:p-0">
        
        {/* ================= MODUL 0: DASHBOARD UTAMA ================= */}
        {tabUtama === 'dashboard' && (
          <div className="space-y-4">
            
            {/* CARD PANTSAN NOTIFIKASI UTAMA */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-md font-black text-slate-800 flex items-center gap-2 border-b pb-2">
                <AlertCircle size={18} className="text-[#1877f2]" /> Ringkasan Tugas Guru Hari Ini ({hariIni})
              </h2>
              
              {/* Notifikasi Jadwal */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                <p className="font-bold mb-1">Jadwal Mengajar Anda:</p>
                {jadwalHariIni.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {jadwalHariIni.map((j, idx) => (
                      <li key={idx}>Jam <b>{j.jam}</b> di kelas <b>{j.kelas}</b> - Mapel: <u>{j.mata_pelajaran}</u></li>
                    ))}
                  </ul>
                ) : <p className="text-slate-500 italic">Tidak ada jadwal mengajar formal terdaftar hari ini.</p>}
              </div>

              {/* Batas Terakhir Pelajaran */}
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-900">
                <p className="font-bold mb-1">Catatan Batas Pelajaran Terakhir:</p>
                {daftarBatas && daftarBatas.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {daftarBatas.map((b, i) => (
                      <div key={i} className="bg-white/60 p-2 rounded border border-emerald-200">
                        Kelas <b>{b.kelas}</b> ({b.mata_pelajaran}): <span className="text-slate-700">Bab {b.bab} Hlm {b.halaman}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-slate-500 italic">Belum ada input batas buku.</p>}
              </div>

              {/* Janji Muhafadhoh */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <p className="font-bold mb-1">Pantauan Janji Setoran Muhafadhoh:</p>
                {daftarMuhafadhoh && daftarMuhafadhoh.length > 0 ? (
                  <p className="text-slate-700">Ada <b>{daftarMuhafadhoh.length}</b> santri aktif dalam sistem pemantauan hafalan berjenjang.</p>
                ) : <p className="text-slate-500 italic">Belum ada target hafalan yang dimasukkan.</p>}
              </div>

              {/* Notifikasi Rapat/Undangan */}
              {daftarAcara && daftarAcara.length > 0 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900">
                  <p className="font-bold mb-1">Pemberitahuan Undangan / Agenda Terdekat:</p>
                  <div className="space-y-1">
                    {daftarAcara.map((ac, i) => (
                      <div key={i}>• <b>{ac.acara}</b> pada {ac.tanggal} Pukul {ac.jam} WIB di {ac.tempat}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SINKRONISASI QUICK CARD */}
            <div className="bg-gradient-to-r from-[#1877f2] to-[#166fe5] text-white p-5 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-lg">Proteksi Data Multi-Perangkat</h3>
                <p className="text-xs text-blue-100">Simpan offline saat di dalam kelas, unggah online saat senggang.</p>
              </div>
              <button onClick={jalankanSinkronisasi} disabled={isSyncing} className="bg-white text-[#1877f2] font-black text-xs py-2.5 px-5 rounded-md hover:bg-slate-100 transition-all shadow-sm">
                SINKRON DATA SEKARANG
              </button>
            </div>
          </div>
        )}

        {/* ================= MODUL 1: DATABASE SANTRI & KELAS ================= */}
        {tabUtama === 'database' && (
          <div className="space-y-4">
            <div className="bg-white p-2 rounded-xl border flex space-x-1 font-bold text-xs">
              <button onClick={() => setSubTabDb('input')} className={`flex-1 py-2 rounded-lg transition-colors ${subTabDb === 'input' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'text-slate-500'}`}>Registrasi &amp; Kelas</button>
              <button onClick={() => setSubTabDb('edit')} className={`flex-1 py-2 rounded-lg transition-colors ${subTabDb === 'edit' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'text-slate-500'}`}>Kelola / Edit Data</button>
              <button onClick={() => setSubTabDb('print')} className={`flex-1 py-2 rounded-lg transition-colors ${subTabDb === 'print' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'text-slate-500'}`}>Pencarian &amp; Cetak F4</button>
            </div>

            {/* SUBTAB 1A: INPUT KELAS DAN SANTRI */}
            {subTabDb === 'input' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border space-y-3 h-fit">
                  <h3 className="font-bold text-sm text-slate-700">1. Tambah Wadah Kelas</h3>
                  <form onSubmit={handleTambahKelas} className="space-y-2">
                    <input name="namaKelas" placeholder="Nama Kelas Baru" className="w-full p-2 bg-slate-50 border rounded-md text-xs outline-none" required />
                    <button type="submit" className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold text-xs py-2 rounded-md transition-colors">Simpan Ruang Kelas</button>
                  </form>
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Daftar Kelas:</p>
                    <div className="flex flex-wrap gap-1">
                      {daftarKelas?.map(k => (
                        <span key={k.id} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded font-medium border">{k.nama}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border space-y-3 md:col-span-2">
                  <h3 className="font-bold text-sm text-slate-700">2. Input Identitas Santri Baru</h3>
                  <form onSubmit={handleTambahMurid} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Nama Lengkap</label>
                      <input name="nama" placeholder="Tulis nama lengkap" className="w-full p-2 bg-slate-50 border rounded-md outline-none" required />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Pilih Kelas</label>
                      <select name="kelas" className="w-full p-2 bg-slate-50 border rounded-md outline-none font-medium" required>
                        <option value="">-- Pilih Kelas --</option>
                        {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Alamat Asal</label>
                      <input name="alamat" placeholder="Kecamatan, Kabupaten" className="w-full p-2 bg-slate-50 border rounded-md outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Kamar / Domisili Ponpes</label>
                      <input name="domisili" placeholder="Gedung/Kamar" className="w-full p-2 bg-slate-50 border rounded-md outline-none" />
                    </div>
                    <div className="sm:col-span-2 pt-2">
                      <button type="submit" className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2.5 rounded-md text-xs transition-colors shadow-sm">
                        Daftarkan Santri Masuk Database
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* SUBTAB 1B: KELOLA / EDIT DATA MURID */}
            {subTabDb === 'edit' && (
              <div className="bg-white p-4 rounded-xl border space-y-4">
                <h3 className="font-bold text-sm text-slate-700">Manajemen Perubahan Data Murid</h3>
                
                {/* Jendela Form Edit yang melayang/aktif */}
                {muridEditId && (
                  <form onSubmit={handleSimpanEditMurid} className="bg-blue-50 border border-blue-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <input type="text" value={formEditData.nama} onChange={(e) => setFormEditData({...formEditData, nama: e.target.value})} className="p-2 border rounded" placeholder="Nama" required />
                    <select value={formEditData.kelas} onChange={(e) => setFormEditData({...formEditData, kelas: e.target.value})} className="p-2 border rounded font-bold" required>
                      {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                    </select>
                    <input type="text" value={formEditData.alamat} onChange={(e) => setFormEditData({...formEditData, alamat: e.target.value})} className="p-2 border rounded" placeholder="Alamat" />
                    <input type="text" value={formEditData.domisili} onChange={(e) => setFormEditData({...formEditData, domisili: e.target.value})} className="p-2 border rounded" placeholder="Domisili" />
                    <div className="sm:col-span-4 flex justify-end space-x-2 pt-1">
                      <button type="button" onClick={() => setMuridEditId(null)} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-bold">Batal</button>
                      <button type="submit" className="bg-[#1877f2] text-white px-4 py-1.5 rounded font-bold flex items-center gap-1"><Save size={14}/> Simpan</button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 font-bold border-b">
                        <th className="p-2">Nama Santri</th>
                        <th className="p-2">Kelas</th>
                        <th className="p-2">Alamat</th>
                        <th className="p-2">Domisili</th>
                        <th className="p-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daftarMurid?.map(m => (
                        <tr key={m.id} className="border-b hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-800">{m.nama}</td>
                          <td className="p-2"><span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border">{m.kelas}</span></td>
                          <td className="p-2 text-slate-500">{m.alamat || '-'}</td>
                          <td className="p-2 text-slate-500">{m.domisili || '-'}</td>
                          <td className="p-2 flex items-center justify-center space-x-1">
                            <button onClick={() => { setMuridEditId(m.id); setFormEditData(m); }} className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-1.5 rounded transition-colors"><Edit3 size={12} /></button>
                            <button onClick={async () => { if(confirm('Hapus murid ini?')) await db.murid.delete(m.id); }} className="bg-rose-100 hover:bg-rose-200 text-rose-700 p-1.5 rounded transition-colors"><Trash2 size={12} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBTAB 1C: PENCARIAN & CETAK KERTAS LAPORAN F4 */}
            {subTabDb === 'print' && (
              <div className="bg-white p-5 rounded-xl border space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2 w-full sm:max-w-xs">
                    <Search size={16} className="text-slate-400" />
                    <input type="text" placeholder="Saring kata kunci nama..." value={pencarianMurid} onChange={(e) => setPencarianMurid(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-md text-xs outline-none" />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select value={filterKelasGlobal} onChange={(e) => setFilterKelasGlobal(e.target.value)} className="p-2 bg-slate-50 border rounded-md text-xs outline-none font-bold">
                      <option value="Semua">Semua Rombel</option>
                      {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                    </select>
                    <button onClick={triggerPrintLaporan} className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold text-xs py-2 px-4 rounded-md flex items-center gap-1 shrink-0 shadow-sm">
                      <Printer size={14} /> Cetak Format F4
                    </button>
                  </div>
                </div>

                {/* AREA YANG DICETAK (DIOPTIMALKAN DENGAN CSS PRINT) */}
                <div id="print-area" className="p-1 font-serif text-sm">
                  <div className="hidden print:block text-center mb-6 border-b-4 border-double border-black pb-2">
                    <h2 className="text-xl font-black uppercase tracking-tight">Laporan Rekapitulasi Data Induk Santri</h2>
                    <p className="text-xs italic font-sans text-slate-600">Format Resmi Dokumen Madrasah / Pondok Pesantren - Kertas Ukuran Pas F4</p>
                  </div>

                  <table className="w-full text-left border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-slate-100 print:bg-transparent border-b border-black font-bold">
                        <th className="border border-black p-2 w-8 text-center">No</th>
                        <th className="border border-black p-2">Nama Lengkap Santri</th>
                        <th className="border border-black p-2 w-32">Kelas</th>
                        <th className="border border-black p-2">Alamat Asal</th>
                        <th className="border border-black p-2 w-28">Domisili Kamar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {muridSesuaiFilter.map((m, index) => (
                        <tr key={m.id} className="border-b border-black">
                          <td className="border border-black p-2 text-center font-sans">{index + 1}</td>
                          <td className="border border-black p-2 font-bold">{m.nama}</td>
                          <td className="border border-black p-2 font-sans">{m.kelas}</td>
                          <td className="border border-black p-2">{m.alamat || '-'}</td>
                          <td className="border border-black p-2 font-sans">{m.domisili || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MODUL 2: INTERAKSI ABSENSI MODERN ================= */}
        {tabUtama === 'absen' && (
          <div className="bg-white p-4 rounded-xl border space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-slate-50 p-3 rounded-lg border">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar size={16} className="text-slate-400" />
                <input type="date" value={tanggalGlobal} onChange={(e) => setTanggalGlobal(e.target.value)} className="p-1.5 border rounded-md font-bold text-xs outline-none bg-white text-slate-700" />
              </div>
              <div className="w-full sm:w-auto">
                <select value={filterKelasGlobal} onChange={(e) => setFilterKelasGlobal(e.target.value)} className="w-full p-2 border rounded-md text-xs outline-none font-black text-slate-700 bg-white">
                  <option value="Semua">-- Pilih Kelas Untuk Absen --</option>
                  {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {muridSesuaiFilter.map(m => {
                const statusAktif = daftarAbsensi?.find(a => a.murid_id === m.id)?.status;
                return (
                  <div key={m.id} className="p-3 bg-white rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:shadow-sm transition-shadow">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{m.nama}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{m.kelas}</p>
                    </div>
                    
                    {/* KLUSTER TOMBOL KEHADIRAN BERGAYA FACEBOOK TOGGLE */}
                    <div className="grid grid-cols-4 gap-1 sm:w-64 font-bold text-xs text-center">
                      {[
                        { code: 'H', label: 'Hadir', cls: 'bg-emerald-600 text-white ring-2 ring-emerald-200' },
                        { code: 'I', label: 'Izin', cls: 'bg-blue-600 text-white ring-2 ring-blue-200' },
                        { code: 'S', label: 'Sakit', cls: 'bg-amber-500 text-white ring-2 ring-amber-200' },
                        { code: 'A', label: 'Alfa', cls: 'bg-rose-600 text-white ring-2 ring-rose-200' }
                      ].map(st => {
                        const isMatch = statusAktif === st.code;
                        return (
                          <button key={st.code} onClick={() => handleCatatAbsen(m.id, st.code)} className={`py-2 rounded-md border text-[11px] transition-all ${isMatch ? st.cls : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= MODUL 3: INPUT & KALKULASI NILAI OTOMATIS ================= */}
        {tabUtama === 'nilai' && (
          <div className="bg-white p-4 rounded-xl border space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-slate-800 text-sm">Transkrip Penilaian &amp; Kalkulasi Pembobotan</h3>
              <select value={filterKelasGlobal} onChange={(e) => setFilterKelasGlobal(e.target.value)} className="p-1.5 border rounded-md text-xs font-bold outline-none bg-slate-50 text-slate-700">
                <option value="Semua">Semua Kelas</option>
                {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b font-bold">
                    <th className="p-2 w-44">Nama Santri</th>
                    <th className="p-2 w-16 text-center">Ulangan</th>
                    <th className="p-2 w-16 text-center">Uj. Tulis</th>
                    <th className="p-2 w-16 text-center">Uj. Lisan</th>
                    <th className="p-2 w-16 text-center">Akhlaq</th>
                    <th className="p-2 w-20 text-center bg-blue-50 text-[#1877f2]">Jumlah Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {muridSesuaiFilter.map(m => {
                    const record = daftarNilai?.find(n => n.murid_id === m.id) || { ulangan: '', ujian_tulis: '', ujian_lisan: '', akhlaq: '', total: 0 };
                    return (
                      <tr key={m.id} className="border-b hover:bg-slate-50">
                        <td className="p-2">
                          <p className="font-bold text-slate-800">{m.nama}</p>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded font-mono">{m.kelas}</span>
                        </td>
                        <td className="p-1"><input type="number" defaultValue={record.ulangan} onBlur={(e) => handleSimpanNilai(m.id, 'ulangan', e.target.value)} className="w-full p-1 text-center border rounded outline-none" /></td>
                        <td className="p-1"><input type="number" defaultValue={record.ujian_tulis} onBlur={(e) => handleSimpanNilai(m.id, 'ujian_tulis', e.target.value)} className="w-full p-1 text-center border rounded outline-none" /></td>
                        <td className="p-1"><input type="number" defaultValue={record.ujian_lisan} onBlur={(e) => handleSimpanNilai(m.id, 'ujian_lisan', e.target.value)} className="w-full p-1 text-center border rounded outline-none" /></td>
                        <td className="p-1"><input type="number" defaultValue={record.akhlaq} onBlur={(e) => handleSimpanNilai(m.id, 'akhlaq', e.target.value)} className="w-full p-1 text-center border rounded outline-none" /></td>
                        <td className="p-2 text-center font-black bg-blue-50 text-[#1877f2] text-sm">{record.total || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MODUL 4: BANK SOAL EVALUASI ================= */}
        {tabUtama === 'soal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border h-fit space-y-3">
              <h3 className="font-bold text-sm text-slate-700 flex items-center gap-1"><Plus size={16}/> Buat Soal Ujian Baru</h3>
              <form onSubmit={handleTambahSoal} className="space-y-2 text-xs">
                <div>
                  <label className="font-medium text-slate-500">Kelas Target</label>
                  <select value={soalForm.kelas} onChange={(e) => setSoalForm({...soalForm, kelas: e.target.value})} className="w-full p-2 border rounded-md mt-1" required>
                    <option value="">-- Pilih Kelas --</option>
                    {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-500">Fan Pelajaran / Ilmu</label>
                  <input type="text" placeholder="Misal: Fiqih, Nahwu" value={soalForm.fan_pelajaran} onChange={(e) => setSoalForm({...soalForm, fan_pelajaran: e.target.value})} className="w-full p-2 border rounded-md mt-1" required />
                </div>
                <div>
                  <label className="font-medium text-slate-500">Pertanyaan / Materi Soal</label>
                  <textarea rows="4" placeholder="Ketik draf naskah soal disini..." value={soalForm.teks_soal} onChange={(e) => setSoalForm({...soalForm, teks_soal: e.target.value})} className="w-full p-2 border rounded-md mt-1" required></textarea>
                </div>
                <button type="submit" className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2 rounded-md">Simpan ke Bank Soal</button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-xl border md:col-span-2 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-sm text-slate-700">Arsip Pertanyaan</h3>
                <select value={filterKelasGlobal} onChange={(e) => setFilterKelasGlobal(e.target.value)} className="p-1 border rounded text-xs font-bold bg-slate-50">
                  <option value="Semua">Semua Kelas</option>
                  {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                </select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {daftarSoal?.filter(s => filterKelasGlobal === 'Semua' || s.kelas === filterKelasGlobal).map(so => (
                  <div key={so.id} className="p-3 bg-slate-50 border rounded-lg relative group text-xs">
                    <button onClick={async () => await db.bank_soal.delete(so.id)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                    <div className="flex gap-2 mb-1">
                      <span className="bg-blue-100 text-[#1877f2] font-black px-1.5 py-0.5 rounded text-[10px]">{so.kelas}</span>
                      <span className="bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px]">{so.fan_pelajaran}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-line font-medium">{so.teks_soal}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODUL 5: BATAS AKHIR PELAJARAN / PROGRESS BOOK ================= */}
        {tabUtama === 'batas' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border h-fit space-y-3">
              <h3 className="font-black text-sm text-slate-700">Update Batas Mengajar</h3>
              <form onSubmit={handleSimpanBatasPelajaran} className="space-y-2 text-xs">
                <div>
                  <label className="font-bold text-slate-500">Pilih Kelas</label>
                  <select name="kelas" className="w-full p-2 border rounded-md mt-0.5" required>
                    {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-500">Mata Pelajaran / Kitab</label>
                  <input name="mp" placeholder="Contoh: Fathul Qorib" className="w-full p-2 border rounded-md mt-0.5" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-500">Materi / Bab Akhir</label>
                    <input name="bab" placeholder="Bab Sholat" className="w-full p-2 border rounded-md mt-0.5" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500">Halaman Terakhir</label>
                    <input name="halaman" placeholder="Hlm 45" className="w-full p-2 border rounded-md mt-0.5" />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-500">PR / Target Pekan Depan</label>
                  <input name="pr" placeholder="Hafalan bait 10-20" className="w-full p-2 border rounded-md mt-0.5" />
                </div>
                <div>
                  <label className="font-bold text-slate-500">Catatan Tambahan Ustaz</label>
                  <input name="catatan" placeholder="Santri banyak belum paham khilafiyah" className="w-full p-2 border rounded-md mt-0.5" />
                </div>
                <button type="submit" className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2 rounded-md transition-colors shadow-sm">Perbarui Batas Buku</button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-xl border md:col-span-2 space-y-3">
              <h3 className="font-black text-sm text-slate-700 border-b pb-2">Log Batas Kurikulum Kelas</h3>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 font-bold text-slate-500 border-b">
                      <th className="p-2">Kelas / Mapel</th>
                      <th className="p-2">Batas Akhir</th>
                      <th className="p-2">Target/PR</th>
                      <th className="p-2">Hapus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daftarBatas?.map(b => (
                      <tr key={b.id} className="border-b hover:bg-slate-50">
                        <td className="p-2">
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-1 rounded text-[10px] mr-1">{b.kelas}</span>
                          <span className="font-bold text-slate-800">{b.mata_pelajaran}</span>
                        </td>
                        <td className="p-2 text-slate-600">Bab {b.bab || '-'} (Hlm {b.halaman || '-'})</td>
                        <td className="p-2 text-amber-700 font-medium">{b.pr_target || '-'}</td>
                        <td className="p-2"><button onClick={async () => await db.batas_pelajaran.delete(b.id)} className="text-slate-300 hover:text-rose-600"><Trash2 size={14}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODUL 6: MONITORING SETORAN MUHAFADHOH ================= */}
        {tabUtama === 'muhafadhoh' && (
          <div className="bg-white p-4 rounded-xl border space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-slate-800 text-sm">Lembar Pemantauan Hafalan (Muhafadhoh)</h3>
              <select value={filterKelasGlobal} onChange={(e) => setFilterKelasGlobal(e.target.value)} className="p-1.5 border rounded text-xs font-black bg-slate-50">
                <option value="Semua">-- Silakan Pilih Kelas --</option>
                {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b font-bold">
                    <th className="p-2 w-48">Nama Murid</th>
                    <th className="p-2">Setoran Terakhir (Imrithi/Alfiyah/Juz)</th>
                    <th className="p-2">Target Setoran Berikutnya</th>
                    <th className="p-2 w-32 text-center">Status Kelancaran</th>
                  </tr>
                </thead>
                <tbody>
                  {muridSesuaiFilter.map(m => {
                    const hf = daftarMuhafadhoh?.find(h => h.murid_id === m.id) || { setoran_terakhir: '', target_berikutnya: '', status_lancar: 'Lancar' };
                    return (
                      <tr key={m.id} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-800">{m.nama}</td>
                        <td className="p-1"><input type="text" defaultValue={hf.setoran_terakhir} onBlur={(e) => handleSimpanMuhafadhoh(m.id, 'setoran_terakhir', e.target.value)} placeholder="Bait 1-10" className="w-full p-1 border rounded outline-none" /></td>
                        <td className="p-1"><input type="text" defaultValue={hf.target_berikutnya} onBlur={(e) => handleSimpanMuhafadhoh(m.id, 'target_berikutnya', e.target.value)} placeholder="Bait 11-20" className="w-full p-1 border rounded outline-none" /></td>
                        <td className="p-1 text-center">
                          <select defaultValue={hf.status_lancar} onChange={(e) => handleSimpanMuhafadhoh(m.id, 'status_lancar', e.target.value)} className="p-1 border rounded bg-white outline-none font-bold text-slate-700">
                            <option value="Lancar">Lancar ✅</option>
                            <option value="Sedang">Sedang ⚠️</option>
                            <option value="Kurang">Kurang ❌</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MODUL 7: CATATAN UNDANGAN & RAPAT INTERN ================= */}
        {tabUtama === 'undangan' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border h-fit space-y-3">
              <h3 className="font-bold text-sm text-slate-700">Input Agenda / Undangan</h3>
              <form onSubmit={handleTambahRapat} className="space-y-2 text-xs">
                <div>
                  <label className="font-bold text-slate-500">Nama Acara / Perihal</label>
                  <input name="acara" placeholder="Rapat Wali Santri / Undangan Bahtsul Masail" className="w-full p-2 border rounded-md mt-0.5" required />
                </div>
                <div>
                  <label className="font-bold text-slate-500">Tanggal Pelaksanaan</label>
                  <input type="date" name="tanggal" className="w-full p-2 border rounded-md mt-0.5" required />
                </div>
                <div>
                  <label className="font-bold text-slate-500">Waktu / Jam</label>
                  <input type="text" name="jam" placeholder="09:00 s.d Selesai" className="w-full p-2 border rounded-md mt-0.5" required />
                </div>
                <div>
                  <label className="font-bold text-slate-500">Tempat Lokasi</label>
                  <input name="tempat" placeholder="Aula Lantai 2 / Kantor Utama" className="w-full p-2 border rounded-md mt-0.5" required />
                </div>
                <button type="submit" className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2 rounded-md transition-all shadow-sm">Simpan Kegiatan</button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-xl border md:col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-slate-700 border-b pb-2">Daftar Agenda Kegiatan Mendatang</h3>
              <div className="space-y-2">
                {daftarAcara?.map(ac => (
                  <div key={ac.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-start gap-2 text-xs">
                    <div className="space-y-1">
                      <h4 className="font-black text-slate-800 text-sm flex items-center gap-1">📌 {ac.acara}</h4>
                      <p className="text-slate-500 font-medium flex items-center gap-1"><Clock size={12}/> {ac.tanggal} Pukul {ac.jam} WIB</p>
                      <p className="text-slate-500 font-medium flex items-center gap-1"><MapPin size={12}/> Bertempat di: <u>{ac.tempat}</u></p>
                    </div>
                    <button onClick={async () => await db.undangan_rapat.delete(ac.id)} className="text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                  </div>
                ))}
                {daftarAcara?.length === 0 && <p className="text-center text-slate-400 text-xs italic py-8">Belum ada agenda rapat atau undangan yang tersimpan.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODUL 8: JADWAL MENGAJAR GURU ================= */}
        {tabUtama === 'jadwal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border h-fit space-y-3">
              <h3 className="font-bold text-sm text-slate-700">Tambah Jadwal Rutin</h3>
              <form onSubmit={handleTambahJadwal} className="space-y-2 text-xs">
                <div>
                  <label className="font-bold text-slate-500">Hari Mengajar</label>
                  <select value={jadwalForm.hari} onChange={(e) => setJadwalForm({...jadwalForm, hari: e.target.value})} className="w-full p-2 border rounded-md mt-0.5">
                    {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Ahad'].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-500">Alokasi Jam Ke</label>
                  <input type="text" placeholder="Contoh: Jam I (07:30 - 08:30)" value={jadwalForm.jam} onChange={(e) => setJadwalForm({...jadwalForm, jam: e.target.value})} className="w-full p-2 border rounded-md mt-0.5" required />
                </div>
                <div>
                  <label className="font-bold text-slate-500">Kelas Mengajar</label>
                  <select value={jadwalForm.kelas} onChange={(e) => setJadwalForm({...jadwalForm, kelas: e.target.value})} className="w-full p-2 border rounded-md mt-0.5" required>
                    <option value="">-- Pilih Kelas --</option>
                    {daftarKelas?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-500">Mata Pelajaran / Fan</label>
                  <input type="text" placeholder="Tauhid, Shorof, dll" value={jadwalForm.mata_pelajaran} onChange={(e) => setJadwalForm({...jadwalForm, mata_pelajaran: e.target.value})} className="w-full p-2 border rounded-md mt-0.5" required />
                </div>
                <button type="submit" className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2 rounded-md transition-all">Simpan ke Plot Jadwal</button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-xl border md:col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-slate-700 border-b pb-2">Master Jadwal Mengajar Ustaz</h3>
              <div className="space-y-3">
                {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Ahad'].map(hari => {
                  const filteredJadwal = daftarJadwal?.filter(j => j.hari === hari) || [];
                  if (filteredJadwal.length === 0) return null;
                  return (
                    <div key={hari} className="border rounded-xl p-3 bg-slate-50 text-xs">
                      <h4 className="font-black text-[#1877f2] mb-1.5 border-b pb-1 uppercase tracking-wide">{hari}</h4>
                      <div className="space-y-1">
                        {filteredJadwal.map(fj => (
                          <div key={fj.id} className="flex justify-between items-center bg-white p-2 rounded border shadow-sm">
                            <div>
                              <span className="font-bold text-slate-700">{fj.jam}</span> | Kelas <b className="text-slate-900">{fj.kelas}</b> - Mapel: <i className="text-emerald-700">{fj.mata_pelajaran}</i>
                            </div>
                            <button onClick={async () => await db.jadwal_mengajar.delete(fj.id)} className="text-slate-300 hover:text-rose-600"><Trash2 size={12}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* BAWAH: NAVIGASI MENU UTAMA GRID (TAMPILAN RESPONSIVE NYAMAN DI HP) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-1.5 px-2 grid grid-cols-4 sm:flex sm:justify-center sm:gap-4 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] print:hidden overflow-x-auto">
        {[
          { id: 'dashboard', icon: Home, lbl: 'Beranda' },
          { id: 'database', icon: Database, lbl: 'Database' },
          { id: 'absen', icon: CheckSquare, lbl: 'Absensi' },
          { id: 'nilai', icon: Award, lbl: 'Nilai' },
          { id: 'soal', icon: HelpCircle, lbl: 'Soal' },
          { id: 'batas', icon: BookOpenCheck, lbl: 'Batas' },
          { id: 'muhafadhoh', icon: Check, lbl: 'Hafalan' },
          { id: 'undangan', icon: Calendar, lbl: 'Agenda' },
          { id: 'jadwal', icon: Clock, lbl: 'Jadwal' }
        ].map(menu => {
          const isSelected = tabUtama === menu.id;
          return (
            <button key={menu.id} onClick={() => setTabUtama(menu.id)} className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all min-w-[64px] ${isSelected ? 'text-[#1877f2] bg-[#e7f3ff] font-black' : 'text-slate-400 hover:bg-slate-50'}`}>
              <menu.icon size={18} className={isSelected ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className="text-[9px] tracking-tight mt-0.5 text-center truncate w-full">{menu.lbl}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
