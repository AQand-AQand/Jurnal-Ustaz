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
  
  const [activeTab, setActiveTab] = useState('absen');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [now, setNow] = useState(new Date());

  // === DATA STATE ===
  const [muridList, setMuridList] = useState([]);
  const [listAbsensi, setListAbsensi] = useState([]);
  const [listPerilaku, setListPerilaku] = useState([]);
  const [listNilai, setListNilai] = useState([]);
  const [listBankSoal, setListBankSoal] = useState([]);
  const [listJadwal, setListJadwal] = useState([]);
  const [listSakuBatas, setListSakuBatas] = useState([]);

  // === FORM & UI STATE ===
  const [absenTab, setAbsenTab] = useState('harian'); 
  const [soalTab, setSoalTab] = useState('arsip');
  
  const [formMurid, setFormMurid] = useState({ id: null, nama: '', kelas: '', alamat: '', domisili: '' });
  const [formPerilaku, setFormPerilaku] = useState({ murid_id: '', catatan: '' });
  const [formSoal, setFormSoal] = useState({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' });
  const [formJadwal, setFormJadwal] = useState({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  const [formSakuBatas, setFormSakuBatas] = useState({ kelas: '', materi: '', halaman: '' });
  const [formNilai, setFormNilai] = useState({ pelajaran: '', jenis: 'Ulangan', skor: '' });

  // === FILTER & SELECTION STATE ===
  const [filterKelasAbsen, setFilterKelasAbsen] = useState('');
  const [draftAbsen, setDraftAbsen] = useState({}); 
  const [absenBulan, setAbsenBulan] = useState(new Date().toISOString().slice(0, 7)); 
  const [absenKelasBulanan, setAbsenKelasBulanan] = useState('');
  
  const [nilaiKelas, setNilaiKelas] = useState('');
  const [selectedMuridNilai, setSelectedMuridNilai] = useState(null);
  const [showTambahMurid, setShowTambahMurid] = useState(false);
  const [showTambahJadwal, setShowTambahJadwal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    
    // Load Data Offline
    setMuridList(JSON.parse(localStorage.getItem('off_murid')) || []);
    setListAbsensi(JSON.parse(localStorage.getItem('off_absen')) || []);
    setListPerilaku(JSON.parse(localStorage.getItem('off_perilaku')) || []);
    setListNilai(JSON.parse(localStorage.getItem('off_nilai')) || []);
    setListBankSoal(JSON.parse(localStorage.getItem('off_soal')) || []);
    setListJadwal(JSON.parse(localStorage.getItem('off_jadwal')) || []);
    setListSakuBatas(JSON.parse(localStorage.getItem('off_sakubatas')) || []);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });

    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => { subscription.unsubscribe(); window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); clearInterval(timer); };
  }, []);

  useEffect(() => { if (user && !isOffline) syncSemuaDataKeCloud(); }, [user, isOffline]);

  useEffect(() => {
    if (muridList.length) localStorage.setItem('off_murid', JSON.stringify(muridList));
    if (listAbsensi.length) localStorage.setItem('off_absen', JSON.stringify(listAbsensi));
    if (listPerilaku.length) localStorage.setItem('off_perilaku', JSON.stringify(listPerilaku));
    if (listNilai.length) localStorage.setItem('off_nilai', JSON.stringify(listNilai));
    if (listBankSoal.length) localStorage.setItem('off_soal', JSON.stringify(listBankSoal));
    if (listJadwal.length) localStorage.setItem('off_jadwal', JSON.stringify(listJadwal));
    if (listSakuBatas.length) localStorage.setItem('off_sakubatas', JSON.stringify(listSakuBatas));
  }, [muridList, listAbsensi, listPerilaku, listNilai, listBankSoal, listJadwal, listSakuBatas]);

  // Init Draft Absen Harian
  useEffect(() => {
    if (filterKelasAbsen) {
      const tgl = now.toISOString().split('T')[0];
      const mKelas = muridList.filter(m => m.kelas === filterKelasAbsen);
      const initDraft = {};
      mKelas.forEach(m => {
        const exist = listAbsensi.find(a => a.murid_id === m.id && a.tanggal === tgl);
        initDraft[m.id] = exist ? exist.status : '';
      });
      setDraftAbsen(initDraft);
    }
  }, [filterKelasAbsen, muridList, listAbsensi]);
  
  const syncSemuaDataKeCloud = async () => {
  if (!navigator.onLine || !SUPABASE_ANON_KEY) return;
  setLoading(true);
  try {
  const { data: m } = await supabase.from('murid').select('*').order('nama', { ascending: true });
  const { data: a } = await supabase.from('absensi').select('*').order('tanggal', { ascending: false });
  const { data: p } = await supabase.from('catatan_perilaku').select('*').order('created_at', { ascending: false });
  const { data: n } = await supabase.from('nilai').select('*').order('created_at', { ascending: false });
  const { data: bs } = await supabase.from('bank_soal').select('*').order('created_at', { ascending: false });
  const { data: jdwl } = await supabase.from('jadwal_mengajar').select('*');
  const { data: skb } = await supabase.from('buku_saku_batas').select('*').order('created_at', { ascending: false });
  
  if (m) setMuridList(m); if (a) setListAbsensi(a); if (p) setListPerilaku(p);
  if (n) setListNilai(n); if (bs) setListBankSoal(bs); if (jdwl) setListJadwal(jdwl); if (skb) setListSakuBatas(skb);
  } catch (err) { console.log(err); } finally { setLoading(false); }
  };
  
  const checkConnection = () => { if (isOffline || !SUPABASE_ANON_KEY) { alert("Data disimpan offline sementara."); return false; } return true; };
  
  // === FITUR PDF & WA ===
  const generatePDF = (title, headers, body, extraInfo = []) => {
  const doc = new jsPDF();
  doc.setFontSize(16); doc.setTextColor(5, 150, 105); doc.text(title, 14, 20);
  doc.setFontSize(10); doc.setTextColor(50, 50, 50);
  let startY = 30; extraInfo.forEach((info) => { doc.text(info, 14, startY); startY += 6; });
  doc.autoTable({ startY: startY + 4, head: [headers], body: body, theme: 'grid', headStyles: { fillColor: [5, 150, 105] }, styles: { fontSize: 9 } });
  doc.save(`${title.replace(/ /g, '_')}.pdf`);
  };
  
  const exportPDFSoal = (soal) => {
  const doc = new jsPDF();
  doc.setFontSize(14); doc.text(`SOAL UJIAN: ${soal.pelajaran.toUpperCase()}`, 14, 20);
  doc.setFontSize(11); doc.text(`Kelas: ${soal.kelas} | Pengajar: ${user?.email}`, 14, 28);
  if(soal.batasan) doc.text(`Batasan: ${soal.batasan}`, 14, 34);
  doc.line(14, 38, 196, 38);
  const splitText = doc.splitTextToSize(soal.isi_soal, 180);
  doc.text(splitText, 14, 48);
  doc.save(`Soal_${soal.pelajaran}_Kls${soal.kelas}.pdf`);
  };
  
  const shareWA = (text) => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  
  // === CRUD HANDLERS ===
  const handleSimpanMurid = async (e) => {
  e.preventDefault(); if(!formMurid.nama || !formMurid.kelas) return;
  const newMurid = { ...formMurid, id: Math.floor(Math.random() * 1000000), ustadz_email: user?.email };
  setMuridList([...muridList, newMurid]); alert("Santri Ditambahkan!");
  if (checkConnection()) supabase.from('murid').insert([newMurid]);
  setFormMurid({ id: null, nama: '', kelas: '', alamat: '', domisili: '' }); setShowTambahMurid(false);
  };
  
  const handleSimpanAbsenMasal = async () => {
  if(!filterKelasAbsen) return alert("Pilih kelas dulu!");
  const tgl = now.toISOString().split('T')[0];
  const absenBaru = []; let lAbsen = [...listAbsensi];
  
  muridList.filter(m => m.kelas === filterKelasAbsen).forEach(m => {
  const status = draftAbsen[m.id];
  if(status) {
  lAbsen = lAbsen.filter(a => !(a.murid_id === m.id && a.tanggal === tgl));
  const item = { id: Math.floor(Math.random()*1000000), murid_id: m.id, status, tanggal: tgl, ustadz_email: user?.email };
  lAbsen.unshift(item); absenBaru.push(item);
  }
  });
  setListAbsensi(lAbsen); alert(`Absensi kelas ${filterKelasAbsen} disimpan!`);
  if(checkConnection() && absenBaru.length > 0) supabase.from('absensi').insert(absenBaru);
  };
  
  const handleSimpanJadwal = async (e) => {
  e.preventDefault();
  const newJadwal = { ...formJadwal, id: Math.floor(Math.random()*1000000), ustadz_email: user?.email };
  setListJadwal([...listJadwal, newJadwal]); setShowTambahJadwal(false);
  if(checkConnection()) supabase.from('jadwal_mengajar').insert([newJadwal]);
  };
  
  const handleSimpanPerilaku = async (e) => {
  e.preventDefault(); if(!formPerilaku.murid_id) return alert("Pilih santri!");
  const newP = { id: Math.floor(Math.random()*1000000), ...formPerilaku, created_at: new Date().toISOString(), ustadz_email: user?.email };
  setListPerilaku([newP, ...listPerilaku]); setFormPerilaku({ murid_id: '', catatan: '' }); alert('Sikap disimpan!');
  if(checkConnection()) supabase.from('catatan_perilaku').insert([newP]);
  };
  
  const handleSimpanSakuBatas = async (e) => {
  e.preventDefault();
  const newSaku = { id: Math.floor(Math.random()*1000000), ...formSakuBatas, created_at: new Date().toISOString(), ustadz_email: user?.email };
  setListSakuBatas([newSaku, ...listSakuBatas]); setFormSakuBatas({ kelas: '', materi: '', halaman: '' }); alert('Batas disimpan!');
  if(checkConnection()) supabase.from('buku_saku_batas').insert([newSaku]);
  };
  
  const handleSimpanNilaiIndividu = async (e) => {
  e.preventDefault(); if(!formNilai.skor) return;
  const newNilai = { id: Math.floor(Math.random()*1000000), murid_id: selectedMuridNilai.id, jenis_ujian: formNilai.jenis, pelajaran: formNilai.pelajaran, skor: parseInt(formNilai.skor), created_at: new Date().toISOString(), ustadz_email: user?.email };
  setListNilai([newNilai, ...listNilai]); setFormNilai({...formNilai, skor: ''}); alert("Nilai Tersimpan!");
  if(checkConnection()) supabase.from('nilai').insert([newNilai]);
  };
  
  const handleSimpanSoal = async (e) => {
  e.preventDefault(); if (!formSoal.pelajaran || !formSoal.isi) return alert("Lengkapi form!");
  const newSoal = { ...formSoal, id: Math.floor(Math.random() * 1000000), ustadz_email: user?.email, created_at: new Date().toISOString() };
  setListBankSoal([newSoal, ...listBankSoal]);
  if(checkConnection()) supabase.from('bank_soal').insert([newSoal]);
  setFormSoal({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' }); setSoalTab('arsip'); alert("Soal disimpan!");
  };
  
  const handleEmailAuth = async (e) => { e.preventDefault(); };
  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))].sort();
  
  if (!user) {
  return (
  <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 max-w-md mx-auto">
  <div className="bg-white p-8 rounded-3xl shadow-lg w-full border border-slate-100">
  <div className="text-center mb-6"><h1 className="text-2xl font-bold text-emerald-600">Buku Ustaz</h1></div>
  <form onSubmit={handleEmailAuth} className="space-y-4">
  <input type="email" placeholder="Email" required className="w-full border rounded-xl py-3 px-4 outline-none" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} />
  <input type="password" placeholder="Password" required className="w-full border rounded-xl py-3 px-4 outline-none" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} />
  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl">Masuk</button>
  </form>
  </div>
  </div>
  );
  }
  
  return (
  <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-md mx-auto shadow-2xl relative pb-24">
  
  {/* HEADER KLASIK */}
  <header className="bg-[#059669] text-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
  <div className="flex items-center gap-3"><i className="fa-solid fa-graduation-cap text-2xl"></i><h1 className="text-xl font-bold">Buku Ustaz</h1></div>
  <div className="flex gap-4 items-center text-lg">
  <button onClick={syncSemuaDataKeCloud} className="opacity-90 hover:opacity-100">{loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}</button>
  <button onClick={() => supabase.auth.signOut()} className="opacity-90 hover:opacity-100"><i className="fa-solid fa-arrow-right-from-bracket"></i></button>
  </div>
  </header>
  
  {/* BANNER INSTAL */}
  {deferredPrompt && (
  <div className="bg-[#d1fae5] text-emerald-800 px-4 py-3 flex justify-between items-center border-b border-emerald-200">
  <div className="flex items-center gap-2 text-sm font-semibold"><i className="fa-solid fa-download"></i> Instal di HP</div>
  <button onClick={() => deferredPrompt.prompt()} className="bg-[#059669] text-white text-xs font-bold px-3 py-1.5 rounded-md shadow">Instal</button>
  </div>
  )}
  
  <main className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
  
  {/* === TAB ABSEN (Utama) === */}
  {activeTab === 'absen' && (
  <div className="space-y-4">
  <div className="flex bg-slate-200 p-1 rounded-xl">
  <button onClick={() => setAbsenTab('harian')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${absenTab === 'harian' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Harian</button>
  <button onClick={() => setAbsenTab('arsip')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${absenTab === 'arsip' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Rekap Bulanan</button>
  </div>
  {absenTab === 'harian' && (
  <>
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
  <div className="text-slate-500 font-medium text-sm flex items-center gap-2"><i className="fa-solid fa-filter"></i> Filter Kelas:</div>
  <select className="border border-slate-200 bg-slate-50 p-1.5 rounded-md text-sm outline-none font-medium" value={filterKelasAbsen} onChange={e => setFilterKelasAbsen(e.target.value)}>
  <option value="">Semua Kelas</option>
  {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  </div>
  {filterKelasAbsen && muridList.filter(m => m.kelas === filterKelasAbsen).map(m => (
  <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
  <div><h4 className="font-bold text-slate-800 text-base">{m.nama}</h4><p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wide">KELAS {m.kelas}</p></div>
  <div className="flex gap-2">
  <button onClick={() => setDraftAbsen({...draftAbsen, [m.id]: 'Hadir'})} className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${draftAbsen[m.id]==='Hadir' ? 'bg-[#059669] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>H</button>
  <button onClick={() => setDraftAbsen({...draftAbsen, [m.id]: 'Izin'})} className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${draftAbsen[m.id]==='Izin' ? 'bg-[#f59e0b] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>I</button>
  <button onClick={() => setDraftAbsen({...draftAbsen, [m.id]: 'Alfa'})} className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${draftAbsen[m.id]==='Alfa' ? 'bg-slate-200 text-slate-500 shadow-inner' : 'bg-slate-100 text-slate-400'}`}>A</button>
  </div>
  </div>
  ))}
  {filterKelasAbsen && <button onClick={handleSimpanAbsenMasal} className="w-full bg-[#059669] text-white font-bold py-3 rounded-xl shadow-md mt-4">Simpan Data Absensi</button>}
  </>
  )}
  {absenTab === 'arsip' && (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
  <h3 className="font-bold text-sm mb-3 text-slate-700">Rekap PDF & Share WA</h3>
  <input type="month" className="w-full border p-2 rounded mb-2 text-sm bg-slate-50" value={absenBulan} onChange={e=>setAbsenBulan(e.target.value)} />
  <select className="w-full border p-2 rounded text-sm mb-4 bg-slate-50" value={absenKelasBulanan} onChange={e=>setAbsenKelasBulanan(e.target.value)}>
  <option value="">-- Pilih Kelas --</option>
  {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  {absenKelasBulanan && absenBulan && (
  <div className="grid grid-cols-2 gap-3 mt-2">
  <button onClick={() => {
  const body = muridList.filter(m=>m.kelas===absenKelasBulanan).map(m => {
  const abs = listAbsensi.filter(a=>a.murid_id===m.id && a.tanggal.startsWith(absenBulan));
  return [m.nama, abs.filter(x=>x.status==='Hadir').length, abs.filter(x=>x.status==='Izin').length, abs.filter(x=>x.status==='Alfa').length];
  });
  generatePDF(`Absen Kelas ${absenKelasBulanan}`, ["Nama", "H", "I", "A"], body, [`Bulan: ${absenBulan}`]);
  }} className="bg-red-500 hover:bg-red-600 text-white py-2 rounded font-bold text-sm shadow"><i className="fa-solid fa-file-pdf mr-1"></i> PDF</button>
  <button onClick={() => shareWA(`*Rekap Absen Kelas ${absenKelasBulanan}*\nBulan: ${absenBulan}\nSilakan cek file PDF yang dikirim ustadz.`)} className="bg-green-500 hover:bg-green-600 text-white py-2 rounded font-bold text-sm shadow"><i className="fa-brands fa-whatsapp mr-1"></i> WA</button>
  </div>
  )}
  </div>
  )}
  </div>
  )}
  
  {/* === TAB JADWAL === */}
  {activeTab === 'jadwal' && (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
  <div className="flex justify-between items-center mb-4 border-b pb-2">
  <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">Jadwal Mengajar</h3>
  <button onClick={() => setShowTambahJadwal(!showTambahJadwal)} className="bg-[#d1fae5] text-emerald-700 px-3 py-1 rounded-md text-xs font-bold">+ Tambah</button>
  </div>
  {showTambahJadwal && (
  <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200 shadow-inner">
  <select className="w-full p-2 text-sm border rounded mb-2 bg-white" value={formJadwal.hari} onChange={e=>setFormJadwal({...formJadwal, hari: e.target.value})}>
  {["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"].map(h=><option key={h}>{h}</option>)}
  </select>
  <input type="time" className="w-full p-2 text-sm border rounded mb-2 bg-white" value={formJadwal.jam_mulai} onChange={e=>setFormJadwal({...formJadwal, jam_mulai:e.target.value})}/>
  <input type="text" placeholder="Kelas" className="w-full p-2 text-sm border rounded mb-2 bg-white" value={formJadwal.kelas} onChange={e=>setFormJadwal({...formJadwal, kelas:e.target.value})}/>
  <input type="text" placeholder="Pelajaran" className="w-full p-2 text-sm border rounded mb-3 bg-white" value={formJadwal.pelajaran} onChange={e=>setFormJadwal({...formJadwal, pelajaran:e.target.value})}/>
  <button onClick={handleSimpanJadwal} className="w-full bg-[#059669] text-white font-bold py-2 rounded shadow">Simpan Jadwal</button>
  </div>
  )}
  {["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"].map(hari => {
  const jd = listJadwal.filter(j => j.hari === hari); if(jd.length===0) return null;
  return (
  <div key={hari} className="mb-3 border rounded-xl p-3 bg-slate-50">
  <h4 className="font-bold text-sm text-slate-700 border-b pb-1 mb-2">{hari}</h4>
  {jd.map(j => (
  <div key={j.id} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100 last:border-0">
  <span className="text-slate-600 font-medium">{j.jam_mulai} - {j.pelajaran} (Kls {j.kelas})</span>
  <button className="text-red-400 hover:text-red-600 text-xs font-bold">Hapus</button>
  </div>
  ))}
  </div>
  )
  })}
  </div>
  )}
  
  {/* === TAB SANTRI === */}
  {activeTab === 'santri' && (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
  <div className="flex justify-between items-center mb-4 border-b pb-2">
  <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">Data Santri</h3>
  <button onClick={() => setShowTambahMurid(!showTambahMurid)} className="bg-[#059669] text-white px-3 py-1 rounded-md text-xs font-bold shadow">+ Santri</button>
  </div>
  {showTambahMurid && (
  <div className="mb-4 bg-slate-50 p-4 rounded-xl border shadow-inner">
  <input type="text" placeholder="Nama Santri" className="w-full p-2 border rounded mb-2 text-sm bg-white" value={formMurid.nama} onChange={e=>setFormMurid({...formMurid, nama:e.target.value})}/>
  <input type="text" placeholder="Kelas" className="w-full p-2 border rounded mb-3 text-sm bg-white" value={formMurid.kelas} onChange={e=>setFormMurid({...formMurid, kelas:e.target.value})}/>
  <button onClick={handleSimpanMurid} className="w-full bg-[#059669] text-white py-2 rounded font-bold text-sm shadow">Simpan</button>
  </div>
  )}
  <div className="space-y-2">
  {muridList.map(m => (
  <div key={m.id} className="p-3 border border-slate-100 rounded-xl flex justify-between bg-white shadow-sm items-center">
  <div><p className="font-bold text-sm text-slate-800">{m.nama}</p><p className="text-[10px] text-emerald-600 font-bold uppercase">Kelas {m.kelas}</p></div>
  </div>
  ))}
  </div>
  </div>
  )}
  
  {/* === TAB SAKU === */}
  {activeTab === 'saku' && (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
  <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm mb-3 border-b pb-2">Buku Saku (Batas Mengajar)</h3>
  <div className="bg-slate-50 p-4 rounded-xl border mb-4 shadow-inner">
  <input type="text" placeholder="Kelas" className="w-full p-2 border rounded mb-2 text-sm bg-white" value={formSakuBatas.kelas} onChange={e=>setFormSakuBatas({...formSakuBatas, kelas:e.target.value})}/>
  <input type="text" placeholder="Materi / Kitab" className="w-full p-2 border rounded mb-2 text-sm bg-white" value={formSakuBatas.materi} onChange={e=>setFormSakuBatas({...formSakuBatas, materi:e.target.value})}/>
  <input type="text" placeholder="Halaman / Bab" className="w-full p-2 border rounded mb-3 text-sm bg-white" value={formSakuBatas.halaman} onChange={e=>setFormSakuBatas({...formSakuBatas, halaman:e.target.value})}/>
  <button onClick={handleSimpanSakuBatas} className="w-full bg-[#059669] text-white py-2 rounded font-bold text-sm shadow">Simpan Batas</button>
  </div>
  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Riwayat Mengajar:</p>
  <div className="space-y-2">
  {listSakuBatas.map(s => (
  <div key={s.id} className="p-3 border rounded-lg bg-white text-sm shadow-sm">
  <span className="font-bold text-emerald-700">Kls {s.kelas}</span> - {s.materi} <span className="text-slate-500">(Hal: {s.halaman})</span>
  </div>
  ))}
  </div>
  </div>
  )}
  
  {/* === TAB SIKAP === */}
  {activeTab === 'sikap' && (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
  <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm mb-3 border-b pb-2">Catatan Sikap & Perilaku</h3>
  <div className="bg-slate-50 p-4 rounded-xl border mb-4 shadow-inner">
  <select className="w-full p-2 border rounded mb-2 text-sm bg-white" value={formPerilaku.murid_id} onChange={e=>setFormPerilaku({...formPerilaku, murid_id: e.target.value})}>
  <option value="">-- Pilih Santri --</option>
  {muridList.map(m => <option key={m.id} value={m.id}>{m.nama} (Kls {m.kelas})</option>)}
  </select>
  <textarea placeholder="Tulis catatan pelanggaran atau prestasi..." className="w-full p-2 border rounded mb-3 text-sm h-24 bg-white" value={formPerilaku.catatan} onChange={e=>setFormPerilaku({...formPerilaku, catatan: e.target.value})}></textarea>
  <button onClick={handleSimpanPerilaku} className="w-full bg-[#059669] text-white py-2 rounded font-bold text-sm shadow">Simpan Catatan</button>
  </div>
  <div className="space-y-2">
  {listPerilaku.map(p => {
  const m = muridList.find(x=>x.id===p.murid_id);
  return (
  <div key={p.id} className="p-3 border rounded-lg bg-white shadow-sm">
  <p className="font-bold text-sm text-slate-800">{m?.nama || 'Unknown'}</p>
  <p className="text-xs text-slate-600 mt-1 italic">"{p.catatan}"</p>
  </div>
  )
  })}
  </div>
  </div>
  )}
  
  {/* === TAB NILAI (UI LENGKAP & EXPORT) === */}
  {activeTab === 'nilai' && (
  <div className="space-y-4">
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
  <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm border-b pb-2 mb-4">Input & Rekap Nilai</h3>
  
  {/* Pilih Kelas */}
  {!selectedMuridNilai && (
  <>
  <p className="text-xs font-bold text-slate-500 mb-2 uppercase">1. Pilih Kelas</p>
  <div className="grid grid-cols-2 gap-2 mb-4">
  {listKelasUnik.map(k => <button key={k} onClick={() => setNilaiKelas(k)} className={`border p-3 rounded-xl font-bold text-sm transition-colors ${nilaiKelas===k ? 'bg-[#059669] text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Kelas {k}</button>)}
  </div>
  
  {nilaiKelas && (
  <div className="mt-4 border-t pt-4">
  <p className="text-xs font-bold text-slate-500 mb-2 uppercase">2. Pilih Santri</p>
  <div className="space-y-2 mb-6">
  {muridList.filter(m=>m.kelas===nilaiKelas).map(m=> (
  <button key={m.id} onClick={()=>{setSelectedMuridNilai(m); setFormNilai({...formNilai, pelajaran: ''})}} className="w-full text-left p-3 border rounded-lg text-sm font-semibold bg-white shadow-sm hover:border-[#059669]">{m.nama}</button>
  ))}
  </div>
  
  {/* EXPORT NILAI KELAS */}
  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
  <p className="text-xs font-bold mb-2 text-slate-700">Cetak Rapor/Rekap Kelas {nilaiKelas}</p>
  <input type="text" placeholder="Nama Pelajaran (Opsional)" className="w-full text-sm p-2 rounded border mb-3 bg-white" value={formNilai.pelajaran} onChange={e=>setFormNilai({...formNilai, pelajaran: e.target.value})} />
  <div className="grid grid-cols-2 gap-3">
  <button onClick={() => {
  const mapel = formNilai.pelajaran; const mK = muridList.filter(m=>m.kelas===nilaiKelas); const tBody = [];
  mK.forEach(m => {
  const nK = listNilai.filter(n=>n.murid_id===m.id && (!mapel || n.pelajaran.toLowerCase()===mapel.toLowerCase()));
  nK.forEach(nx => { tBody.push([m.nama, nx.pelajaran, nx.jenis_ujian, nx.skor]); });
  });
  generatePDF(`Rekap Nilai Kelas ${nilaiKelas}`, ["Nama", "Pelajaran", "Jenis", "Skor"], tBody, [`Pelajaran: ${mapel || 'Semua'}`, `Tanggal: ${new Date().toLocaleDateString('id-ID')}`]);
  }} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2.5 rounded shadow"><i className="fa-solid fa-file-pdf"></i> PDF</button>
  <button onClick={() => shareWA(`*Rekap Nilai Kelas ${nilaiKelas}*\nPelajaran: ${formNilai.pelajaran || 'Semua'}\nCek PDF rapor dari ustadz.`)} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2.5 rounded shadow"><i className="fa-brands fa-whatsapp"></i> WA</button>
  </div>
  </div>
  </div>
  )}
  </>
  )}
  
  {/* Form Input Individu */}
  {selectedMuridNilai && (
  <div className="bg-slate-50 p-4 rounded-xl border shadow-inner">
  <div className="flex justify-between items-center border-b pb-2 mb-3">
  <h4 className="font-bold text-sm">Input: {selectedMuridNilai.nama}</h4>
  <button onClick={()=>setSelectedMuridNilai(null)} className="text-xs bg-slate-200 px-2 py-1 rounded font-bold text-slate-600 hover:bg-slate-300">Kembali</button>
  </div>
  <input type="text" placeholder="Mata Pelajaran" className="w-full border p-2 rounded mb-2 text-sm bg-white" value={formNilai.pelajaran} onChange={e=>setFormNilai({...formNilai, pelajaran:e.target.value})}/>
  <select className="w-full border p-2 rounded mb-2 text-sm bg-white" value={formNilai.jenis} onChange={e=>setFormNilai({...formNilai, jenis: e.target.value})}>
  <option>Ulangan</option><option>Tugas</option><option>Ujian Lisan</option>
  </select>
  <input type="number" placeholder="Skor (0-100)" className="w-full border p-2 rounded mb-3 text-sm bg-white" value={formNilai.skor} onChange={e=>setFormNilai({...formNilai, skor: e.target.value})}/>
  <button onClick={handleSimpanNilaiIndividu} className="w-full bg-[#059669] text-white p-2.5 rounded font-bold text-sm shadow">Simpan Nilai</button>
  </div>
  )}
  </div>
  </div>
  )}
  
  {/* === TAB SOAL (UI LENGKAP & EXPORT) === */}
  {activeTab === 'soal' && (
  <div className="space-y-4">
  <div className="flex bg-slate-200 p-1 rounded-xl">
  <button onClick={() => setSoalTab('arsip')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${soalTab === 'arsip' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Arsip Soal</button>
  <button onClick={() => setSoalTab('buat')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${soalTab === 'buat' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Buat Baru</button>
  </div>
  
  {soalTab === 'buat' && (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
  <h3 className="font-bold text-sm mb-3 border-b pb-2">Buat Soal Ujian Baru</h3>
  <input type="text" placeholder="Mata Pelajaran" className="w-full border p-2 rounded mb-2 text-sm bg-slate-50" value={formSoal.pelajaran} onChange={e=>setFormSoal({...formSoal, pelajaran:e.target.value})}/>
  <input type="text" placeholder="Kelas" className="w-full border p-2 rounded mb-2 text-sm bg-slate-50" value={formSoal.kelas} onChange={e=>setFormSoal({...formSoal, kelas:e.target.value})}/>
  <input type="text" placeholder="Batasan Materi (Opsional)" className="w-full border p-2 rounded mb-2 text-sm bg-slate-50" value={formSoal.batasan} onChange={e=>setFormSoal({...formSoal, batasan:e.target.value})}/>
  <textarea placeholder="Ketik isi soal di sini..." className="w-full border p-2 rounded mb-3 text-sm h-32 bg-slate-50" value={formSoal.isi} onChange={e=>setFormSoal({...formSoal, isi:e.target.value})}></textarea>
  <button onClick={handleSimpanSoal} className="w-full bg-[#059669] text-white py-2.5 font-bold rounded shadow text-sm">Simpan ke Bank Soal</button>
  </div>
  )}
  
  {soalTab === 'arsip' && (
  <div className="space-y-3">
  {listBankSoal.map(s => (
  <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
  <h4 className="font-bold text-sm text-slate-800">{s.pelajaran} <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded ml-1">Kls {s.kelas}</span></h4>
  <p className="text-xs text-slate-500 mt-2 mb-3 line-clamp-2 italic">"{s.isi_soal}"</p>
  <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t">
  <button onClick={()=>exportPDFSoal(s)} className="bg-red-500 hover:bg-red-600 text-white text-[11px] py-1.5 rounded font-bold shadow"><i className="fa-solid fa-print"></i> Cetak PDF</button>
  <button onClick={()=>shareWA(`*SOAL UJIAN*\nPelajaran: ${s.pelajaran}\nKelas: ${s.kelas}\n\n${s.isi_soal}`)} className="bg-green-500 hover:bg-green-600 text-white text-[11px] py-1.5 rounded font-bold shadow"><i className="fa-brands fa-whatsapp"></i> Kirim WA</button>
  </div>
  </div>
  ))}
  </div>
  )}
  </div>
  )}
  </main>
  
  {/* === FOOTER NAVIGASI (7 TAB DIKEMBALIKAN 100% SESUAI GAMBAR 2) === */}
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-between px-1 py-1 z-50 max-w-md mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
  {[
  { id: 'jadwal', icon: 'fa-calendar-days', label: 'Jadwal' },
  { id: 'santri', icon: 'fa-users', label: 'Santri' },
  { id: 'absen', icon: 'fa-clipboard-user', label: 'Absen' },
  { id: 'saku', icon: 'fa-book', label: 'Saku' },
  { id: 'sikap', icon: 'fa-star', label: 'Sikap' },
  { id: 'nilai', icon: 'fa-file-signature', label: 'Nilai' },
  { id: 'soal', icon: 'fa-folder-open', label: 'Soal' }
  ].map(m => (
  <button key={m.id} onClick={() => setActiveTab(m.id)} className={`flex flex-col items-center justify-center pt-2 pb-1 w-full rounded-lg transition-colors ${activeTab === m.id ? 'text-[#059669]' : 'text-slate-400 hover:bg-slate-50'}`}>
  <i className={`fa-solid ${m.icon} text-[18px] mb-1`}></i>
  <span className="text-[9px] font-bold tracking-tight">{m.label}</span>
  </button>
  ))}
  </nav>
  </div>
  );
  }