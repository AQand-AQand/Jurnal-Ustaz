import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// === CONFIG & INITIALIZATION ===
const SUPABASE_URL = "https://gjfdxqhwwytcgylokksq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1SSrr1ebYfBvZ7V60egzfg__Q_wz_Pm";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  // --- CORE & AUTH STATE ---
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); 

  const [activeTab, setActiveTab] = useState('jadwal');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [now, setNow] = useState(new Date());

  // --- DATABASE DATA STATE (Sesuai App.jsx Asli Ustadz) ---
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

  // --- UI & TAB CONTROL STATE (Kombinasi UI Modern) ---
  const [absenTab, setAbsenTab] = useState('harian'); 
  const [bukuSakuTab, setBukuSakuTab] = useState('batas');
  const [nilaiModeTab, setNilaiModeTab] = useState('ujian');
  const [soalTab, setSoalTab] = useState('arsip'); 

  // --- FORM STATES (Utuh dari App.jsx Ustadz) ---
  const [formMurid, setFormMurid] = useState({ id: null, nama: '', kelas: '', alamat: '', domisili: '' });
  const [formPerilaku, setFormPerilaku] = useState({ catatan: '' });
  const [formSoal, setFormSoal] = useState({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' });
  const [formJadwal, setFormJadwal] = useState({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  const [formSakuBatas, setFormSakuBatas] = useState({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
  const [formSakuTagihan, setFormSakuTagihan] = useState({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
  const [formCapaian, setFormCapaian] = useState({ capaian: '', tanggal: new Date().toISOString().split('T')[0] });

  const [formNilai, setFormNilai] = useState({ pelajaran: '', jenis: 'Ulangan', skor: '' });

  // --- FILTER & NAVIGATION STATES ---
  const [filterKelasAbsen, setFilterKelasAbsen] = useState('');
  const [draftAbsen, setDraftAbsen] = useState({}); 
  const [absenBulan, setAbsenBulan] = useState(new Date().toISOString().slice(0, 7));
  const [absenTahun, setAbsenTahun] = useState(new Date().getFullYear().toString());
  const [absenKelasBulanan, setAbsenKelasBulanan] = useState('');
  const [absenRekapType, setAbsenRekapType] = useState('bulanan');

  const [nilaiKelas, setNilaiKelas] = useState('');
  const [selectedMuridNilai, setSelectedMuridNilai] = useState(null);
  const [hafalanKelas, setHafalanKelas] = useState('');
  const [selectedMuridHafalan, setSelectedMuridHafalan] = useState(null);
  const [perilakuKelas, setPerilakuKelas] = useState('');
  const [selectedMuridPerilaku, setSelectedMuridPerilaku] = useState(null);
  const [raporKelas, setRaporKelas] = useState('');
  const [selectedMuridRapor, setSelectedMuridRapor] = useState(null);
  
  const [showTambahMurid, setShowTambahMurid] = useState(false);
  const [showTambahJadwal, setShowTambahJadwal] = useState(false);

  // === SYSTEM EFFECTS ===
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    
    // Load Data Offline
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

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const timer = setInterval(() => setNow(new Date()), 1000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleBackButton = (e) => {
      if (activeTab !== 'jadwal') {
        e.preventDefault();
        setActiveTab('jadwal');
        window.history.pushState(null, '', window.location.pathname);
      }
    };
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [activeTab]);

  useEffect(() => {
    if (user && !isOffline) syncSemuaDataKeCloud();
  }, [user, isOffline]);

  useEffect(() => {
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

  // === FUNGSI SINKRONISASI & KONEKSI ===
  const syncSemuaDataKeCloud = async () => {
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
  
  if (m) setMuridList(m);
  if (a) setListAbsensi(a);
  if (b) setListBatas(b);
  if (p) setListPerilaku(p);
  if (n) setListNilai(n);
  if (bs) setListBankSoal(bs);
  if (jdwl) setListJadwal(jdwl);
  if (skb) setListSakuBatas(skb);
  if (skt) setListSakuTagihan(skt);
  if (ch) setListCapaian(ch);
  } catch (err) {
  console.log("Gagal sinkron:", err);
  } finally {
  setLoading(false);
  }
  };
  
  const checkConnection = () => {
  if (isOffline || !SUPABASE_ANON_KEY) {
  alert("Aplikasi offline! Data hanya disimpan di HP sementara waktu.");
  return false;
  }
  return true;
  };
  
  // --- GLOBAL EXPORT LOGIC UTILITIES (Fungsi PDF & WA Modern Baru) ---
  const generatePDF = (title, headers, body, extraInfo = []) => {
  const doc = new jsPDF();
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18); doc.setTextColor(5, 150, 105); doc.text(title, 14, 20);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10); doc.setTextColor(100, 116, 139);
  let startY = 28;
  extraInfo.forEach((info) => { doc.text(info, 14, startY); startY += 6; });
  doc.autoTable({ 
  startY: startY + 4, head: [headers], body: body, theme: 'grid', 
  headStyles: { fillColor: [5, 150, 105], fontSize: 10, fontStyle: 'bold', halign: 'center' }, 
  styles: { fontSize: 9, font: "Helvetica", textColor: [51, 65, 85] }, 
  alternateRowStyles: { fillColor: [248, 250, 252] }
  });
  doc.save(`${title.replace(/ /g, '_')}.pdf`);
  };
  
  const shareWA = (text) => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  
  // --- EXPORT LAMA (DIPERTAHANKAN 100% UNTUK RAPOR, SOAL & NILAI KELAS) ---
  const exportSoalPDF = (soal) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Soal Ujian: ${soal.pelajaran}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Pengajar: ${user?.email || 'Ustaz'}`, 14, 28);
  doc.text(`Kelas: ${soal.kelas}`, 14, 34);
  doc.text(`Batasan: ${soal.batasan || '-'}`, 14, 40);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 46);
  doc.line(14, 50, 196, 50);
  doc.setFontSize(12);
  const splitText = doc.splitTextToSize(soal.isi_soal, 180);
  doc.text(splitText, 14, 60);
  doc.save(`Soal_${soal.pelajaran}_Kelas_${soal.kelas}.pdf`);
  };
  
  const shareSoalWA = (soal) => {
  const text = `*SOAL UJIAN*\n📚 Pelajaran: ${soal.pelajaran}\n👨‍🏫 Pengajar: ${user?.email || 'Ustaz'}\n🏫 Kelas: ${soal.kelas}\n📑 Batasan: ${soal.batasan || '-'}\n\n*Pertanyaan:*\n${soal.isi_soal}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };
  
  const exportNilaiKelasPDF = (kelas) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Rekap Nilai Kelas ${kelas}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Nama Pengajar: ${user?.email || 'Ustaz'}`, 14, 28);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 34);
  
  const muridDiKelas = muridList.filter(m => m.kelas === kelas);
  const tableData = [];
  
  muridDiKelas.forEach(m => {
  const nilaiMurid = listNilai.filter(n => n.murid_id === m.id);
  if (nilaiMurid.length === 0) {
  tableData.push([m.nama, '-', '-', '-']);
  } else {
  nilaiMurid.forEach(n => {
  tableData.push([m.nama, n.pelajaran, n.jenis_ujian, n.skor]);
  });
  }
  });
  
  doc.autoTable({
  startY: 40,
  head: [['Nama Santri', 'Pelajaran', 'Jenis Ujian', 'Skor']],
  body: tableData,
  theme: 'grid',
  headStyles: { fillColor: [5, 150, 105] }
  });
  doc.save(`Rekap_Nilai_Kelas_${kelas}.pdf`);
  };
  
  const shareNilaiKelasWA = (kelas) => {
  let text = `*REKAP NILAI KELAS ${kelas}*\n👨‍🏫 Pengajar: ${user?.email || 'Ustaz'}\n📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`;
  const muridDiKelas = muridList.filter(m => m.kelas === kelas);
  muridDiKelas.forEach(m => {
  const nilaiMurid = listNilai.filter(n => n.murid_id === m.id);
  if(nilaiMurid.length > 0) {
  text += `👤 *${m.nama}*\n`;
  nilaiMurid.forEach(n => { text += `- ${n.pelajaran} (${n.jenis_ujian}): ${n.skor}\n`; });
  text += `\n`;
  }
  });
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };
  
  const exportRaporPDF = (murid) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Rapor Akademik Santri`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Nama Santri: ${murid.nama}`, 14, 28);
  doc.text(`Kelas: ${murid.kelas}`, 14, 34);
  doc.text(`Pengajar: ${user?.email || 'Ustaz'}`, 14, 40);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 46);
  
  const absens = listAbsensi.filter(a => a.murid_id === murid.id);
  const hadir = absens.filter(a => a.status === 'Hadir').length;
  doc.text(`Total Kehadiran: ${hadir} Hari (dari ${absens.length} tercatat)`, 14, 52);
  
  const nilais = listNilai.filter(n => n.murid_id === murid.id);
  const tableData = nilais.map(n => [n.pelajaran, n.jenis_ujian, n.skor]);
  
  doc.autoTable({
  startY: 60,
  head: [['Mata Pelajaran', 'Jenis Ujian', 'Skor Nilai']],
  body: tableData,
  theme: 'grid',
  headStyles: { fillColor: [5, 150, 105] },
  emptyRowContent: 'Belum ada nilai tercatat'
  });
  doc.save(`Rapor_${murid.nama}.pdf`);
  };
  
  const shareRaporWA = (murid) => {
  const absens = listAbsensi.filter(a => a.murid_id === murid.id);
  const hadir = absens.filter(a => a.status === 'Hadir').length;
  const nilais = listNilai.filter(n => n.murid_id === murid.id);
  
  let text = `*RAPOR AKADEMIK SANTRI*\n👤 Nama: ${murid.nama}\n🏫 Kelas: ${murid.kelas}\n👨‍🏫 Pengajar: ${user?.email || 'Ustaz'}\n📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n*📊 Kehadiran:*\n${hadir} Hari Hadir (dari ${absens.length} tercatat)\n\n*📝 Nilai Ujian:*\n`;
  if (nilais.length === 0) text += `- Belum ada nilai\n`;
  nilais.forEach(n => { text += `- ${n.pelajaran} (${n.jenis_ujian}): *${n.skor}*\n`; });
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };
  
  const handleInstallPWA = async () => {
  if (deferredPrompt) {
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') setDeferredPrompt(null);
  }
  };
  
  const handleLogout = async () => {
  if (!window.confirm("Apakah Anda yakin ingin keluar dari aplikasi?")) return;
  setLoading(true);
  await supabase.auth.signOut();
  setLoading(false);
  };

  // ==========================
  // CRUD MURID / SANTRI
  // ==========================
  const handleSimpanMurid = async (e) => {
    e.preventDefault();
    if (!formMurid.nama || !formMurid.kelas) return alert("Nama dan Kelas wajib diisi!");
    
    if (formMurid.id) {
      // UPDATE
      const updatedList = muridList.map(m => m.id === formMurid.id ? formMurid : m);
      setMuridList(updatedList);
      alert("Data murid diperbarui!");
      if (checkConnection()) {
        await supabase.from('murid').update({ nama: formMurid.nama, kelas: formMurid.kelas, alamat: formMurid.alamat, domisili: formMurid.domisili }).eq('id', formMurid.id);
      }
    } else {
      // INSERT
      const safeLocalId = Math.floor(Math.random() * 10000000);
      const newMurid = { ...formMurid, id: safeLocalId, ustadz_email: user?.email };
      setMuridList([...muridList, newMurid]);
      alert("Murid berhasil ditambahkan!");
      if (checkConnection()) {
        await supabase.from('murid').insert([newMurid]);
      }
    }
    setFormMurid({ id: null, nama: '', kelas: '', alamat: '', domisili: '' });
    setShowTambahMurid(false);
  };

  const handleEditMurid = (murid) => {
    setFormMurid(murid);
    setShowTambahMurid(true);
  };

  const handleHapusMurid = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data santri ini beserta absen & nilainya?")) return;
    setMuridList(muridList.filter(m => m.id !== id));
    if (checkConnection()) {
      await supabase.from('murid').delete().eq('id', id);
    }
  };

  // ==========================
  // CRUD JADWAL
  // ==========================
  const handleSimpanJadwal = async (e) => {
    e.preventDefault();
    if(!formJadwal.jam_mulai || !formJadwal.kelas || !formJadwal.pelajaran) return alert("Lengkapi form jadwal!");
    
    if (formJadwal.id) {
       // UPDATE
       const updatedList = listJadwal.map(j => j.id === formJadwal.id ? formJadwal : j);
       setListJadwal(updatedList);
       alert("Jadwal diperbarui!");
       if(checkConnection()){
          await supabase.from('jadwal_mengajar').update({ hari: formJadwal.hari, jam_mulai: formJadwal.jam_mulai, kelas: formJadwal.kelas, pelajaran: formJadwal.pelajaran }).eq('id', formJadwal.id);
       }
    } else {
       // INSERT
       const safeLocalId = Math.floor(Math.random() * 10000000);
       const newJadwal = { ...formJadwal, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
       setListJadwal([...listJadwal, newJadwal]);
       alert("Jadwal ditambahkan!");
       if (checkConnection()) {
         await supabase.from('jadwal_mengajar').insert([newJadwal]);
       }
    }
    setFormJadwal({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
    setShowTambahJadwal(false);
  };

  const handleEditJadwal = (jadwal) => {
    setFormJadwal(jadwal);
    setShowTambahJadwal(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleHapusJadwal = async (id) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;
    setListJadwal(listJadwal.filter(j => j.id !== id));
    if (checkConnection()) {
      await supabase.from('jadwal_mengajar').delete().eq('id', id);
    }
  };

  // ==========================
  // CRUD BANK SOAL
  // ==========================
  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    if (!formSoal.pelajaran || !formSoal.kelas || !formSoal.isi) return alert("Lengkapi formulir soal!");
    
    if (formSoal.id) {
      // UPDATE
      const updatedList = listBankSoal.map(s => s.id === formSoal.id ? formSoal : s);
      setListBankSoal(updatedList);
      alert("Soal berhasil diperbarui!");
      if(checkConnection()){
         await supabase.from('bank_soal').update({ pelajaran: formSoal.pelajaran, kelas: formSoal.kelas, batasan: formSoal.batasan, isi_soal: formSoal.isi }).eq('id', formSoal.id);
      }
    } else {
      // INSERT
      const safeLocalId = Math.floor(Math.random() * 10000000);
      const newSoal = { id: safeLocalId, pelajaran: formSoal.pelajaran, kelas: formSoal.kelas, batasan: formSoal.batasan, isi_soal: formSoal.isi };
      setListBankSoal([newSoal, ...listBankSoal]);
      alert("Soal berhasil disimpan!");
      if (checkConnection()) {
        await supabase.from('bank_soal').insert([{ pelajaran: newSoal.pelajaran, kelas: newSoal.kelas, batasan: newSoal.batasan, isi_soal: newSoal.isi_soal, ustadz_email: user?.email }]);
      }
    }
    setFormSoal({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' });
    setSoalTab('arsip');
  };

  const handleEditSoal = (soal) => {
    setFormSoal(soal);
    setSoalTab('buat');
  };

  const handleHapusSoal = async (id) => {
    if (!window.confirm("Hapus soal ini dari arsip?")) return;
    setListBankSoal(listBankSoal.filter(s => s.id !== id));
    if(checkConnection()){
       await supabase.from('bank_soal').delete().eq('id', id);
    }
  };

  // === FUNGSI SIMPAN LAINNYA ===
  const handleSimpanAbsen = async (muridId, status) => {
    const tanggalHariIni = new Date().toISOString().split('T')[0];
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const absenBaru = { id: safeLocalId, murid_id: muridId, status, tanggal: tanggalHariIni, ustadz_email: user?.email };
    setListAbsensi(prev => [absenBaru, ...prev.filter(a => !(a.murid_id === muridId && a.tanggal === tanggalHariIni))]);
    if (checkConnection()) {
      await supabase.from('absensi').insert([{ murid_id: muridId, status, tanggal: tanggalHariIni, ustadz_email: user?.email }]);
    }
  };

  const handleSimpanPerilaku = async (e) => {
    e.preventDefault();
    if (!selectedMuridPerilaku?.id || !formPerilaku.catatan) return alert("Tulis catatan perilaku terlebih dahulu!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newPrilaku = { id: safeLocalId, murid_id: selectedMuridPerilaku.id, catatan: formPerilaku.catatan, created_at: new Date().toISOString() };
    setListPerilaku([newPrilaku, ...listPerilaku]);
    setFormPerilaku({ catatan: '' });
    alert("Catatan perilaku berhasil ditambahkan!");
    if (checkConnection()) {
      await supabase.from('catatan_perilaku').insert([{ murid_id: newPrilaku.murid_id, catatan: newPrilaku.catatan, ustadz_email: user?.email }]);
    }
  };

  const handleSimpanNilaiIndividu = async (e) => {
    e.preventDefault();
    if (!formNilai.pelajaran || !formNilai.skor) return alert("Lengkapi Pelajaran dan Skor!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newNilai = { id: safeLocalId, murid_id: selectedMuridNilai.id, jenis_ujian: formNilai.jenis, pelajaran: formNilai.pelajaran, skor: parseInt(formNilai.skor), created_at: new Date().toISOString() };
    setListNilai([newNilai, ...listNilai]);
    setFormNilai({ ...formNilai, skor: '' });
    alert("Nilai berhasil disimpan!");
    if (checkConnection()) {
      await supabase.from('nilai').insert([{ murid_id: newNilai.murid_id, jenis_ujian: newNilai.jenis_ujian, pelajaran: newNilai.pelajaran, skor: newNilai.skor, ustadz_email: user?.email }]);
    }
  };

  const handleSimpanSakuBatas = async (e) => {
    e.preventDefault();
    if(!formSakuBatas.kelas || !formSakuBatas.fan) return alert("Kelas dan Fan wajib diisi!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newSaku = { ...formSakuBatas, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
    setListSakuBatas([newSaku, ...listSakuBatas]);
    setFormSakuBatas({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
    if (checkConnection()) {
      await supabase.from('buku_saku_batas').insert([newSaku]);
    }
  };

  const handleSimpanSakuTagihan = async (e) => {
    e.preventDefault();
    if(!formSakuTagihan.tanggal || !formSakuTagihan.kelas || !formSakuTagihan.kitab) return alert("Isi form dengan lengkap!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newTagihan = { ...formSakuTagihan, murid_id: formSakuTagihan.murid_id ? parseInt(formSakuTagihan.murid_id) : null, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
    setListSakuTagihan([newTagihan, ...listSakuTagihan]);
    setFormSakuTagihan({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
    if (checkConnection()) {
      await supabase.from('buku_saku_tagihan').insert([newTagihan]);
    }
  };

  const handleSimpanCapaianHafalan = async (e) => {
    e.preventDefault();
    if(!formCapaian.capaian) return alert("Isi Capaian / Batas Hafalan!");
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newCapaian = { id: safeLocalId, murid_id: selectedMuridHafalan.id, capaian: formCapaian.capaian, tanggal: formCapaian.tanggal, ustadz_email: user?.email, created_at: new Date().toISOString() };
    setListCapaian([newCapaian, ...listCapaian]);
    setFormCapaian({ ...formCapaian, capaian: '' });
    alert("Capaian hafalan ditambahkan!");
    if (checkConnection()) {
      await supabase.from('capaian_hafalan').insert([newCapaian]);
    }
  };

  const exportSoalPDF = (soal) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Soal Ujian: ${soal.pelajaran}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Pengajar: ${user?.email || 'Ustaz'}`, 14, 28);
    doc.text(`Kelas: ${soal.kelas}`, 14, 34);
    doc.text(`Batasan: ${soal.batasan || '-'}`, 14, 40);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 46);
    doc.line(14, 50, 196, 50);
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(soal.isi_soal, 180);
    doc.text(splitText, 14, 60);
    doc.save(`Soal_${soal.pelajaran}_Kelas_${soal.kelas}.pdf`);
  };

  const shareSoalWA = (soal) => {
    const text = `*SOAL UJIAN*\n📚 Pelajaran: ${soal.pelajaran}\n👨‍🏫 Pengajar: ${user?.email || 'Ustaz'}\n🏫 Kelas: ${soal.kelas}\n📑 Batasan: ${soal.batasan || '-'}\n\n*Pertanyaan:*\n${soal.isi_soal}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };

  const exportNilaiKelasPDF = (kelas) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Rekap Nilai Kelas ${kelas}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Nama Pengajar: ${user?.email || 'Ustaz'}`, 14, 28);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 34);

    const muridDiKelas = muridList.filter(m => m.kelas === kelas);
    const tableData = [];

    muridDiKelas.forEach(m => {
      const nilaiMurid = listNilai.filter(n => n.murid_id === m.id);
      if (nilaiMurid.length === 0) {
        tableData.push([m.nama, '-', '-', '-']);
      } else {
        nilaiMurid.forEach(n => {
          tableData.push([m.nama, n.pelajaran, n.jenis_ujian, n.skor]);
        });
      }
    });

    doc.autoTable({
      startY: 40,
      head: [['Nama Santri', 'Pelajaran', 'Jenis Ujian', 'Skor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] } // Warna Emerald
    });
    doc.save(`Rekap_Nilai_Kelas_${kelas}.pdf`);
  };

  const shareNilaiKelasWA = (kelas) => {
    let text = `*REKAP NILAI KELAS ${kelas}*\n👨‍🏫 Pengajar: ${user?.email || 'Ustaz'}\n📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    const muridDiKelas = muridList.filter(m => m.kelas === kelas);
    muridDiKelas.forEach(m => {
      const nilaiMurid = listNilai.filter(n => n.murid_id === m.id);
      if(nilaiMurid.length > 0) {
        text += `👤 *${m.nama}*\n`;
        nilaiMurid.forEach(n => { text += `- ${n.pelajaran} (${n.jenis_ujian}): ${n.skor}\n`; });
        text += `\n`;
      }
    });
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };

  const exportRaporPDF = (murid) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Rapor Akademik Santri`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Nama Santri: ${murid.nama}`, 14, 28);
    doc.text(`Kelas: ${murid.kelas}`, 14, 34);
    doc.text(`Pengajar: ${user?.email || 'Ustaz'}`, 14, 40);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 46);

    const absens = listAbsensi.filter(a => a.murid_id === murid.id);
    const hadir = absens.filter(a => a.status === 'Hadir').length;
    doc.text(`Total Kehadiran: ${hadir} Hari (dari ${absens.length} tercatat)`, 14, 52);

    const nilais = listNilai.filter(n => n.murid_id === murid.id);
    const tableData = nilais.map(n => [n.pelajaran, n.jenis_ujian, n.skor]);

    doc.autoTable({
      startY: 60,
      head: [['Mata Pelajaran', 'Jenis Ujian', 'Skor Nilai']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
      emptyRowContent: 'Belum ada nilai tercatat'
    });
    doc.save(`Rapor_${murid.nama}.pdf`);
  };

  const shareRaporWA = (murid) => {
    const absens = listAbsensi.filter(a => a.murid_id === murid.id);
    const hadir = absens.filter(a => a.status === 'Hadir').length;
    const nilais = listNilai.filter(n => n.murid_id === murid.id);

    let text = `*RAPOR AKADEMIK SANTRI*\n👤 Nama: ${murid.nama}\n🏫 Kelas: ${murid.kelas}\n👨‍🏫 Pengajar: ${user?.email || 'Ustaz'}\n📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n*📊 Kehadiran:*\n${hadir} Hari Hadir (dari ${absens.length} tercatat)\n\n*📝 Nilai Ujian:*\n`;
    if (nilais.length === 0) text += `- Belum ada nilai\n`;
    nilais.forEach(n => { text += `- ${n.pelajaran} (${n.jenis_ujian}): *${n.skor}*\n`; });
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };
 
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) alert("Gagal Login: " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) alert("Gagal Daftar: " + error.message);
      else alert("Akun berhasil dibuat! Silakan masuk.");
    }
    setLoading(false);
  };

  // === RENDER WIDGETS & UI ===
  if (!user) {
  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4 font-sans">
  <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white">
  <div className="bg-emerald-600 p-8 text-center text-white">
  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
  </div>
  <h1 className="text-3xl font-bold mb-2">Aplikasi Ustaz</h1>
  <p className="text-emerald-100 text-sm">Manajemen Kelas & Santri Modern</p>
  </div>
  
  <div className="p-8">
  <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
  {authMode === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
  </h2>
  
  <form onSubmit={async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
  if (authMode === 'login') {
  const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
  if (error) throw error;
  } else {
  const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
  if (error) throw error;
  alert("Registrasi berhasil! Silakan cek email Anda atau langsung login.");
  setAuthMode('login');
  }
  } catch (error) {
  alert(error.message);
  } finally {
  setLoading(false);
  }
  }} className="space-y-5">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
  <input 
  type="email" 
  value={authEmail} 
  onChange={e => setAuthEmail(e.target.value)} 
  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-gray-50 focus:bg-white"
  placeholder="ustaz@madrasah.com"
  required 
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi</label>
  <input 
  type="password" 
  value={authPassword} 
  onChange={e => setAuthPassword(e.target.value)} 
  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-gray-50 focus:bg-white"
  placeholder="••••••••"
  required 
  />
  </div>
  
  <button 
  type="submit" 
  disabled={loading}
  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
  >
  {loading ? 'Memproses...' : (authMode === 'login' ? 'Masuk' : 'Daftar')}
  </button>
  </form>
  
  <div className="mt-6 text-center">
  <button 
  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
  className="text-emerald-600 hover:text-emerald-800 text-sm font-medium transition-colors"
  >
  {authMode === 'login' ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk'}
  </button>
  </div>
  </div>
  </div>
  </div>
  );
  }
  
  // === MAIN DASHBOARD RENDER ===
  return (
  <div className="min-h-screen bg-slate-50 font-sans pb-20 md:pb-0 md:pl-64 flex flex-col">
  
  {/* HEADER TOP BAR */}
  <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
  <div className="px-4 py-3 flex items-center justify-between">
  <div className="flex items-center space-x-3">
  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center md:hidden">
  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
  </div>
  <div>
  <h1 className="text-xl font-bold text-gray-800 leading-tight">Aplikasi Ustaz</h1>
  <p className="text-xs text-gray-500 font-medium">{now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  </div>
  
  <div className="flex items-center space-x-2">
  {isOffline && (
  <span className="flex items-center px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
  <span className="w-2 h-2 bg-amber-500 rounded-full mr-1 animate-pulse"></span> Offline
  </span>
  )}
  <button 
  onClick={syncSemuaDataKeCloud} 
  disabled={loading || isOffline}
  className={`p-2 rounded-xl transition-all ${isOffline ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} ${loading ? 'animate-spin' : ''}`}
  title="Sinkronisasi Data"
  >
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
  </button>
  <div className="hidden md:flex items-center bg-gray-100 rounded-full px-3 py-1">
  <div className="w-6 h-6 bg-emerald-500 rounded-full text-white flex items-center justify-center text-xs font-bold mr-2">U</div>
  <span className="text-sm font-medium text-gray-600 truncate max-w-[120px]">{user?.email?.split('@')[0]}</span>
  </div>
  </div>
  </div>
  </header>
  
  {/* SIDEBAR NAVIGATION (DESKTOP) */}
  <nav className="hidden md:flex flex-col w-64 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-gray-100 fixed top-0 bottom-0 left-0 z-40">
  <div className="p-6 bg-emerald-600 text-white flex items-center space-x-3">
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
  <span className="text-xl font-bold tracking-wide">Portal Ustaz</span>
  </div>
  
  <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
  {[
  { id: 'jadwal', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Jadwal' },
  { id: 'absensi', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', label: 'Absensi' },
  { id: 'bukusaku', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Saku' },
  { id: 'hafalan', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', label: 'Hafalan' },
  { id: 'perilaku', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Perilaku' },
  { id: 'nilai', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Nilai' },
  { id: 'soal', icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z', label: 'Soal' },
  { id: 'murid', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Santri' }
  ].map(tab => (
  <button
  key={tab.id}
  onClick={() => setActiveTab(tab.id)}
  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-600 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
  >
  <svg className={`w-5 h-5 ${activeTab === tab.id ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path>
  </svg>
  <span>{tab.label}</span>
  </button>
  ))}
  </div>
  
  <div className="p-4 border-t border-gray-100">
  {deferredPrompt && (
  <button onClick={handleInstallPWA} className="w-full mb-3 flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2.5 rounded-xl font-semibold transition-colors text-sm">
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
  <span>Install App</span>
  </button>
  )}
  <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 text-rose-500 hover:bg-rose-50 px-4 py-2.5 rounded-xl font-bold transition-colors">
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
  <span>Keluar</span>
  </button>
  </div>
  </nav>
  
  {/* BOTTOM NAVIGATION (MOBILE) */}
  <nav className="md:hidden fixed bottom-0 w-full bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.04)] border-t border-gray-100 z-40 flex justify-around p-2 pb-safe-area">
  {[
  { id: 'jadwal', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Jadwal' },
  { id: 'absensi', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', label: 'Absen' },
  { id: 'bukusaku', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Saku' },
  { id: 'nilai', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Nilai' },
  { id: 'murid', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Santri' }
  ].map(tab => (
  <button 
  key={tab.id}
  onClick={() => setActiveTab(tab.id)} 
  className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-all ${activeTab === tab.id ? 'text-emerald-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
  >
  <div className={`p-1.5 rounded-lg mb-1 ${activeTab === tab.id ? 'bg-emerald-50' : ''}`}>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
  </div>
  <span className={`text-[10px] ${activeTab === tab.id ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
  </button>
  ))}
  </nav>
  
  {/* KONTEN UTAMA */}
  <main className="flex-1 p-4 md:p-6 overflow-x-hidden">

        {/* === TAB JADWAL === */}
        {activeTab === 'jadwal' && (
        <div className="max-w-4xl mx-auto animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
        <h2 className="text-2xl font-bold text-gray-800">Jadwal Mengajar</h2>
        <p className="text-gray-500 mt-1">Kelola jadwal pelajaran Anda</p>
        </div>
        <button onClick={() => { setFormJadwal({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' }); setShowTambahJadwal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
        <span>Tambah Jadwal</span>
        </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(hari => {
        const jadwalHariIni = listJadwal.filter(j => j.hari === hari).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
        if (jadwalHariIni.length === 0) return null;
        return (
        <div key={hari} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex items-center space-x-3">
        <div className="w-8 h-8 bg-emerald-200 rounded-lg flex items-center justify-center text-emerald-700 font-bold">
        {hari.substring(0,1)}
        </div>
        <h3 className="font-bold text-emerald-800">{hari}</h3>
        </div>
        <div className="p-2">
        {jadwalHariIni.map((j) => (
        <div key={j.id} className="p-3 hover:bg-gray-50 rounded-xl transition-colors group relative border-b border-gray-50 last:border-0">
        <div className="flex justify-between items-start">
        <div>
        <div className="text-xs font-semibold text-emerald-600 mb-1">{j.jam_mulai}</div>
        <div className="font-bold text-gray-800">{j.pelajaran}</div>
        <div className="text-sm text-gray-500 mt-0.5">Kelas {j.kelas}</div>
        </div>
        <button onClick={() => hapusJadwal(j.id)} className="text-rose-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
        </div>
        </div>
        ))}
        </div>
        </div>
        );
        })}
        </div>
        
        {listJadwal.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 border-dashed">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        </div>
        <h3 className="text-lg font-bold text-gray-700">Belum ada jadwal</h3>
        <p className="text-gray-500 mt-2">Mulai tambahkan jadwal mengajar Anda</p>
        </div>
        )}
        </div>
        )}
        
        {/* === TAB ABSENSI (MODERN) === */}
        {activeTab === 'absensi' && (
        <div className="max-w-5xl mx-auto animate-fadeIn">
        <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Absensi Santri</h2>
        <p className="text-gray-500 mt-1">Pencatatan dan rekapitulasi kehadiran</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="flex border-b border-gray-100">
        <button onClick={() => setAbsenTab('harian')} className={`flex-1 py-4 text-sm font-bold transition-colors ${absenTab === 'harian' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>Absen Harian</button>
        <button onClick={() => setAbsenTab('rekap')} className={`flex-1 py-4 text-sm font-bold transition-colors ${absenTab === 'rekap' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>Rekapitulasi</button>
        </div>
        
        <div className="p-5 md:p-6">
        {absenTab === 'harian' ? (
        <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pilih Kelas</label>
        <select className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 bg-white" value={filterKelasAbsen} onChange={e => setFilterKelasAbsen(e.target.value)}>
        <option value="">-- Pilih Kelas --</option>
        {[...new Set(muridList.map(m => m.kelas))].map(k => <option key={k} value={k}>Kelas {k}</option>)}
        </select>
        </div>
        </div>
        
        {filterKelasAbsen && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        {muridList.filter(m => m.kelas === filterKelasAbsen).length === 0 ? (
        <div className="p-8 text-center text-gray-500">Tidak ada santri di kelas ini.</div>
        ) : (
        <>
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
        <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
        <th className="p-4 font-bold text-gray-700 w-1/3">Nama Santri</th>
        <th className="p-4 font-bold text-gray-700 text-center">Kehadiran Hari Ini</th>
        </tr>
        </thead>
        <tbody>
        {muridList.filter(m => m.kelas === filterKelasAbsen).map(murid => (
        <tr key={murid.id} className="border-b border-gray-50 hover:bg-gray-50/50">
        <td className="p-4 font-medium text-gray-800">{murid.nama}</td>
        <td className="p-4">
        <div className="flex justify-center gap-2">
        {['Hadir', 'Sakit', 'Izin', 'Alpa'].map(status => {
        const isSelected = draftAbsen[murid.id] === status;
        const colors = {
        'Hadir': 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
        'Sakit': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
        'Izin': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
        'Alpa': 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200'
        };
        const defaultColor = 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50';
        return (
        <button key={status} onClick={() => setDraftAbsen({ ...draftAbsen, [murid.id]: status })} className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${isSelected ? colors[status] : defaultColor}`}>
        {status}
        </button>
        );
        })}
        </div>
        </td>
        </tr>
        ))}
        </tbody>
        </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
        <button onClick={() => {
        const today = new Date().toISOString().split('T')[0];
        const entries = Object.keys(draftAbsen).map(muridId => ({
        murid_id: muridId,
        tanggal: today,
        status: draftAbsen[muridId]
        }));
        simpanAbsen(entries); 
        }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-200 transition-all">
        Simpan Absensi
        </button>
        </div>
        </>
        )}
        </div>
        )}
        </div>
        ) : (
        <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bulan</label>
        <input type="month" className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-200" value={absenBulan} onChange={e => setAbsenBulan(e.target.value)} />
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kelas</label>
        <select className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-200" value={absenKelasBulanan} onChange={e => setAbsenKelasBulanan(e.target.value)}>
        <option value="">Pilih Kelas</option>
        {[...new Set(muridList.map(m => m.kelas))].map(k => <option key={k} value={k}>Kelas {k}</option>)}
        </select>
        </div>
        <div className="flex items-end gap-2">
        <button onClick={() => {
        if (!absenKelasBulanan || !absenBulan) return alert("Pilih kelas dan bulan terlebih dahulu!");
        const [thn, bln] = absenBulan.split('-');
        const headers = ['Nama Santri', 'Hadir', 'Sakit', 'Izin', 'Alpa'];
        const body = muridList.filter(m => m.kelas === absenKelasBulanan).map(m => {
        const abs = listAbsensi.filter(a => a.murid_id === m.id && a.tanggal.startsWith(absenBulan));
        return [
        m.nama,
        abs.filter(a => a.status === 'Hadir').length.toString(),
        abs.filter(a => a.status === 'Sakit').length.toString(),
        abs.filter(a => a.status === 'Izin').length.toString(),
        abs.filter(a => a.status === 'Alpa').length.toString(),
        ];
        });
        generatePDF(`Rekap Absensi Kelas ${absenKelasBulanan}`, headers, body, [`Bulan: ${bln}-${thn}`, `Pengajar: ${user?.email}`]);
        }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg font-bold flex justify-center items-center gap-2 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> PDF
        </button>
        <button onClick={() => {
        if (!absenKelasBulanan || !absenBulan) return alert("Pilih kelas dan bulan terlebih dahulu!");
        const [thn, bln] = absenBulan.split('-');
        let txt = `*REKAP ABSENSI KELAS ${absenKelasBulanan}*\nBulan: ${bln}-${thn}\n\n`;
        muridList.filter(m => m.kelas === absenKelasBulanan).forEach(m => {
        const abs = listAbsensi.filter(a => a.murid_id === m.id && a.tanggal.startsWith(absenBulan));
        const h = abs.filter(a => a.status === 'Hadir').length;
        const s = abs.filter(a => a.status === 'Sakit').length;
        const i = abs.filter(a => a.status === 'Izin').length;
        const al = abs.filter(a => a.status === 'Alpa').length;
        if(abs.length > 0) txt += `👤 *${m.nama}*: H:${h} S:${s} I:${i} A:${al}\n`;
        });
        shareWA(txt);
        }} className="flex-1 bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-lg font-bold flex justify-center items-center gap-2 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> WA
        </button>
        </div>
        </div>
        
        {absenKelasBulanan && absenBulan && (
        <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">
        <thead>
        <tr className="bg-emerald-50 text-emerald-800 border-b border-emerald-100">
        <th className="p-3 font-bold">Nama Santri</th>
        <th className="p-3 font-bold text-center">Hadir</th>
        <th className="p-3 font-bold text-center">Sakit</th>
        <th className="p-3 font-bold text-center">Izin</th>
        <th className="p-3 font-bold text-center">Alpa</th>
        </tr>
        </thead>
        <tbody>
        {muridList.filter(m => m.kelas === absenKelasBulanan).map(m => {
        const abs = listAbsensi.filter(a => a.murid_id === m.id && a.tanggal.startsWith(absenBulan));
        return (
        <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
        <td className="p-3 font-medium">{m.nama}</td>
        <td className="p-3 text-center text-emerald-600 font-bold">{abs.filter(a => a.status === 'Hadir').length}</td>
        <td className="p-3 text-center text-blue-600 font-bold">{abs.filter(a => a.status === 'Sakit').length}</td>
        <td className="p-3 text-center text-amber-600 font-bold">{abs.filter(a => a.status === 'Izin').length}</td>
        <td className="p-3 text-center text-rose-600 font-bold">{abs.filter(a => a.status === 'Alpa').length}</td>
        </tr>
        )
        })}
        </tbody>
        </table>
        </div>
        )}
        </div>
        )}
        </div>
        </div>
        </div>
        )}

        {/* === TAB BUKU SAKU === */}
        {activeTab === 'bukusaku' && (
        <div className="max-w-5xl mx-auto animate-fadeIn">
        <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Buku Saku Pengajar</h2>
        <p className="text-gray-500 mt-1">Pantau batasan mengajar kitab dan target tagihan santri</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Sub-Tab Navigation */}
        <div className="flex border-b border-gray-100">
        <button onClick={() => setBukuSakuTab('batas')} className={`flex-1 py-4 text-sm font-bold transition-colors ${bukuSakuTab === 'batas' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
        📊 Batas Mengajar Kitab
        </button>
        <button onClick={() => setBukuSakuTab('tagihan')} className={`flex-1 py-4 text-sm font-bold transition-colors ${bukuSakuTab === 'tagihan' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
        🎯 Target Tagihan Santri
        </button>
        </div>
        
        <div className="p-5 md:p-6">
        {/* SUB TAB: BATAS MENGAJAR */}
        {bukuSakuTab === 'batas' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Input */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100 h-fit">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        Catat Batas Baru
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); tambahSakuBatas(); }} className="space-y-4">
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
        <input type="text" placeholder="Contoh: 3A, 1B" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.kelas} onChange={e => setFormSakuBatas({...formSakuBatas, kelas: e.target.value})} required />
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fan / Kelompok Ilmu</label>
        <input type="text" placeholder="Contoh: Fiqih, Nahwu" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.fan} onChange={e => setFormSakuBatas({...formSakuBatas, fan: e.target.value})} required />
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Kitab & Materi</label>
        <input type="text" placeholder="Contoh: Safinatun Najah" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.materi} onChange={e => setFormSakuBatas({...formSakuBatas, materi: e.target.value})} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Halaman</label>
        <input type="text" placeholder="Hal. 12" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.halaman} onChange={e => setFormSakuBatas({...formSakuBatas, halaman: e.target.value})} required />
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target</label>
        <input type="text" placeholder="Khatam/Bab 2" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.target} onChange={e => setFormSakuBatas({...formSakuBatas, target: e.target.value})} />
        </div>
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan Tambahan</label>
        <textarea rows="2" placeholder="Keterangan alur sabaq..." className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm" value={formSakuBatas.catatan} onChange={e => setFormSakuBatas({...formSakuBatas, catatan: e.target.value})}></textarea>
        </div>
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm">
        Simpan Batasan Kitab
        </button>
        </form>
        </div>
        
        {/* Riwayat/Daftar Batas */}
        <div className="lg:col-span-2 space-y-4">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Riwayat Batasan Mengajar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listSakuBatas.map((b) => (
        <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative group hover:shadow-md transition-all">
        <button onClick={() => hapusSakuBatas(b.id)} className="absolute top-3 right-3 text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
        <div className="text-xs font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded w-fit mb-2">Kelas {b.kelas}</div>
        <h4 className="font-bold text-gray-800 text-base">{b.materi}</h4>
        <p className="text-xs text-gray-400 mt-0.5">Bidang Ilmu: {b.fan}</p>
        <div className="grid grid-cols-2 gap-2 mt-3 bg-gray-50 p-2 rounded-lg text-xs">
        <div><span className="text-gray-400">Posisi:</span> <span className="font-bold text-gray-700 block">{b.halaman}</span></div>
        <div><span className="text-gray-400">Target:</span> <span className="font-bold text-gray-700 block">{b.target || '-'}</span></div>
        </div>
        {b.catatan && <p className="text-xs text-gray-500 mt-2 bg-slate-50 p-2 rounded border border-dashed border-gray-100">📝 {b.catatan}</p>}
        </div>
        ))}
        </div>
        {listSakuBatas.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">Belum ada batasan kitab terdaftar.</div>}
        </div>
        </div>
        ) : (
        /* SUB TAB: TARGET TAGIHAN SANTRI */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Input Tagihan */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100 h-fit">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Buat Tagihan Hafalan
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); tambahSakuTagihan(); }} className="space-y-4">
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Batas Waktu</label>
        <input type="date" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formSakuTagihan.tanggal} onChange={e => setFormSakuTagihan({...formSakuTagihan, tanggal: e.target.value})} required />
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Santri / Murid</label>
        <select className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formSakuTagihan.murid_id} onChange={e => setFormSakuTagihan({...formSakuTagihan, murid_id: e.target.value})} required>
        <option value="">-- Pilih Santri --</option>
        {muridList.map(m => <option key={m.id} value={m.id}>{m.nama} (Kelas {m.kelas})</option>)}
        </select>
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kitab / Juz / Surah</label>
        <input type="text" placeholder="Contoh: Aqidatul Awam / Juz 30" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formSakuTagihan.kitab} onChange={e => setFormSakuTagihan({...formSakuTagihan, kitab: e.target.value})} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mulai Dari</label>
        <input type="text" placeholder="Bait 1 / Hal 1" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formSakuTagihan.target_dari} onChange={e => setFormSakuTagihan({...formSakuTagihan, target_dari: e.target.value})} required />
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sampai Dengan</label>
        <input type="text" placeholder="Bait 10 / Hal 5" className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formSakuTagihan.target_sampai} onChange={e => setFormSakuTagihan({...formSakuTagihan, target_sampai: e.target.value})} required />
        </div>
        </div>
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm">
        Terbitkan Tagihan
        </button>
        </form>
        </div>
        
        {/* Tabel/List Daftar Tagihan */}
        <div className="lg:col-span-2 overflow-x-auto border border-gray-100 rounded-xl shadow-sm h-fit bg-white">
        <table className="w-full text-left border-collapse">
        <thead>
        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
        <th className="p-3">Santri</th>
        <th className="p-3">Materi Tagihan</th>
        <th className="p-3 text-center">Deadline</th>
        <th className="p-3 text-center">Aksi</th>
        </tr>
        </thead>
        <tbody className="text-sm">
        {listSakuTagihan.map((t) => {
        const murid = muridList.find(m => m.id === t.murid_id);
        return (
        <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
        <td className="p-3">
        <div className="font-bold text-gray-800">{murid ? murid.nama : 'Memuat...'}</div>
        <div className="text-xs text-gray-400">Kelas {murid ? murid.kelas : '-'}</div>
        </td>
        <td className="p-3">
        <div className="font-medium text-gray-700">{t.kitab}</div>
        <div className="text-xs text-emerald-600 font-semibold">{t.target_dari} s/d {t.target_sampai}</div>
        </td>
        <td className="p-3 text-center">
        <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded border border-amber-100">
        {new Date(t.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}
        </span>
        </td>
        <td className="p-3 text-center">
        <button onClick={() => hapusSakuTagihan(t.id)} className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
        </td>
        </tr>
        );
        })}
        </tbody>
        </table>
        {listSakuTagihan.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">Belum ada tagihan berjalan.</div>}
        </div>
        </div>
        )}
        </div>
        </div>
        </div>
        )}
        
       
        {/* ==================== TAB SIKAP / PERILAKU (Tetap) ==================== */}
        {activeTab === 'perilaku' && (
          <div className="space-y-4">
            {!perilakuKelas && (
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs border-b pb-2 text-emerald-600 uppercase tracking-wider">Pilih Kelas (Sikap)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {listKelasUnik.map(k => (
                    <button key={k} onClick={() => setPerilakuKelas(k)} className="bg-slate-50 border p-3 rounded-xl font-bold text-slate-700 hover:border-emerald-500">Kelas {k}</button>
                  ))}
                </div>
              </div>
            )}
            {/* Lanjutan sub-tab perilaku sama persis dengan sebelumnya */}
            {perilakuKelas && !selectedMuridPerilaku && (
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Pilih Santri Kelas {perilakuKelas}</h3>
                  <button onClick={() => setPerilakuKelas('')} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded font-bold">Kembali</button>
                </div>
                <div className="space-y-1.5">
                  {muridList.filter(m => m.kelas === perilakuKelas).map(m => (
                    <button key={m.id} onClick={() => setSelectedMuridPerilaku(m)} className="w-full bg-slate-50 p-2.5 rounded-xl border text-left font-semibold text-sm text-slate-700 hover:bg-emerald-50">{m.nama}</button>
                  ))}
                </div>
              </div>
            )}

            {perilakuKelas && selectedMuridPerilaku && (
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Catatan: <span className="text-emerald-600">{selectedMuridPerilaku.nama}</span></h3>
                  <button onClick={() => setSelectedMuridPerilaku(null)} className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">Kembali</button>
                </div>
                <textarea placeholder="Tulis catatan perkembangan akhlak/pelanggaran di sini..." className="w-full border rounded-xl p-3 text-sm h-28 outline-none focus:ring-2 ring-emerald-500 resize-none" value={formPerilaku.catatan} onChange={e => setFormPerilaku({ catatan: e.target.value })}></textarea>
                <button onClick={handleSimpanPerilaku} className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow hover:bg-emerald-700">Simpan Catatan</button>
              </div>
            )}
          </div>
        )}


{/* === TAB HAFALAN / CAPAIAN (Kombinasi UI Modern) === */}
        {activeTab === 'hafalan' || activeTab === 'capaian' ? (
          <div className="max-w-5xl mx-auto animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Setoran Hafalan Santri</h2>
              <p className="text-gray-500 mt-1">Kelola capaian sabaq, tasyrih, dan hafalan harian santri</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sisi Kiri: Filter Kelas & Pilih Santri */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Filter Kelas</label>
                  <select className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 bg-slate-50 font-medium" value={hafalanKelas} onChange={e => { setHafalanKelas(e.target.value); setSelectedMuridHafalan(null); }}>
                    <option value="">-- Pilih Kelas --</option>
                    {[...new Set(muridList.map(m => m.kelas))].map(k => <option key={k} value={k}>Kelas {k}</option>)}
                  </select>
                </div>

                {hafalanKelas && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Santri</label>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {muridList.filter(m => m.kelas === hafalanKelas).map(m => (
                        <button key={m.id} onClick={() => setSelectedMuridHafalan(m)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${selectedMuridHafalan?.id === m.id ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-md shadow-emerald-100' : 'bg-white text-gray-700 hover:bg-slate-50 border-gray-100'}`}>
                          {m.nama}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sisi Kanan: Form Input & Riwayat */}
              <div className="lg:col-span-2 space-y-6">
                {selectedMuridHafalan ? (
                  <>
                    {/* Form Setor */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4 text-base">Form Setoran: <span className="text-emerald-600">{selectedMuridHafalan.nama}</span></h3>
                      <form onSubmit={(e) => { e.preventDefault(); tambahCapaian(selectedMuridHafalan.id); }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal</label>
                            <input type="date" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm font-medium" value={formCapaian.tanggal} onChange={e => setFormCapaian({...formCapaian, tanggal: e.target.value})} required />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Materi / Progres Hafalan</label>
                            <input type="text" placeholder="Contoh: Juz 30 Surah An-Naba' 1-10" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formCapaian.capaian} onChange={e => setFormCapaian({...formCapaian, capaian: e.target.value})} required />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold shadow-md shadow-emerald-100 transition-all text-sm">
                            Simpan Setoran
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Riwayat Setoran */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Riwayat Progres Hafalan
                      </h3>
                      <div className="space-y-3">
                        {listCapaian.filter(c => c.murid_id === selectedMuridHafalan.id).map(c => (
                          <div key={c.id} className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors group">
                            <div>
                              <div className="text-xs font-bold text-emerald-600">{new Date(c.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</div>
                              <div className="text-gray-800 font-semibold mt-1 text-sm">{c.capaian_hafalan || c.capaian}</div>
                            </div>
                            <button onClick={() => hapusCapaian(c.id)} className="text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        ))}
                        {listCapaian.filter(c => c.murid_id === selectedMuridHafalan.id).length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">Belum ada catatan setoran untuk santri ini.</div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400 text-sm">
                     Silakan pilih kelas dan nama santri di sebelah kiri untuk mengelola hafalan.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* === TAB PERILAKU === */}
        {activeTab === 'perilaku' && (
          <div className="max-w-5xl mx-auto animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Catatan Perilaku & Akhlak</h2>
              <p className="text-gray-500 mt-1">Pantau perkembangan karakter, kedisiplinan, dan takzir santri</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kiri: Navigasi Kelas */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Filter Kelas</label>
                  <select className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 bg-slate-50 font-medium" value={perilakuKelas} onChange={e => { setPerilakuKelas(e.target.value); setSelectedMuridPerilaku(null); }}>
                    <option value="">-- Pilih Kelas --</option>
                    {[...new Set(muridList.map(m => m.kelas))].map(k => <option key={k} value={k}>Kelas {k}</option>)}
                  </select>
                </div>

                {perilakuKelas && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Daftar Santri</label>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {muridList.filter(m => m.kelas === perilakuKelas).map(m => (
                        <button key={m.id} onClick={() => setSelectedMuridPerilaku(m)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${selectedMuridPerilaku?.id === m.id ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-gray-700 hover:bg-slate-50 border-gray-100'}`}>
                          {m.nama}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Kanan: Form input catatan perilaku */}
              <div className="lg:col-span-2 space-y-6">
                {selectedMuridPerilaku ? (
                  <>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4 text-sm">Tambah Catatan untuk: <span className="text-emerald-600">{selectedMuridPerilaku.nama}</span></h3>
                      <form onSubmit={(e) => { e.preventDefault(); tambahPerilaku(selectedMuridPerilaku.id); }} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan Akhlak / Pelanggaran / Prestasi</label>
                          <textarea rows="3" placeholder="Contoh: Membantu membersihkan musholla setelah jamaah / Terlambat masuk kelas sabaq..." className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={formPerilaku.catatan} onChange={e => setFormPerilaku({ catatan: e.target.value })} required></textarea>
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold shadow-md transition-all text-sm">
                            Simpan Catatan
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">📑 Histori Perilaku Santri</h3>
                      <div className="space-y-3">
                        {listPerilaku.filter(p => p.murid_id === selectedMuridPerilaku.id).map(p => (
                          <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group hover:shadow-sm transition-all">
                            <button onClick={() => hapusPerilaku(p.id)} className="absolute top-3 right-3 text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                            <div className="text-xs text-gray-400 font-semibold">{new Date(p.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                            <p className="text-gray-700 font-medium mt-2 text-sm leading-relaxed">{p.catatan_perilaku || p.catatan}</p>
                          </div>
                        ))}
                        {listPerilaku.filter(p => p.murid_id === selectedMuridPerilaku.id).length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">Belum ada rekam jejak perilaku tercatat.</div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400 text-sm">
                    Silakan pilih kelas dan nama santri di sebelah kiri untuk melihat rekam perilaku.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === TAB NILAI UJIAN === */}
        {activeTab === 'nilai' && (
        <div className="max-w-5xl mx-auto animate-fadeIn">
        <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Nilai Ujian Santri</h2>
        <p className="text-gray-500 mt-1">Input nilai imtihan, UTS, UAS, dan generate raport PDF/WA</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kelas</label>
        <select className="w-full p-2.5 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-200 font-medium text-sm" value={nilaiKelas} onChange={e => setNilaiKelas(e.target.value)}>
        <option value="">Pilih Kelas</option>
        {[...new Set(muridList.map(m => m.kelas))].map(k => <option key={k} value={k}>Kelas {k}</option>)}
        </select>
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mata Pelajaran</label>
        <input type="text" placeholder="Contoh: Fiqih Wadhah" className="w-full p-2.5 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={nilaiMapel} onChange={e => setNilaiMapel(e.target.value)} />
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Ujian</label>
        <select className="w-full p-2.5 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-200 text-sm" value={nilaiJenis} onChange={e => setNilaiJenis(e.target.value)}>
        <option value="Imtihan Bulanan">Imtihan Bulanan</option>
        <option value="UTS">UTS (Nisfu Sanah)</option>
        <option value="UAS">UAS (Akhir Sanah)</option>
        </select>
        </div>
        <div className="flex items-end gap-2">
        <button onClick={() => {
        if (!nilaiKelas || !nilaiMapel) return alert("Pilih kelas dan isi mata pelajaran terlebih dahulu!");
        const headers = ['Nama Santri', 'Jenis Ujian', 'Nilai'];
        const body = muridList.filter(m => m.kelas === nilaiKelas).map(m => {
        const n = listNilai.find(ni => ni.murid_id === m.id && ni.mapel.toLowerCase() === nilaiMapel.toLowerCase() && ni.jenis === nilaiJenis);
        return [m.nama, nilaiJenis, n ? n.nilai.toString() : '-'];
        });
        generatePDF(`Daftar Nilai Kelas ${nilaiKelas}`, headers, body, [`Mata Pelajaran: ${nilaiMapel}`, `Pengajar: ${user?.email}`]);
        }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg font-bold flex justify-center items-center gap-2 text-sm shadow-sm transition-all">
        PDF
        </button>
        <button onClick={() => {
        if (!nilaiKelas || !nilaiMapel) return alert("Pilih kelas dan isi mata pelajaran!");
        let txt = `*LAPORAN NILAI KELAS ${nilaiKelas}*\nMapel: ${nilaiMapel} (${nilaiJenis})\n\n`;
        muridList.filter(m => m.kelas === nilaiKelas).forEach(m => {
        const n = listNilai.find(ni => ni.murid_id === m.id && ni.mapel.toLowerCase() === nilaiMapel.toLowerCase() && ni.jenis === nilaiJenis);
        txt += `👤 *${m.nama}*: ${n ? n.nilai : '-'}\n`;
        });
        shareWA(txt);
        }} className="flex-1 bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-lg font-bold flex justify-center items-center gap-2 text-sm shadow-sm transition-all">
        WA
        </button>
        </div>
        </div>
        
        {nilaiKelas && nilaiMapel ? (
        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
        <thead>
        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
        <th className="p-4 w-1/2">Nama Santri</th>
        <th className="p-4 text-center">Input Angka Nilai (0-100)</th>
        </tr>
        </thead>
        <tbody>
        {muridList.filter(m => m.kelas === nilaiKelas).map(murid => {
        const currentRecord = listNilai.find(n => n.murid_id === murid.id && n.mapel.toLowerCase() === nilaiMapel.toLowerCase() && n.jenis === nilaiJenis);
        return (
        <tr key={murid.id} className="border-b border-gray-50 hover:bg-gray-50/50">
        <td className="p-4 font-semibold text-gray-800">{murid.nama}</td>
        <td className="p-4 flex justify-center">
        <input type="number" min="0" max="100" placeholder="Belum dinilai" className="w-32 p-2 border border-gray-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-emerald-200" defaultValue={currentRecord ? currentRecord.nilai : ''} onBlur={(e) => {
        if(e.target.value === '') return;
        simpanNilai(murid.id, nilaiMapel, nilaiJenis, parseInt(e.target.value));
        }} />
        </td>
        </tr>
        );
        })}
        </tbody>
        </table>
        </div>
        ) : (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl text-sm">
        Silakan tentukan parameter Kelas dan isi Mata Pelajaran di atas untuk memunculkan lembar penilaian.
        </div>
        )}
        </div>
        </div>
        )}
        
        {/* === TAB BANK SOAL === */}
        {activeTab === 'banksoal' && (
        <div className="max-w-5xl mx-auto animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
        <h2 className="text-2xl font-bold text-gray-800">Arsip & Bank Soal</h2>
        <p className="text-gray-500 mt-1">Simpan draf pertanyaan imtihan madrasah</p>
        </div>
        <button onClick={() => {
        const tanya = prompt("Masukkan pertanyaan soal imtihan baru:");
        if(tanya) tambahSoal(tanya);
        }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-100 text-sm transition-all flex items-center gap-2 w-fit">
        ➕ Tambah Soal
        </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listSoal.map((s, idx) => (
        <div key={s.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm relative group hover:border-emerald-200 transition-all">
        <button onClick={() => hapusSoal(s.id)} className="absolute top-3 right-3 text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
        <div className="flex items-start gap-3">
        <span className="w-6 h-6 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{idx + 1}</span>
        <p className="text-gray-700 font-medium text-sm leading-relaxed pr-6">{s.soal || s.pertanyaan}</p>
        </div>
        </div>
        ))}
        </div>
        {listSoal.length === 0 && <div className="text-center py-16 text-gray-400 text-sm">Belum ada bank soal tersimpan.</div>}
        </div>
        )}
        
        {/* === TAB DATA SANTRI === */}
        {activeTab === 'santri' && (
        <div className="max-w-5xl mx-auto animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Data Santri</h2>
        <p className="text-gray-500 mt-1">Daftar santri aktif di kelas asuhan Anda</p>
        </div>
        <button onClick={() => {
        const nama = prompt("Masukkan nama santri baru:");
        const kelas = prompt("Masukkan kelas (Contoh: 1A, 2B):");
        if(nama && kelas) tambahMurid(nama, kelas);
        }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md text-sm transition-all w-fit">
        ➕ Tambah Santri Baru
        </button>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
        <thead>
        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
        <th className="p-4">Nama Lengkap Santri</th>
        <th className="p-4 text-center">Kelas</th>
        <th className="p-4 text-center">Aksi</th>
        </tr>
        </thead>
        <tbody className="text-sm">
        {muridList.map((m) => (
        <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
        <td className="p-4 font-bold text-gray-800">{m.nama}</td>
        <td className="p-4 text-center"><span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs">Kelas {m.kelas}</span></td>
        <td className="p-4 text-center">
        <button onClick={() => hapusMurid(m.id)} className="text-gray-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors">
        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
        </td>
        </tr>
        ))}
        </tbody>
        </table>
        </div>
        {muridList.length === 0 && <div className="text-center py-12 text-gray-400">Belum ada data santri dimasukkan.</div>}
        </div>
        </div>
        )}
        </main>
        
        {/* === POPUP MODAL: TAMBAH JADWAL MENGAJAR === */}
        {showTambahJadwal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Tambah Jadwal Baru</h3>
        <button onClick={() => setShowTambahJadwal(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-lg">✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); tambahJadwal(); }} className="space-y-4">
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hari</label>
        <select className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm" value={formJadwal.hari} onChange={e => setFormJadwal({...formJadwal, hari: e.target.value})}>
        {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jam Mengajar</label>
        <input type="text" placeholder="Contoh: 07:30 - 09:00" className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm" value={formJadwal.jam_mulai} onChange={e => setFormJadwal({...formJadwal, jam_mulai: e.target.value})} required />
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
        <input type="text" placeholder="Contoh: 1A / 3" className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm" value={formJadwal.kelas} onChange={e => setFormJadwal({...formJadwal, kelas: e.target.value})} required />
        </div>
        <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kitab / Pelajaran</label>
        <input type="text" placeholder="Contoh: Fathul Qorib" className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm" value={formJadwal.jam_mulai || ''} onChange={e => setFormJadwal({...formJadwal, pelajaran: e.target.value})} required />
        </div>
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm mt-2">
        Simpan Jadwal Mengajar
        </button>
        </form>
        </div>
        </div>
        )}
        </div>
        );
        }