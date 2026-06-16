import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gjfdxqhwwytcgylokksq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('database');
  const [loading, setLoading] = useState(false);

  const [muridList, setMuridList] = useState([]);
  const [listAbsensi, setListAbsensi] = useState([]);
  const [listBatas, setListBatas] = useState([]);
  const [listPerilaku, setListPerilaku] = useState([]);
  const [listNilai, setListNilai] = useState([]);
  const [listBankSoal, setListBankSoal] = useState([]);

  const [viewProfilStage, setViewProfilStage] = useState('kelas');
  const [selectedKelasProfil, setSelectedKelasProfil] = useState(null);
  const [selectedMuridProfil, setSelectedMuridProfil] = useState(null);

  const [formSantri, setFormSantri] = useState({ nama: '', kelas: '', alamat: '', domisili: '' });
  const [formBatas, setFormBatas] = useState({ fan: '', batas: '' });
  const [formPerilaku, setFormPerilaku] = useState({ santri_id: '', catatan: '' });
  const [formNilai, setFormNilai] = useState({ santri_id: '', jenis_ujian: 'Ulangan', pelajaran: '', skor: '' });
  const [formSoal, setFormSoal] = useState({ pelajaran: '', kelas: '', batasan: '', isi: '' });

  const [filterKelasAbsen, setFilterKelasAbsen] = useState('Semua');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    loadDataLokal();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) syncSemuaDataKeCloud();
  }, [user]);

  const loadDataLokal = () => {
    const lokal = localStorage.getItem('ustadz_santri_cache');
    if (lokal) setMuridList(JSON.parse(lokal));
  };

  const syncSemuaDataKeCloud = async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase.from('santri').select('*').order('nama', { ascending: true });
      const { data: a } = await supabase.from('absensi').select('*').order('tanggal', { ascending: false });
      const { data: b } = await supabase.from('batas_mengajar').select('*').order('created_at', { ascending: false });
      const { data: p } = await supabase.from('catatan_perilaku').select('*').order('created_at', { ascending: false });
      const { data: n } = await supabase.from('nilai').select('*').order('created_at', { ascending: false });
      const { data: bs } = await supabase.from('bank_soal').select('*').order('created_at', { ascending: false });

      if (s) { setMuridList(s); localStorage.setItem('ustadz_santri_cache', JSON.stringify(s)); }
      if (a) setListAbsensi(a);
      if (b) setListBatas(b);
      if (p) setListPerilaku(p);
      if (n) setListNilai(n);
      if (bs) setListBankSoal(bs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimpanSantri = async (e) => {
    e.preventDefault();
    if (!formSantri.nama || !formSantri.kelas) return alert("Nama dan Kelas wajib diisi!");
    setLoading(true);
    const { error } = await supabase.from('santri').insert([{ ...formSantri, ustadz_email: user?.email }]);
    setLoading(false);
    if (!error) {
      alert("Data Santri berhasil masuk database!");
      setFormSantri({ nama: '', kelas: '', alamat: '', domisili: '' });
      syncSemuaDataKeCloud();
    }
  };

  const handleSimpanAbsen = async (santriId, status) => {
    setLoading(true);
    const { error } = await supabase.from('absensi').insert([{ santri_id: santriId, status, ustadz_email: user?.email }]);
    setLoading(false);
    if (!error) syncSemuaDataKeCloud();
  };

  const handleSimpanBatasAjar = async (e) => {
    e.preventDefault();
    if (!formBatas.fan || !formBatas.batas) return alert("Isi lengkap Fan & Batas Mengajar!");
    setLoading(true);
    const { error } = await supabase.from('batas_mengajar').insert([{ fan: formBatas.fan, batas_akhir: formBatas.batas, ustadz_email: user?.email }]);
    setLoading(false);
    if (!error) {
      alert("Catatan batas mengajar disimpan!");
      setFormBatas({ fan: '', batas: '' });
      syncSemuaDataKeCloud();
    }
  };

  const handleSimpanPerilaku = async (e) => {
    e.preventDefault();
    if (!formPerilaku.santri_id || !formPerilaku.catatan) return alert("Pilih murid dan tulis catatannya!");
    setLoading(true);
    const { error } = await supabase.from('catatan_perilaku').insert([{ santri_id: formPerilaku.santri_id, catatan: formPerilaku.catatan, ustadz_email: user?.email }]);
    setLoading(false);
    if (!error) {
      alert("Catatan perilaku berhasil ditambahkan!");
      setFormPerilaku({ santri_id: '', catatan: '' });
      syncSemuaDataKeCloud();
    }
  };

  const handleSimpanNilai = async (e) => {
    e.preventDefault();
    if (!formNilai.santri_id || !formNilai.pelajaran || !formNilai.skor) return alert("Lengkapi data nilai!");
    setLoading(true);
    const { error } = await supabase.from('nilai').insert([{
      santri_id: formNilai.santri_id,
      jenis_ujian: formNilai.jenis_ujian,
      pelajaran: formNilai.pelajaran,
      skor: parseInt(formNilai.skor),
      ustadz_email: user?.email
    }]);
    setLoading(false);
    if (!error) {
      alert("Nilai santri berhasil disimpan!");
      setFormNilai({ santri_id: '', jenis_ujian: 'Ulangan', pelajaran: '', skor: '' });
      syncSemuaDataKeCloud();
    }
  };

  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    if (!formSoal.pelajaran || !formSoal.kelas || !formSoal.isi) return alert("Lengkapi lembar formulir pembuatan soal!");
    setLoading(true);
    const { error } = await supabase.from('bank_soal').insert([{
      pelajaran: formSoal.pelajaran,
      kelas: formSoal.kelas,
      batasan: formSoal.batasan,
      isi_soal: formSoal.isi,
      ustadz_email: user?.email
    }]);
    setLoading(false);
    if (!error) {
      alert("Naskah soal tersimpan di Bank Soal!");
      setFormSoal({ pelajaran: '', kelas: '', batasan: '', isi: '' });
      syncSemuaDataKeCloud();
    }
  };

  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))];

  const groupBankSoal = listBankSoal.reduce((acc, item) => {
    if (!acc[item.pelajaran]) acc[item.pelajaran] = [];
    acc[item.pelajaran].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200 overflow-hidden pb-36">
      
      <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-graduation-cap text-lg"></i>
          <h1 className="text-xl font-bold tracking-tight">Buku Ustaz <span className="text-xs bg-emerald-800 px-2 py-0.5 rounded-full ml-1 font-mono">v3.0</span></h1>
        </div>
        <div className="flex items-center gap-3">
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          {user ? (
            <button onClick={() => syncSemuaDataKeCloud()} className="text-white hover:text-emerald-200" title="Sinkron Cloud">
              <i className="fa-solid fa-rotate"></i>
            </button>
          ) : (
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="bg-white text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg shadow">
              Login
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2 text-emerald-600">
                <i className="fa-solid fa-database"></i> Input Data Base Murid Baru
              </h3>
              <div className="space-y-2">
                <input type="text" placeholder="Nama Lengkap Santri" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formSantri.nama} onChange={e => setFormSantri({...formSantri, nama: e.target.value})} />
                <input type="text" placeholder="Kelas Madrasah (Ketik Bebas)" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formSantri.kelas} onChange={e => setFormSantri({...formSantri, kelas: e.target.value})} />
                <input type="text" placeholder="Alamat Rumah" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formSantri.alamat} onChange={e => setFormSantri({...formSantri, alamat: e.target.value})} />
                <input type="text" placeholder="Domisili Pondok / Kamar" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500 outline-none" value={formSantri.domisili} onChange={e => setFormSantri({...formSantri, domisili: e.target.value})} />
              </div>
              <button onClick={handleSimpanSantri} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow mt-2 hover:bg-emerald-700 transition">
                Simpan Murid
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Total Terdaftar ({muridList.length} Murid)</p>
              {muridList.map(m => (
                <div key={m.id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{m.nama}</h4>
                    <p className="text-xs text-slate-400 font-medium">Domisili: {m.domisili || '-'}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-1 rounded-md">{m.kelas}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'absen' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border flex items-center justify-between shadow-sm">
              <label className="text-xs font-bold text-slate-500">Pilih Kelas Absen:</label>
              <select className="border p-1.5 rounded-lg text-xs font-medium bg-slate-50" value={filterKelasAbsen} onChange={e => setFilterKelasAbsen(e.target.value)}>
                <option value="Semua">Semua Kelas</option>
                {listKelasUnik.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              {muridList.filter(m => filterKelasAbsen === 'Semua' || m.kelas === filterKelasAbsen).map(m => {
                const absenHariIni = listAbsensi.find(a => a.santri_id === m.id && a.tanggal === new Date().toISOString().split('T')[0]);
                return (
                  <div key={m.id} className="bg-white p-4 rounded-xl border flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{m.nama}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{m.kelas}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleSimpanAbsen(m.id, 'Hadir')} className={`w-8 h-8 rounded-lg font-bold text-xs transition ${absenHariIni?.status === 'Hadir' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>H</button>
                      <button onClick={() => handleSimpanAbsen(m.id, 'Izin')} className={`w-8 h-8 rounded-lg font-bold text-xs transition ${absenHariIni?.status === 'Izin' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>I</button>
                      <button onClick={() => handleSimpanAbsen(m.id, 'Alfa')} className={`w-8 h-8 rounded-lg font-bold text-xs transition ${absenHariIni?.status === 'Alfa' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>A</button>
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
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600">Catat Batas Mengajar Kitab/Materi</h3>
              <input type="text" placeholder="Nama Fan Pelajaran / Kitab" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formBatas.fan} onChange={e => setFormBatas({...formBatas, fan: e.target.value})} />
              <input type="text" placeholder="Batas Akhir Mengajar (Bab/Hal/Ayat)" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formBatas.batas} onChange={e => setFormBatas({...formBatas, batas: e.target.value})} />
              <button onClick={handleSimpanBatasAjar} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow">Simpan Batas Ajar</button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Riwayat Batas Akhir</p>
              {listBatas.map(b => (
                <div key={b.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{b.fan}</h4>
                    <p className="text-xs text-emerald-600 font-bold mt-0.5">Batas: {b.batas_akhir}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(b.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'perilaku' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600">Catatan Perilaku & Perkembangan</h3>
              <select className="w-full border rounded-xl p-3 text-sm bg-white" value={formPerilaku.santri_id} onChange={e => setFormPerilaku({...formPerilaku, santri_id: e.target.value})}>
                <option value="">-- Pilih Nama Murid --</option>
                {muridList.map(m => <option key={m.id} value={m.id}>{m.nama} ({m.kelas})</option>)}
              </select>
              <textarea placeholder="Tulis catatan perkembangan atau perilaku..." className="w-full border rounded-xl p-3 text-sm h-24 focus:ring-2 ring-emerald-500 outline-none" value={formPerilaku.catatan} onChange={e => setFormPerilaku({...formPerilaku, catatan: e.target.value})}></textarea>
              <button onClick={handleSimpanPerilaku} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow">Simpan Catatan</button>
            </div>
          </div>
        )}

        {activeTab === 'nilai' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600">Pencatatan Skor Nilai Murid</h3>
              <select className="w-full border rounded-xl p-3 text-sm bg-white" value={formNilai.santri_id} onChange={e => setFormNilai({...formNilai, santri_id: e.target.value})}>
                <option value="">-- Pilih Nama Murid --</option>
                {muridList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
              
              <div className="grid grid-cols-3 gap-2">
                {['Ulangan', 'Ujian Tulis', 'Ujian Lisan'].map(j => (
                  <button key={j} type="button" onClick={() => setFormNilai({...formNilai, jenis_ujian: j})} className={`py-2 text-xs font-bold rounded-xl border transition ${formNilai.jenis_ujian === j ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>{j}</button>
                ))}
              </div>

              <input type="text" placeholder="Mata Pelajaran / Fan" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formNilai.pelajaran} onChange={e => setFormNilai({...formNilai, pelajaran: e.target.value})} />
              <input type="number" placeholder="Skor Nilai (Angka 0-100)" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formNilai.skor} onChange={e => setFormNilai({...formNilai, skor: e.target.value})} />
              
              <button onClick={handleSimpanNilai} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow mt-1">Simpan Nilai</button>
            </div>
          </div>
        )}

        {activeTab === 'soal' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-2 text-emerald-600">Media Pengetikan Lembar Soal</h3>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Mata Pelajaran (Fan)" className="border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formSoal.pelajaran} onChange={e => setFormSoal({...formSoal, pelajaran: e.target.value})} />
                <input type="text" placeholder="Untuk Kelas" className="border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formSoal.kelas} onChange={e => setFormSoal({...formSoal, kelas: e.target.value})} />
              </div>
              <input type="text" placeholder="Batasan Materi Bab / Ruang Lingkup" className="w-full border rounded-xl p-3 text-sm focus:ring-2 ring-emerald-500" value={formSoal.batasan} onChange={e => setFormSoal({...formSoal, batasan: e.target.value})} />
              <textarea placeholder="Tulis butir pertanyaan soal ujian secara urut..." className="w-full border rounded-xl p-4 text-sm h-36 font-mono bg-slate-50/50 focus:ring-2 ring-emerald-500 outline-none" value={formSoal.isi} onChange={e => setFormSoal({...formSoal, isi: e.target.value})}></textarea>
              <button onClick={handleSimpanSoal} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow">Masukkan Bank Soal</button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Koleksi Folder Bank Soal</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(groupBankSoal).map(f => (
                  <div key={f} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-3xl text-amber-400">📁</span>
                    <h4 className="font-bold text-slate-800 text-xs mt-2 truncate w-full">Soal {f}</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mt-1 font-medium">{groupBankSoal[f].length} Berkas</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profil' && (
          <div className="space-y-4">
            
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
                  {listKelasUnik.length === 0 && <p className="text-xs text-slate-400 text-center col-span-2 py-6">Belum ada kelas terdaftar di Data Base.</p>}
                </div>
              </div>
            )}

            {viewProfilStage === 'murid' && (
              <div className="space-y-3">
                <button onClick={() => setViewProfilStage('kelas')} className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1"><i className="fa-solid fa-arrow-left"></i> Kembali ke Menu Kelas</button>
                <h3 className="font-bold text-slate-800 text-sm px-1">Daftar Santri Kelas: <span className="text-emerald-600 underline">{selectedKelasProfil}</span></h3>
                <div className="space-y-2">
                  {muridList.filter(m => m.kelas === selectedKelasProfil).map(m => (
                    <button key={m.id} onClick={() => { setSelectedMuridProfil(m); setViewProfilStage('detail'); }} className="w-full bg-white p-4 rounded-xl border text-left flex justify-between items-center shadow-sm hover:bg-slate-50/50">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{m.nama}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">📍 {m.alamat || 'Alamat Belum Diisi'}</p>
                      </div>
                      <i className="fa-solid fa-circle-user text-lg text-emerald-600"></i>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewProfilStage === 'detail' && selectedMuridProfil && (
              <div className="space-y-4">
                <button onClick={() => setViewProfilStage('murid')} className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1"><i className="fa-solid fa-arrow-left"></i> Kembali ke Daftar Murid</button>
                
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 rounded-3xl shadow-md relative overflow-hidden">
                  <div className="absolute right-4 bottom-2 text-7xl font-black opacity-10"><i className="fa-solid fa-user-graduate"></i></div>
                  <h2 className="text-lg font-bold">{selectedMuridProfil.nama}</h2>
                  <p className="text-xs opacity-90 font-mono">Kelas Madrasah: {selectedMuridProfil.kelas}</p>
                  <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-[11px] opacity-95">
                    <p>📍 Alamat: {selectedMuridProfil.alamat || '-'}</p>
                    <p>🏠 Domisili: {selectedMuridProfil.domisili || '-'}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-2 flex items-center gap-1.5"><i className="fa-solid fa-clipboard-user text-emerald-600"></i> Rekap Absensi Terkumpul</h4>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-emerald-50 p-2 rounded-xl"><span className="text-xs block text-slate-500 font-medium">Hadir</span><span className="font-bold text-emerald-700 text-base">{listAbsensi.filter(a => a.santri_id === selectedMuridProfil.id && a.status === 'Hadir').length}</span></div>
                    <div className="bg-amber-50 p-2 rounded-xl"><span className="text-xs block text-slate-500 font-medium">Izin</span><span className="font-bold text-amber-700 text-base">{listAbsensi.filter(a => a.santri_id === selectedMuridProfil.id && a.status === 'Izin').length}</span></div>
                    <div className="bg-red-50 p-2 rounded-xl"><span className="text-xs block text-slate-500 font-medium">Alfa</span><span className="font-bold text-red-700 text-base">{listAbsensi.filter(a => a.santri_id === selectedMuridProfil.id && a.status === 'Alfa').length}</span></div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-2 flex items-center gap-1.5"><i className="fa-solid fa-star text-emerald-600"></i> Riwayat Semua Perolehan Nilai</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pt-1">
                    {listNilai.filter(n => n.santri_id === selectedMuridProfil.id).map(n => (
                      <div key={n.id} className="flex justify-between items-center text-xs py-1 border-b last:border-0">
                        <div>
                          <span className="font-bold text-slate-700 block">{n.pelajaran}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{n.jenis_ujian}</span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2 py-1 rounded text-sm">{n.skor}</span>
                      </div>
                    ))}
                    {listNilai.filter(n => n.santri_id === selectedMuridProfil.id).length === 0 && <p className="text-[11px] text-slate-400 text-center py-2">Belum ada rekam catatan nilai.</p>}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-2 flex items-center gap-1.5"><i className="fa-solid fa-comment-medical text-emerald-600"></i> Catatan Riwayat Perilaku Ustaz</h4>
                  <div className="space-y-2 pt-1">
                    {listPerilaku.filter(p => p.santri_id === selectedMuridProfil.id).map(p => (
                      <div key={p.id} className="bg-slate-50 p-2.5 rounded-xl border text-xs text-slate-600 italic relative">
                        "{p.catatan}"
                        <span className="text-[9px] block text-slate-400 font-mono not-italic mt-1 text-right">{new Date(p.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    ))}
                    {listPerilaku.filter(p => p.santri_id === selectedMuridProfil.id).length === 0 && <p className="text-[11px] text-slate-400 text-center py-2">Belum ada riwayat catatan perilaku santri ini.</p>}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/90 grid grid-cols-4 gap-x-1 gap-y-2 p-2 pb-5 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.06)]">
        {[
          { id: 'database', icon: 'fa-database', label: 'Data Base' },
          { id: 'absen', icon: 'fa-user-check', label: 'Absen' },
          { id: 'batas', icon: 'fa-book-open', label: 'Batas Ajar' },
          { id: 'perilaku', icon: 'fa-star', label: 'Perilaku' },
          { id: 'nilai', icon: 'fa-pen-nib', label: 'Nilai' },
          { id: 'soal', icon: 'fa-folder-open', label: 'Bank Soal' },
          { id: 'profil', icon: 'fa-user-graduate', label: 'Profil' }
        ].map(menu => {
          const isAct = activeTab === menu.id;
          return (
            <button key={menu.id} onClick={() => { setActiveTab(menu.id); if(menu.id === 'profil') setViewProfilStage('kelas'); }} className="flex flex-col items-center justify-center transition outline-none">
              <div className={`flex flex-col items-center justify-center w-full max-w-[80px] py-1 rounded-xl transition-all duration-200 ${isAct ? 'bg-emerald-50 text-emerald-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                <i className={`fa-solid ${menu.icon} text-base ${isAct ? 'text-lg' : ''}`}></i>
                <span className="text-[9px] font-bold uppercase tracking-wide mt-0.5">{menu.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
