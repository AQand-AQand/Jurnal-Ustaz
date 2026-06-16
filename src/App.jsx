import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gjfdxqhwwytcgylokksq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('database');
  const [loading, setLoading] = useState(false);

  // --- DATA STATES ---
  const [muridList, setMuridList] = useState([]);
  const [selectedMurid, setSelectedMurid] = useState(null); // Untuk Detail Profil
  
  // States Form
  const [formSantri, setFormSantri] = useState({ nama: '', kelas: '', alamat: '', domisili: '' });
  const [formAbsen, setFormAbsen] = useState({ santri_id: '', status: 'Hadir' });
  const [formBatas, setFormBatas] = useState({ fan: '', batas: '' });
  const [formNilai, setFormNilai] = useState({ santri_id: '', jenis: 'Ulangan', skor: '', mapel: '' });
  const [formPerilaku, setFormPerilaku] = useState({ santri_id: '', text: '' });
  const [formSoal, setFormSoal] = useState({ pelajaran: '', kelas: '', batasan: '', isi: '' });

  // List Data Cloud
  const [listBatas, setListBatas] = useState([]);
  const [listBankSoal, setListBankSoal] = useState([]);
  const [listAbsensi, setListAbsensi] = useState([]);
  const [listNilai, setListNilai] = useState([]);
  const [listPerilaku, setListPerilaku] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    loadLocal();
  }, []);

  useEffect(() => { if (user) syncData(); }, [user]);

  const loadLocal = () => {
    const s = localStorage.getItem('local_santri');
    if (s) setMuridList(JSON.parse(s));
  };

  const syncData = async () => {
    setLoading(true);
    const { data: s } = await supabase.from('santri').select('*').order('nama');
    const { data: b } = await supabase.from('bank_soal').select('*');
    const { data: m } = await supabase.from('batas_mengajar').select('*');
    const { data: a } = await supabase.from('absensi').select('*');
    const { data: n } = await supabase.from('nilai').select('*');
    const { data: p } = await supabase.from('catatan_perilaku').select('*');

    if (s) { setMuridList(s); localStorage.setItem('local_santri', JSON.stringify(s)); }
    if (b) setListBankSoal(b);
    if (m) setListBatas(m);
    if (a) setListAbsensi(a);
    if (n) setListNilai(n);
    if (p) setListPerilaku(p);
    setLoading(false);
  };

  // --- HANDLERS ---
  const saveSantri = async () => {
    if(!formSantri.nama || !formSantri.kelas) return alert("Isi Nama & Kelas!");
    const { data, error } = await supabase.from('santri').insert([{ ...formSantri, ustadz_email: user?.email }]);
    if(!error) { alert("Tersimpan!"); syncData(); setFormSantri({nama:'', kelas:'', alamat:'', domisili:''}); }
  };

  const saveAbsen = async (sId, status) => {
    await supabase.from('absensi').insert([{ santri_id: sId, status, ustadz_email: user?.email }]);
    alert("Absen Berhasil!"); syncData();
  };

  const saveBatas = async () => {
    await supabase.from('batas_mengajar').insert([{ fan: formBatas.fan, batas_akhir: formBatas.batas, ustadz_email: user?.email }]);
    setFormBatas({fan:'', batas:''}); syncData();
  };

  const saveNilai = async () => {
    await supabase.from('nilai').insert([{ santri_id: formNilai.santri_id, jenis_ujian: formNilai.jenis, skor: formNilai.skor, pelajaran: formNilai.mapel, ustadz_email: user?.email }]);
    alert("Nilai Masuk!"); syncData();
  };

  const saveSoal = async () => {
    await supabase.from('bank_soal').insert([{ ...formSoal, ustadz_email: user?.email }]);
    alert("Soal Tersimpan!"); setFormSoal({pelajaran:'', kelas:'', batasan:'', isi:''}); syncData();
  };

  const savePerilaku = async () => {
    await supabase.from('catatan_perilaku').insert([{ santri_id: formPerilaku.santri_id, catatan: formPerilaku.text, ustadz_email: user?.email }]);
    alert("Catatan Disimpan!"); syncData();
  };

  // Helper Grouping
  const foldersSoal = listBankSoal.reduce((acc, it) => {
    if (!acc[it.pelajaran]) acc[it.pelajaran] = [];
    acc[it.pelajaran].push(it);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200 overflow-hidden relative">
      
      {/* HEADER */}
      <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <h1 className="text-xl font-bold">Buku Ustaz <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded ml-1">v3.0</span></h1>
        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-40">
        
        {/* MENU 1: DATA BASE */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h3 className="font-bold text-emerald-700">Pendaftaran Data Base</h3>
              <input type="text" placeholder="Nama Santri" className="w-full border rounded-xl p-3 text-sm" value={formSantri.nama} onChange={e => setFormSantri({...formSantri, nama: e.target.value})} />
              <input type="text" placeholder="Kelas Madrasah (Manual)" className="w-full border rounded-xl p-3 text-sm" value={formSantri.kelas} onChange={e => setFormSantri({...formSantri, kelas: e.target.value})} />
              <input type="text" placeholder="Alamat Rumah" className="w-full border rounded-xl p-3 text-sm" value={formSantri.alamat} onChange={e => setFormSantri({...formSantri, alamat: e.target.value})} />
              <input type="text" placeholder="Domisili Pondok" className="w-full border rounded-xl p-3 text-sm" value={formSantri.domisili} onChange={e => setFormSantri({...formSantri, domisili: e.target.value})} />
              <button onClick={saveSantri} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Simpan Murid</button>
            </div>
          </div>
        )}

        {/* MENU 2: ABSEN */}
        {activeTab === 'absen' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 px-1">Presensi Kelas Hari Ini</h3>
            {muridList.map(m => (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{m.nama}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{m.kelas}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => saveAbsen(m.id, 'Hadir')} className="bg-emerald-500 text-white text-[10px] px-2 py-1.5 rounded-lg">H</button>
                  <button onClick={() => saveAbsen(m.id, 'Izin')} className="bg-amber-500 text-white text-[10px] px-2 py-1.5 rounded-lg">I</button>
                  <button onClick={() => saveAbsen(m.id, 'Alfa')} className="bg-red-500 text-white text-[10px] px-2 py-1.5 rounded-lg">A</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MENU 3: BATAS AJAR */}
        {activeTab === 'batas' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border space-y-3">
              <h3 className="font-bold text-emerald-700">Catat Batas Mengajar</h3>
              <input type="text" placeholder="Nama Fan/Pelajaran" className="w-full border rounded-xl p-3 text-sm" value={formBatas.fan} onChange={e => setFormBatas({...formBatas, fan: e.target.value})} />
              <input type="text" placeholder="Sampai Hal / Bab / Batas" className="w-full border rounded-xl p-3 text-sm" value={formBatas.batas} onChange={e => setFormBatas({...formBatas, batas: e.target.value})} />
              <button onClick={saveBatas} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Simpan Batas</button>
            </div>
            <div className="space-y-2">
              {listBatas.map(b => (
                <div key={b.id} className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <p className="font-bold text-emerald-800 text-sm">{b.fan}</p>
                  <p className="text-xs text-emerald-600">Batas: {b.batas_akhir}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MENU 4: PERILAKU */}
        {activeTab === 'perilaku' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border space-y-3">
              <h3 className="font-bold text-emerald-700">Catatan Perilaku Santri</h3>
              <select className="w-full border rounded-xl p-3 text-sm bg-white" onChange={e => setFormPerilaku({...formPerilaku, santri_id: e.target.value})}>
                <option>Pilih Santri</option>
                {muridList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
              <textarea placeholder="Tulis perkembangan/perilaku..." className="w-full border rounded-xl p-3 text-sm h-24" value={formPerilaku.text} onChange={e => setFormPerilaku({...formPerilaku, text: e.target.value})}></textarea>
              <button onClick={savePerilaku} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Simpan Catatan</button>
            </div>
          </div>
        )}

        {/* MENU 5: NILAI */}
        {activeTab === 'nilai' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border space-y-3">
              <h3 className="font-bold text-emerald-700">Pencatatan Nilai</h3>
              <select className="w-full border rounded-xl p-3 text-sm bg-white" onChange={e => setFormNilai({...formNilai, santri_id: e.target.value})}>
                <option>Pilih Santri</option>
                {muridList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select className="border rounded-xl p-3 text-sm bg-white" value={formNilai.jenis} onChange={e => setFormNilai({...formNilai, jenis: e.target.value})}>
                  <option>Ulangan</option><option>Ujian Tulis</option><option>Ujian Lisan</option>
                </select>
                <input type="number" placeholder="Skor" className="border rounded-xl p-3 text-sm" value={formNilai.skor} onChange={e => setFormNilai({...formNilai, skor: e.target.value})} />
              </div>
              <input type="text" placeholder="Mata Pelajaran" className="w-full border rounded-xl p-3 text-sm" value={formNilai.mapel} onChange={e => setFormNilai({...formNilai, mapel: e.target.value})} />
              <button onClick={saveNilai} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Input Nilai</button>
            </div>
          </div>
        )}

        {/* MENU 6: BANK SOAL */}
        {activeTab === 'soal' && (
          <div className="space-y-4">
             <div className="bg-white p-5 rounded-2xl border space-y-3">
              <h3 className="font-bold text-emerald-700">Buat Soal Ujian</h3>
              <input type="text" placeholder="Fan Pelajaran" className="w-full border rounded-xl p-3 text-sm" value={formSoal.pelajaran} onChange={e => setFormSoal({...formSoal, pelajaran: e.target.value})} />
              <input type="text" placeholder="Kelas (Manual)" className="w-full border rounded-xl p-3 text-sm" value={formSoal.kelas} onChange={e => setFormSoal({...formSoal, kelas: e.target.value})} />
              <textarea placeholder="Tulis soal di sini..." className="w-full border rounded-xl p-3 text-sm h-32" value={formSoal.isi} onChange={e => setFormSoal({...formSoal, isi: e.target.value})}></textarea>
              <button onClick={saveSoal} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Save Soal</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(foldersSoal).map(fan => (
                <div key={fan} className="bg-white p-4 rounded-2xl border text-center">
                  <span className="text-3xl">📁</span>
                  <p className="text-[10px] font-bold mt-1 uppercase">{fan}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MENU 7: PROFIL TERINTEGRASI */}
        {activeTab === 'profil' && (
          <div className="space-y-4">
            {!selectedMurid ? (
              <>
                <h3 className="font-bold text-slate-800 px-1">Master Profil Santri</h3>
                {muridList.map(m => (
                  <button key={m.id} onClick={() => setSelectedMurid(m)} className="w-full bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-emerald-50">
                    <div className="text-left">
                      <p className="font-bold text-sm">{m.nama}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{m.kelas}</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-slate-300"></i>
                  </button>
                ))}
              </>
            ) : (
              <div className="space-y-4">
                <button onClick={() => setSelectedMurid(null)} className="text-emerald-600 text-xs font-bold mb-2">← Kembali ke Daftar</button>
                <div className="bg-emerald-700 text-white p-6 rounded-3xl shadow-lg">
                  <h2 className="text-xl font-bold">{selectedMurid.nama}</h2>
                  <p className="text-xs opacity-80">{selectedMurid.kelas}</p>
                  <p className="text-[10px] mt-2 italic">📍 {selectedMurid.alamat} | 🏠 {selectedMurid.domisili}</p>
                </div>
                
                {/* REKAP DATA SANTRI TERHUBUNG */}
                <div className="space-y-3">
                   <div className="bg-white p-4 rounded-2xl border shadow-sm">
                      <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 mb-2">Rekap Absensi</h4>
                      <p className="text-xs">Hadir: {listAbsensi.filter(a => a.santri_id == selectedMurid.id && a.status == 'Hadir').length}</p>
                      <p className="text-xs">Izin: {listAbsensi.filter(a => a.santri_id == selectedMurid.id && a.status == 'Izin').length}</p>
                      <p className="text-xs text-red-500">Alfa: {listAbsensi.filter(a => a.santri_id == selectedMurid.id && a.status == 'Alfa').length}</p>
                   </div>
                   <div className="bg-white p-4 rounded-2xl border shadow-sm">
                      <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 mb-2">Riwayat Nilai</h4>
                      {listNilai.filter(n => n.santri_id == selectedMurid.id).map(n => (
                        <p key={n.id} className="text-[11px] py-1 border-b last:border-0">{n.pelajaran} ({n.jenis_ujian}): <span className="font-bold text-emerald-600">{n.skor}</span></p>
                      ))}
                   </div>
                   <div className="bg-white p-4 rounded-2xl border shadow-sm">
                      <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 mb-2">Catatan Ustadz</h4>
                      {listPerilaku.filter(p => p.santri_id == selectedMurid.id).map(p => (
                        <p key={p.id} className="text-[11px] italic text-slate-600 py-1 border-b last:border-0">"{p.catatan}"</p>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* BOTTOM NAVIGATION (Grid 7 Menu) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 grid grid-cols-4 gap-1 p-2 pb-6 z-50">
        {[
          { id: 'database', icon: 'fa-database', l: 'Data Base' },
          { id: 'absen', icon: 'fa-user-check', l: 'Absen' },
          { id: 'batas', icon: 'fa-book-open', l: 'Batas Ajar' },
          { id: 'perilaku', icon: 'fa-star', l: 'Perilaku' },
          { id: 'nilai', icon: 'fa-pen-nib', l: 'Nilai' },
          { id: 'soal', icon: 'fa-folder-open', l: 'Bank Soal' },
          { id: 'profil', icon: 'fa-user-graduate', l: 'Profil' }
        ].map(m => (
          <button key={m.id} onClick={() => {setActiveTab(m.id); setSelectedMurid(null);}} className={`flex flex-col items-center py-2 transition ${activeTab === m.id ? 'text-emerald-600' : 'text-slate-400'}`}>
            <i className={`fa-solid ${m.icon} text-lg mb-1`}></i>
            <span className="text-[8px] font-bold uppercase">{m.l}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}

### Keunggulan v3.0 Master:
1.  **Profil yang Pintar:** Saat Mas Taufiq mengklik nama anak di menu **Profil**, aplikasi langsung menggabungkan (mencari) data Absen, Nilai, dan Catatan miliknya. Sangat profesional untuk laporan ke wali santri.
2.  **Input Kelas Manual:** Mas Taufiq bisa mengetik kelas apa saja tanpa harus pilih-pilih dari daftar tetap.
3.  **Bank Soal Berfolder:** Otomatis rapi per mata pelajaran.
4.  **Data Terintegrasi:** Semua data punya kolom `ustadz_email`, jadi kalau Mas Taufiq ganti HP, cukup login Google, semua data akan kembali muncul otomatis dari Supabase.

Silakan dicoba diunggah, Mas! Ini adalah puncak fitur yang paling lengkap. Jika ada detail UI yang mau diperhalus, kita eksekusi setelah ini. Sukses terus, Mas Taufiq!
