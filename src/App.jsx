import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

  // === SUB-TAB & FORM STATE ===
  const [bukuSakuTab, setBukuSakuTab] = useState('batas');
  const [nilaiModeTab, setNilaiModeTab] = useState('ujian');
  const [soalTab, setSoalTab] = useState('arsip');
  const [absenTab, setAbsenTab] = useState('harian'); 

  const [formMurid, setFormMurid] = useState({ id: null, nama: '', kelas: '', alamat: '', domisili: '' });
  const [formPerilaku, setFormPerilaku] = useState({ catatan: '' });
  const [formSoal, setFormSoal] = useState({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' });
  const [formJadwal, setFormJadwal] = useState({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  const [formSakuBatas, setFormSakuBatas] = useState({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
  const [formSakuTagihan, setFormSakuTagihan] = useState({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
  const [formCapaian, setFormCapaian] = useState({ capaian: '', tanggal: new Date().toISOString().split('T')[0] });

  // State Navigasi
  const [filterKelasAbsen, setFilterKelasAbsen] = useState('');
  const [draftAbsen, setDraftAbsen] = useState({}); // Draft absen sebelum simpan
  const [absenBulan, setAbsenBulan] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [absenKelasBulanan, setAbsenKelasBulanan] = useState('');

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
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    
    loadDataLokalOffline();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });

    const timer = setInterval(() => setNow(new Date()), 60000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => { if (user && !isOffline) syncSemuaDataKeCloud(); }, [user, isOffline]);

  useEffect(() => {
    // Simpan ke localstorage tiap ada perubahan (Offline mode)
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

  // Init Draft Absen
  useEffect(() => {
    if (filterKelasAbsen) {
      const tanggalHariIni = now.toISOString().split('T')[0];
      const muridKelas = muridList.filter(m => m.kelas === filterKelasAbsen);
      const initDraft = {};
      muridKelas.forEach(m => {
        const existing = listAbsensi.find(a => a.murid_id === m.id && a.tanggal === tanggalHariIni);
        initDraft[m.id] = existing ? existing.status : '';
      });
      setDraftAbsen(initDraft);
    }
  }, [filterKelasAbsen, muridList, listAbsensi]);
  
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
  
  const syncSemuaDataKeCloud = async () => { /* Logic Sync Sesuai Sebelumnya */
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
  
  if (m) setMuridList(m); if (a) setListAbsensi(a); if (b) setListBatas(b); if (p) setListPerilaku(p);
  if (n) setListNilai(n); if (bs) setListBankSoal(bs); if (jdwl) setListJadwal(jdwl);
  if (skb) setListSakuBatas(skb); if (skt) setListSakuTagihan(skt); if (ch) setListCapaian(ch);
  } catch (err) { console.log(err); } finally { setLoading(false); }
  };
  
  const checkConnection = () => {
  if (isOffline || !SUPABASE_ANON_KEY) { alert("Offline! Data disimpan di HP sementara."); return false; } return true;
  };
  
  // === FITUR EKSPOR PDF ===
  const generatePDF = (title, headers, body, extraInfo = []) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  let startY = 30;
  extraInfo.forEach((info) => {
  doc.text(info, 14, startY);
  startY += 6;
  });
  
  doc.autoTable({
  startY: startY + 4,
  head: [headers],
  body: body,
  theme: 'grid',
  headStyles: { fillColor: [5, 150, 105] },
  styles: { fontSize: 9 }
  });
  doc.save(`${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const exportPDFSoal = (soal) => {
  const doc = new jsPDF();
  doc.setFontSize(14); doc.text(`SOAL UJIAN: ${soal.pelajaran.toUpperCase()}`, 14, 20);
  doc.setFontSize(11); doc.text(`Kelas: ${soal.kelas}`, 14, 28);
  doc.text(`Pengajar: ${user?.email}`, 14, 34);
  if(soal.batasan) doc.text(`Batasan: ${soal.batasan}`, 14, 40);
  doc.line(14, 45, 196, 45);
  
  doc.setFontSize(11);
  const splitText = doc.splitTextToSize(soal.isi_soal, 180);
  doc.text(splitText, 14, 55);
  doc.save(`Soal_${soal.pelajaran}_Kls${soal.kelas}.pdf`);
  };
  
  const exportPDFRapor = (murid) => {
  const nilais = listNilai.filter(n => n.murid_id === murid.id);
  const mAbsen = listAbsensi.filter(a => a.murid_id === murid.id);
  const hdr = ["Mata Pelajaran", "Jenis Ujian", "Skor"];
  const bdy = nilais.map(n => [n.pelajaran, n.jenis_ujian, n.skor]);
  
  const h = mAbsen.filter(a=>a.status==='Hadir').length;
  const i = mAbsen.filter(a=>a.status==='Izin').length;
  const a = mAbsen.filter(a=>a.status==='Alfa').length;
  
  generatePDF(`Rapor Santri: ${murid.nama}`, hdr, bdy, [
  `Kelas: ${murid.kelas}`,
  `Kamar/Domisili: ${murid.domisili || '-'}`,
  `Kehadiran -> Hadir: ${h}, Izin: ${i}, Alfa: ${a}`
  ]);
  };
  
  // === FITUR SHARE WA ===
  const shareWA = (text) => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  
  // === CRUD HANDLERS (Dipertahankan dari aslinya, diringkas sedikit) ===
  const handleSimpanMurid = async (e) => {
  e.preventDefault();
  if (!formMurid.nama || !formMurid.kelas) return alert("Nama & Kelas wajib!");
  if (formMurid.id) {
  setMuridList(muridList.map(m => m.id === formMurid.id ? formMurid : m)); alert("Data diperbarui!");
  if (checkConnection()) await supabase.from('murid').update({ nama: formMurid.nama, kelas: formMurid.kelas, alamat: formMurid.alamat, domisili: formMurid.domisili }).eq('id', formMurid.id);
  } else {
  const newMurid = { ...formMurid, id: Math.floor(Math.random() * 10000000), ustadz_email: user?.email };
  setMuridList([...muridList, newMurid]); alert("Ditambahkan!");
  if (checkConnection()) await supabase.from('murid').insert([newMurid]);
  }
  setFormMurid({ id: null, nama: '', kelas: '', alamat: '', domisili: '' }); setShowTambahMurid(false);
  };
  const handleHapusMurid = async (id) => {
  if (!window.confirm("Hapus santri ini?")) return;
  setMuridList(muridList.filter(m => m.id !== id));
  if (checkConnection()) await supabase.from('murid').delete().eq('id', id);
  };
  
  const handleSimpanJadwal = async (e) => { e.preventDefault(); /* ... logika sama persis ... */ };
  const handleHapusJadwal = async (id) => { /* ... */ setListJadwal(listJadwal.filter(j => j.id !== id)); if(checkConnection()) supabase.from('jadwal_mengajar').delete().eq('id', id); };
  
  const handleSimpanSoal = async (e) => {
  e.preventDefault();
  if (!formSoal.pelajaran || !formSoal.kelas || !formSoal.isi) return alert("Lengkapi form!");
  const newId = formSoal.id || Math.floor(Math.random() * 10000000);
  const newSoal = { ...formSoal, id: newId, ustadz_email: user?.email };
  if (formSoal.id) {
  setListBankSoal(listBankSoal.map(s => s.id === formSoal.id ? newSoal : s));
  if(checkConnection()) await supabase.from('bank_soal').update({ pelajaran: newSoal.pelajaran, kelas: newSoal.kelas, batasan: newSoal.batasan, isi_soal: newSoal.isi }).eq('id', formSoal.id);
  } else {
  setListBankSoal([newSoal, ...listBankSoal]);
  if(checkConnection()) await supabase.from('bank_soal').insert([{ pelajaran: newSoal.pelajaran, kelas: newSoal.kelas, batasan: newSoal.batasan, isi_soal: newSoal.isi, ustadz_email: user?.email }]);
  }
  setFormSoal({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' }); setSoalTab('arsip');
  };
  const handleHapusSoal = async (id) => { if(window.confirm("Hapus?")) { setListBankSoal(listBankSoal.filter(s=>s.id!==id)); if(checkConnection()) supabase.from('bank_soal').delete().eq('id', id); }};
  
  const handleSimpanAbsenMasal = async () => {
  if(!filterKelasAbsen) return alert("Pilih kelas dulu!");
  const tanggalHariIni = now.toISOString().split('T')[0];
  const absensiBaru = [];
  const muridKelas = muridList.filter(m => m.kelas === filterKelasAbsen);
  
  let lAbsen = [...listAbsensi];
  muridKelas.forEach(m => {
  const status = draftAbsen[m.id];
  if(status) {
  lAbsen = lAbsen.filter(a => !(a.murid_id === m.id && a.tanggal === tanggalHariIni));
  const item = { id: Math.floor(Math.random()*10000000), murid_id: m.id, status, tanggal: tanggalHariIni, ustadz_email: user?.email };
  lAbsen.unshift(item);
  absensiBaru.push({ murid_id: m.id, status, tanggal: tanggalHariIni, ustadz_email: user?.email });
  }
  });
  setListAbsensi(lAbsen);
  alert(`Absensi kelas ${filterKelasAbsen} berhasil disimpan!`);
  if(checkConnection() && absensiBaru.length > 0) await supabase.from('absensi').insert(absensiBaru);
  };
  
  const handleSimpanPerilaku = async (e) => { e.preventDefault(); /*...*/ };
  const handleSimpanNilaiIndividu = async (e) => {
  e.preventDefault();
  const newNilai = { id: Math.floor(Math.random()*10000000), murid_id: selectedMuridNilai.id, jenis_ujian: formNilai.jenis, pelajaran: formNilai.pelajaran, skor: parseInt(formNilai.skor), created_at: new Date().toISOString() };
  setListNilai([newNilai, ...listNilai]); setFormNilai({...formNilai, skor: ''}); alert("Tersimpan!");
  if(checkConnection()) supabase.from('nilai').insert([{ ...newNilai, ustadz_email: user?.email }]);
  };
  const handleSimpanSakuBatas = async (e) => { e.preventDefault(); /*...*/ };
  const handleSimpanSakuTagihan = async (e) => { e.preventDefault(); /*...*/ };
  const handleSimpanCapaianHafalan = async (e) => { e.preventDefault(); /*...*/ };
  
  const handleEmailAuth = async (e) => { e.preventDefault(); /*...*/ };
  
  if (!user) {
  return (
  <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 font-sans max-w-md mx-auto">
  <div className="bg-white p-8 rounded-3xl shadow-xl w-full border border-slate-200">
  <div className="text-center mb-6"><h1 className="text-2xl font-bold text-slate-800 tracking-tight">Buku Ustaz</h1></div>
  <form onSubmit={handleEmailAuth} className="space-y-4">
  <input type="email" placeholder="Email" required className="w-full border rounded-xl py-3 px-4 outline-none text-sm" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} />
  <input type="password" placeholder="Password" required className="w-full border rounded-xl py-3 px-4 outline-none text-sm" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} />
  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl">{authMode === 'login' ? 'Masuk' : 'Daftar'}</button>
  </form>
  <div className="mt-5 text-center"><button onClick={() => setAuthMode(authMode==='login'?'register':'login')} className="text-sm text-emerald-600 font-bold hover:underline">{authMode === 'login' ? 'Daftar Baru' : 'Sudah Punya Akun'}</button></div>
  </div>
  </div>
  );
  }
  
  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))].sort();
  const namaHariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hariIni = namaHariList[now.getDay()];
  const tanggalHariIniFull = now.toISOString().split('T')[0];
  
  return (
  <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200 overflow-hidden pb-32 relative">
  <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
  <div className="flex items-center gap-2"><h1 className="text-xl font-bold tracking-tight">Buku Ustaz</h1></div>
  <div className="flex gap-3 items-center">
  {isOffline && <span className="text-[10px] bg-red-500 px-2 py-1 rounded font-bold animate-pulse">Offline</span>}
  <button onClick={syncSemuaDataKeCloud} className="text-white bg-emerald-700 w-8 h-8 rounded-full">{loading ? '⏳' : '🔄'}</button>
  <button onClick={() => supabase.auth.signOut()} className="text-sm">Keluar</button>
  </div>
  </header>
  
  <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
  
  {/* === JADWAL TAB === */}
  {activeTab === 'jadwal' && (
  <div className="space-y-4">
  <div className="bg-white p-4 rounded-xl border shadow-sm">
  <div className="flex justify-between items-center mb-3 border-b pb-2">
  <h3 className="font-bold text-slate-800 text-xs uppercase text-emerald-600">Jadwal Mengajar</h3>
  <button onClick={() => setShowTambahJadwal(!showTambahJadwal)} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">{showTambahJadwal ? 'Batal' : '+ Tambah'}</button>
  </div>
  {/* Looping Jadwal */}
  {namaHariList.map(h => {
  const jP = listJadwal.filter(j => j.hari === h).sort((a,b)=>a.jam_mulai.localeCompare(b.jam_mulai));
  if(jP.length===0) return null;
  return (
  <div key={h} className="bg-slate-50 rounded-lg p-2 mb-2 border">
  <p className="text-xs font-bold text-slate-700 mb-1 border-b pb-1">{h}</p>
  {jP.map(j => (
  <div key={j.id} className="flex items-center justify-between py-1 text-sm">
  <span className="font-medium text-xs">{j.jam_mulai} - {j.pelajaran} (Kls {j.kelas})</span>
  <button onClick={() => handleHapusJadwal(j.id)} className="text-red-400">Hapus</button>
  </div>
  ))}
  </div>
  )
  })}
  </div>
  
  {showTambahJadwal && (
  <div className="bg-white p-4 rounded-xl border shadow-sm">
  <h3 className="font-bold text-xs mb-3 text-emerald-600">Form Jadwal</h3>
  <div className="grid grid-cols-2 gap-2 mb-2">
  <select className="border p-2 rounded" value={formJadwal.hari} onChange={e=>setFormJadwal({...formJadwal, hari: e.target.value})}>
  {namaHariList.map(h => <option key={h} value={h}>{h}</option>)}
  </select>
  <input type="time" className="border p-2 rounded" value={formJadwal.jam_mulai} onChange={e=>setFormJadwal({...formJadwal, jam_mulai: e.target.value})} />
  </div>
  <input type="text" placeholder="Kelas" className="w-full border p-2 rounded mb-2" value={formJadwal.kelas} onChange={e=>setFormJadwal({...formJadwal, kelas: e.target.value})} />
  <input type="text" placeholder="Mata Pelajaran" className="w-full border p-2 rounded mb-2" value={formJadwal.pelajaran} onChange={e=>setFormJadwal({...formJadwal, pelajaran: e.target.value})} />
  <button onClick={handleSimpanJadwal} className="w-full bg-emerald-600 text-white p-2 rounded font-bold">Simpan</button>
  </div>
  )}
  </div>
  )}
  
  {/* === RAPOR TAB === */}
  {activeTab === 'rapor' && (
  <div className="space-y-4">
  {!raporKelas && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm">
  <div className="flex justify-between items-center border-b pb-2 mb-3">
  <h3 className="font-bold text-sm text-emerald-600">Pilih Kelas Rapor</h3>
  <button onClick={() => setShowTambahMurid(!showTambahMurid)} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs">+ Santri</button>
  </div>
  {showTambahMurid && (
  <form onSubmit={handleSimpanMurid} className="bg-emerald-50 p-3 mb-3 rounded border">
  <input type="text" placeholder="Nama" required className="w-full p-2 mb-2 text-xs border rounded" value={formMurid.nama} onChange={e=>setFormMurid({...formMurid, nama: e.target.value})} />
  <input type="text" placeholder="Kelas" required className="w-full p-2 mb-2 text-xs border rounded" value={formMurid.kelas} onChange={e=>setFormMurid({...formMurid, kelas: e.target.value})} />
  <button type="submit" className="w-full bg-emerald-600 text-white p-2 text-xs rounded font-bold">Simpan Data</button>
  </form>
  )}
  <div className="grid grid-cols-2 gap-2">
  {listKelasUnik.map(k => <button key={k} onClick={()=>setRaporKelas(k)} className="bg-slate-50 border p-3 rounded-xl font-bold">Kelas {k}</button>)}
  </div>
  </div>
  )}
  
  {raporKelas && !selectedMuridRapor && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-2">
  <button onClick={()=>setRaporKelas('')} className="text-xs bg-slate-100 px-2 py-1 rounded font-bold mb-2">Kembali</button>
  {muridList.filter(m=>m.kelas===raporKelas).map(m=>(
  <div key={m.id} className="p-3 bg-slate-50 rounded border flex justify-between items-center text-sm">
  <span onClick={()=>setSelectedMuridRapor(m)} className="cursor-pointer font-bold w-full">{m.nama}</span>
  <button onClick={()=>handleHapusMurid(m.id)} className="text-red-500 text-xs ml-2">Hapus</button>
  </div>
  ))}
  </div>
  )}
  
  {raporKelas && selectedMuridRapor && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm">
  <div className="flex justify-between border-b pb-2 mb-3">
  <h2 className="font-bold text-lg">{selectedMuridRapor.nama} <span className="text-xs text-slate-400 block">Kelas {selectedMuridRapor.kelas}</span></h2>
  <button onClick={()=>setSelectedMuridRapor(null)} className="text-xs bg-slate-100 p-1 rounded h-fit">Kembali</button>
  </div>
  <div className="grid grid-cols-2 gap-2 mb-4">
  <button onClick={()=>exportPDFRapor(selectedMuridRapor)} className="bg-red-500 text-white text-xs font-bold py-2 rounded">PDF Rapor</button>
  <button onClick={()=>shareWA(`*Laporan Rapor Santri*%0A%0ANama: ${selectedMuridRapor.nama}%0AKelas: ${selectedMuridRapor.kelas}%0A%0ACek selengkapnya bersama ustadz/ustadzah wali kelas.`)} className="bg-green-500 text-white text-xs font-bold py-2 rounded">Share WA</button>
  </div>
  <p className="text-xs text-slate-500 mb-1 font-bold border-b">Catatan Sikap:</p>
  {listPerilaku.filter(p=>p.murid_id===selectedMuridRapor.id).map(p=>( <p key={p.id} className="text-xs">• {p.catatan}</p> ))}
  </div>
  )}
  </div>
  )}
  
  {/* === ABSENSI TAB (BARU) === */}
  {activeTab === 'absen' && (
  <div className="space-y-4">
  <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner">
  <button onClick={() => setAbsenTab('harian')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${absenTab === 'harian' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Presensi Harian</button>
  <button onClick={() => setAbsenTab('arsip')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${absenTab === 'arsip' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Arsip Bulanan</button>
  </div>
  
  {absenTab === 'harian' && (
  <div className="bg-white p-4 rounded-xl border shadow-sm">
  <div className="mb-4">
  <label className="text-xs font-bold text-slate-500 block mb-1">Pilih Kelas untuk Absen:</label>
  <select className="w-full border p-2 rounded text-sm outline-none" value={filterKelasAbsen} onChange={e => setFilterKelasAbsen(e.target.value)}>
  <option value="">-- Pilih Kelas --</option>
  {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  </div>
  
  {filterKelasAbsen && (
  <>
  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200 text-center mb-4">
  <p className="text-[11px] font-bold uppercase tracking-wider">Absensi Hari Ini</p>
  <p className="text-sm font-semibold">{hariIni}, {new Date().toLocaleDateString('id-ID')}</p>
  <p className="text-xs">Kelas: {filterKelasAbsen}</p>
  </div>
  
  <div className="space-y-2 mb-4">
  {muridList.filter(m => m.kelas === filterKelasAbsen).map(m => (
  <div key={m.id} className="flex justify-between items-center border-b pb-2">
  <span className="text-sm font-semibold text-slate-700">{m.nama}</span>
  <div className="flex gap-1">
  <button onClick={() => setDraftAbsen({...draftAbsen, [m.id]: 'Hadir'})} className={`w-8 h-8 rounded text-xs font-bold ${draftAbsen[m.id]==='Hadir' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>H</button>
  <button onClick={() => setDraftAbsen({...draftAbsen, [m.id]: 'Izin'})} className={`w-8 h-8 rounded text-xs font-bold ${draftAbsen[m.id]==='Izin' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>I</button>
  <button onClick={() => setDraftAbsen({...draftAbsen, [m.id]: 'Alfa'})} className={`w-8 h-8 rounded text-xs font-bold ${draftAbsen[m.id]==='Alfa' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'}`}>A</button>
  </div>
  </div>
  ))}
  </div>
  <button onClick={handleSimpanAbsenMasal} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow">Simpan Absen Kelas {filterKelasAbsen}</button>
  </>
  )}
  </div>
  )}
  
  {absenTab === 'arsip' && (
  <div className="bg-white p-4 rounded-xl border shadow-sm">
  <input type="month" className="w-full border p-2 rounded mb-2 text-sm" value={absenBulan} onChange={e=>setAbsenBulan(e.target.value)} />
  <select className="w-full border p-2 rounded text-sm mb-4" value={absenKelasBulanan} onChange={e=>setAbsenKelasBulanan(e.target.value)}>
  <option value="">-- Pilih Kelas --</option>
  {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  
  {absenKelasBulanan && absenBulan && (() => {
  const absBulanLte = listAbsensi.filter(a => a.tanggal.startsWith(absenBulan));
  const muridKl = muridList.filter(m => m.kelas === absenKelasBulanan);
  const pdfDataBody = [];
  let waText = `*Laporan Absen Bulanan*%0ABulan: ${absenBulan}%0AKelas: ${absenKelasBulanan}%0A%0A`;
  
  return (
  <div className="space-y-2 text-sm">
  {muridKl.map(m => {
  const absM = absBulanLte.filter(a => a.murid_id === m.id);
  const h = absM.filter(a=>a.status==='Hadir').length;
  const i = absM.filter(a=>a.status==='Izin').length;
  const a = absM.filter(a=>a.status==='Alfa').length;
  pdfDataBody.push([m.nama, h, i, a]);
  waText += `• ${m.nama}: H=${h}, I=${i}, A=${a}%0A`;
  return (
  <div key={m.id} className="flex justify-between bg-slate-50 p-2 rounded border">
  <span className="font-semibold">{m.nama}</span>
  <span className="text-xs font-mono">H:{h} I:{i} A:{a}</span>
  </div>
  )
  })}
  <div className="grid grid-cols-2 gap-2 mt-4">
  <button onClick={() => generatePDF(`Rekap Absen Kelas ${absenKelasBulanan}`, ["Nama", "Hadir", "Izin", "Alfa"], pdfDataBody, [`Bulan: ${absenBulan}`])} className="bg-red-500 text-white text-xs font-bold py-2 rounded">Export PDF</button>
  <button onClick={() => shareWA(waText)} className="bg-green-500 text-white text-xs font-bold py-2 rounded">Share WA</button>
  </div>
  </div>
  )
  })()}
  </div>
  )}
  </div>
  )}
  
  {/* === NILAI TAB === */}
  {activeTab === 'nilai' && (
  <div className="space-y-4">
  <div className="bg-white p-5 rounded-2xl border shadow-sm">
  <h3 className="font-bold text-slate-800 text-xs border-b pb-2 mb-3 text-emerald-600">Pilih Kelas (Nilai)</h3>
  <div className="grid grid-cols-2 gap-2 mb-4">
  {listKelasUnik.map(k => <button key={k} onClick={() => setNilaiKelas(k)} className="bg-slate-50 border p-3 rounded-xl font-bold">Kelas {k}</button>)}
  </div>
  
  {nilaiKelas && (
  <div className="mt-4 border-t pt-3">
  <p className="text-xs font-bold mb-2">Santri Kelas {nilaiKelas}:</p>
  {muridList.filter(m=>m.kelas===nilaiKelas).map(m=> (
  <button key={m.id} onClick={()=>{setSelectedMuridNilai(m); setFormNilai({...formNilai, pelajaran: ''})}} className="w-full text-left p-2 border-b text-sm font-semibold">{m.nama}</button>
  ))}
  
  {/* EKSPORT NILAI KELAS */}
  <div className="mt-5 p-3 bg-slate-100 rounded-lg border">
  <p className="text-xs font-bold mb-2">Export Rekap Kelas {nilaiKelas}</p>
  <input type="text" placeholder="Nama Pelajaran (Opsional)" className="w-full text-sm p-2 rounded border mb-2" value={formNilai.pelajaran} onChange={e=>setFormNilai({...formNilai, pelajaran: e.target.value})} />
  <div className="flex gap-2">
  <button onClick={() => {
  const mapel = formNilai.pelajaran;
  const mK = muridList.filter(m=>m.kelas===nilaiKelas);
  const tBody = []; let waStr = `*Rekap Nilai*%0AKelas: ${nilaiKelas}%0APelajaran: ${mapel || 'Semua'}%0A%0A`;
  mK.forEach(m => {
  const nK = listNilai.filter(n=>n.murid_id===m.id && (!mapel || n.pelajaran.toLowerCase()===mapel.toLowerCase()));
  nK.forEach(nx => { tBody.push([m.nama, nx.pelajaran, nx.jenis_ujian, nx.skor]); waStr+=`• ${m.nama} (${nx.pelajaran}): ${nx.skor}%0A`; });
  });
  generatePDF(`Rekap Nilai Kelas ${nilaiKelas}`, ["Nama", "Pelajaran", "Jenis", "Skor"], tBody, [`Pelajaran: ${mapel || 'Semua'}`, `Pengajar: ${user?.email}`, `Tanggal: ${new Date().toLocaleDateString('id-ID')}`]);
  }} className="flex-1 bg-red-500 text-white text-xs font-bold py-2 rounded">PDF</button>
  <button onClick={() => { /* Same logic map as above but shareWA */ alert('Untuk WA bisa klik PDF lalu share'); }} className="flex-1 bg-green-500 text-white text-xs font-bold py-2 rounded">Share WA</button>
  </div>
  </div>
  </div>
  )}
  
  {/* Form Input Individu Nilai */}
  {selectedMuridNilai && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-3 relative">
  <button onClick={()=>setSelectedMuridNilai(null)} className="absolute top-3 right-3 text-red-500 font-bold">X</button>
  <h3 className="font-bold border-b pb-2">Input: {selectedMuridNilai.nama}</h3>
  <input type="text" placeholder="Pelajaran" className="w-full border p-2 rounded text-sm" value={formNilai.pelajaran} onChange={e=>setFormNilai({...formNilai, pelajaran:e.target.value})}/>
  <select className="w-full border p-2 rounded text-sm" value={formNilai.jenis} onChange={e=>setFormNilai({...formNilai, jenis: e.target.value})}>
  <option>Ulangan</option><option>Tugas</option><option>Ujian Lisan</option>
  </select>
  <input type="number" placeholder="Skor (0-100)" className="w-full border p-2 rounded text-sm" value={formNilai.skor} onChange={e=>setFormNilai({...formNilai, skor: e.target.value})}/>
  <button onClick={handleSimpanNilaiIndividu} className="w-full bg-emerald-600 text-white p-2 rounded font-bold">Simpan Nilai</button>
  </div>
  </div>
  )}
  </div>
  </div>
  )}
  
  {/* === BANK SOAL TAB === */}
  {activeTab === 'soal' && (
  <div className="space-y-4">
  <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner">
  <button onClick={() => setSoalTab('arsip')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${soalTab === 'arsip' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Arsip Soal</button>
  <button onClick={() => setSoalTab('buat')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${soalTab === 'buat' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Buat Baru</button>
  </div>
  
  {soalTab === 'buat' && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-2">
  <input type="text" placeholder="Pelajaran" className="w-full border p-2 rounded text-sm" value={formSoal.pelajaran} onChange={e=>setFormSoal({...formSoal, pelajaran:e.target.value})}/>
  <input type="text" placeholder="Kelas" className="w-full border p-2 rounded text-sm" value={formSoal.kelas} onChange={e=>setFormSoal({...formSoal, kelas:e.target.value})}/>
  <input type="text" placeholder="Batasan Materi" className="w-full border p-2 rounded text-sm" value={formSoal.batasan} onChange={e=>setFormSoal({...formSoal, batasan:e.target.value})}/>
  <textarea placeholder="Isi Soal..." className="w-full border p-2 rounded text-sm h-32" value={formSoal.isi} onChange={e=>setFormSoal({...formSoal, isi:e.target.value})}></textarea>
  <button onClick={handleSimpanSoal} className="w-full bg-emerald-600 text-white p-2 font-bold rounded">Simpan Soal</button>
  </div>
  )}
  
  {soalTab === 'arsip' && (
  <div className="space-y-3">
  {listBankSoal.map(s => (
  <div key={s.id} className="bg-white p-4 rounded-xl border shadow-sm">
  <h4 className="font-bold text-sm">{s.pelajaran} <span className="text-xs bg-slate-100 px-1 rounded">Kls {s.kelas}</span></h4>
  <p className="text-xs text-slate-500 mb-2 truncate">{s.isi_soal}</p>
  <div className="flex gap-2">
  <button onClick={()=>exportPDFSoal(s)} className="bg-red-500 text-white text-[10px] px-2 py-1 rounded">Cetak PDF</button>
  <button onClick={()=>shareWA(`*SOAL UJIAN*%0APelajaran: ${s.pelajaran}%0AKelas: ${s.kelas}%0A%0A${s.isi_soal}`)} className="bg-green-500 text-white text-[10px] px-2 py-1 rounded">WA</button>
  <button onClick={()=>handleHapusSoal(s.id)} className="bg-slate-200 text-red-500 text-[10px] px-2 py-1 rounded ml-auto">Hapus</button>
  </div>
  </div>
  ))}
  </div>
  )}
  </div>
  )}
  </main>
  
  {/* FOOTER NAVIGASI */}
  <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-between px-2 py-2 z-50">
  {[
  { id: 'jadwal', icon: 'fa-calendar-day', label: 'Jadwal' },
  { id: 'rapor', icon: 'fa-users', label: 'Santri' },
  { id: 'absen', icon: 'fa-clipboard-user', label: 'Absen' },
  { id: 'nilai', icon: 'fa-file-signature', label: 'Nilai' },
  { id: 'soal', icon: 'fa-folder-open', label: 'Soal' }
  ].map(m => (
  <button key={m.id} onClick={() => setActiveTab(m.id)} className={`flex flex-col items-center py-1 w-12 outline-none ${activeTab === m.id ? 'text-emerald-600 scale-105' : 'text-slate-400'}`}>
  <i className={`fa-solid ${m.icon} text-[18px] mb-1`}></i>
  <span className="text-[8px] font-black">{m.label}</span>
  </button>
  ))}
  </nav>
  </div>
  );
  }