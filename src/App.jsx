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
  const [subTabAbsen, setSubTabAbsen] = useState('input'); 
  const [rekapBulan, setRekapBulan] = useState('');
  const [rekapKelas, setRekapKelas] = useState('');
  const [listSakuBatas, setListSakuBatas] = useState([]);
  const [listSakuTagihan, setListSakuTagihan] = useState([]);
  const [listCapaian, setListCapaian] = useState([]);

  // === SUB-TAB STATE ===
  const [bukuSakuTab, setBukuSakuTab] = useState('batas');
  const [nilaiModeTab, setNilaiModeTab] = useState('ujian');
  const [soalTab, setSoalTab] = useState('arsip'); 

  // === FORM STATE ===
  const [formMurid, setFormMurid] = useState({ id: null, nama: '', kelas: '', alamat: '', domisili: '' });
  const [formPerilaku, setFormPerilaku] = useState({ catatan: '' });
  const [formSoal, setFormSoal] = useState({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' });
  const [formJadwal, setFormJadwal] = useState({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  const [formSakuBatas, setFormSakuBatas] = useState({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
  const [formSakuTagihan, setFormSakuTagihan] = useState({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
  const [formCapaian, setFormCapaian] = useState({ capaian: '', tanggal: new Date().toISOString().split('T')[0] });

  const [filterKelasAbsen, setFilterKelasAbsen] = useState('Semua');
  
  // === STATE NAVIGASI ===
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

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const timer = setInterval(() => setNow(new Date()), 60000);

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
  
  const exportAbsenPDF = (bulan, kelas) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Arsip Presensi Murid - Kelas ${kelas}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Periode Bulan: ${bulan}`, 14, 28);
  doc.text(`Nama Pengajar: ${user?.email || 'Ustadz'}`, 14, 34);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 40);
  
  const muridDiKelas = muridList.filter(m => m.kelas === kelas);
  const tableData = [];
  
  muridDiKelas.forEach(m => {
  const absensMurid = listAbsensi.filter(a => {
  if (a.murid_id !== m.id) return false;
  const dateObj = new Date(a.tanggal);
  const namaBulan = dateObj.toLocaleDateString('id-ID', { month: 'long' });
  return namaBulan.toLowerCase() === bulan.toLowerCase();
  });
  
  const hadir = absensMurid.filter(a => a.status === 'Hadir' || a.status === 'H').length;
  const izin = absensMurid.filter(a => a.status === 'Izin' || a.status === 'I').length;
  const alfa = absensMurid.filter(a => a.status === 'Alfa' || a.status === 'A').length;
  
  tableData.push([m.nama, `${hadir} x`, `${izin} x`, `${alfa} x`]);
  });
  
  doc.autoTable({
  startY: 46,
  head: [['Nama Murid', 'Hadir (H)', 'Izin (I)', 'Alfa (A)']],
  body: tableData,
  theme: 'grid',
  headStyles: { fillColor: [5, 150, 105] }
  });
  doc.save(`Arsip_Presensi_Kelas_${kelas}_Bulan_${bulan}.pdf`);
  };
  
  const shareAbsenWA = (bulan, kelas) => {
  let text = `*ARSIP PRESENSI MURID - KELAS ${kelas}*\n📅 *Bulan:* ${bulan}\n👨‍🏫 *Pengajar:* ${user?.email || 'Ustadz'}\n\n`;
  const muridDiKelas = muridList.filter(m => m.kelas === kelas);
  muridDiKelas.forEach(m => {
  const absensMurid = listAbsensi.filter(a => {
  if (a.murid_id !== m.id) return false;
  const dateObj = new Date(a.tanggal);
  const namaBulan = dateObj.toLocaleDateString('id-ID', { month: 'long' });
  return namaBulan.toLowerCase() === bulan.toLowerCase();
  });
  const hadir = absensMurid.filter(a => a.status === 'Hadir' || a.status === 'H').length;
  const izin = absensMurid.filter(a => a.status === 'Izin' || a.status === 'I').length;
  const alfa = absensMurid.filter(a => a.status === 'Alfa' || a.status === 'A').length;
  text += `👤 *${m.nama}*\n   - Hadir: ${hadir}x\n   - Izin: ${izin}x\n   - Alfa: ${alfa}x\n\n`;
  });
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };
  
  const handleInstallPWA = async () => {
  if (deferredPrompt) {
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') setDeferredPrompt(null);
  }
  };
  
  const handleSimpanMurid = async (e) => {
  e.preventDefault();
  if (!formMurid.nama || !formMurid.kelas) return alert("Nama dan Kelas wajib diisi!");
  if (formMurid.id) {
  const updatedList = muridList.map(m => m.id === formMurid.id ? formMurid : m);
  setMuridList(updatedList);
  alert("Data murid diperbarui!");
  if (checkConnection()) {
  await supabase.from('murid').update({ nama: formMurid.nama, kelas: formMurid.kelas, alamat: formMurid.alamat, domisili: formMurid.domisili }).eq('id', formMurid.id);
  }
  } else {
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
  
  const handleSimpanJadwal = async (e) => {
  e.preventDefault();
  if(!formJadwal.jam_mulai || !formJadwal.kelas || !formJadwal.pelajaran) return alert("Lengkapi form jadwal!");
  if (formJadwal.id) {
  const updatedList = listJadwal.map(j => j.id === formJadwal.id ? formJadwal : j);
  setListJadwal(updatedList);
  alert("Jadwal diperbarui!");
  if(checkConnection()){
  await supabase.from('jadwal_mengajar').update({ hari: formJadwal.hari, jam_mulai: formJadwal.jam_mulai, kelas: formJadwal.kelas, pelajaran: formJadwal.pelajaran }).eq('id', formJadwal.id);
  }
  } else {
  const safeLocalId = Math.floor(Math.random() * 10000000);
  const newJadwal = { ...formJadwal, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
  setListJadwal([...listJadwal, newJadwal]);
  alert("Jadwal ditambahkan!");
  if (checkConnection()) await supabase.from('jadwal_mengajar').insert([newJadwal]);
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
  if (checkConnection()) await supabase.from('jadwal_mengajar').delete().eq('id', id);
  };
  
  const handleSimpanSoal = async (e) => {
  e.preventDefault();
  if (!formSoal.pelajaran || !formSoal.kelas || !formSoal.isi) return alert("Lengkapi formulir soal!");
  if (formSoal.id) {
  const updatedList = listBankSoal.map(s => s.id === formSoal.id ? formSoal : s);
  setListBankSoal(updatedList);
  alert("Soal berhasil diperbarui!");
  if(checkConnection()) await supabase.from('bank_soal').update({ pelajaran: formSoal.pelajaran, kelas: formSoal.kelas, batasan: formSoal.batasan, isi_soal: formSoal.isi }).eq('id', formSoal.id);
  } else {
  const safeLocalId = Math.floor(Math.random() * 10000000);
  const newSoal = { id: safeLocalId, pelajaran: formSoal.pelajaran, kelas: formSoal.kelas, batasan: formSoal.batasan, isi_soal: formSoal.isi };
  setListBankSoal([newSoal, ...listBankSoal]);
  alert("Soal berhasil disimpan!");
  if (checkConnection()) await supabase.from('bank_soal').insert([{ pelajaran: newSoal.pelajaran, kelas: newSoal.kelas, batasan: newSoal.batasan, isi_soal: newSoal.isi_soal, ustadz_email: user?.email }]);
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
  if(checkConnection()) await supabase.from('bank_soal').delete().eq('id', id);
  };
  
  const handleSimpanAbsen = async (muridId, status) => {
  const tanggalHariIni = new Date().toISOString().split('T')[0];
  const safeLocalId = Math.floor(Math.random() * 10000000);
  const absenBaru = { id: safeLocalId, murid_id: muridId, status, tanggal: tanggalHariIni, ustadz_email: user?.email };
  setListAbsensi(prev => [absenBaru, ...prev.filter(a => !(a.murid_id === muridId && a.tanggal === tanggalHariIni))]);
  if (checkConnection()) await supabase.from('absensi').insert([{ murid_id: muridId, status, tanggal: tanggalHariIni, ustadz_email: user?.email }]);
  };
  
  const handleSimpanPerilaku = async (e) => {
  e.preventDefault();
  if (!selectedMuridPerilaku?.id || !formPerilaku.catatan) return alert("Tulis catatan perilaku terlebih dahulu!");
  const safeLocalId = Math.floor(Math.random() * 10000000);
  const newPrilaku = { id: safeLocalId, murid_id: selectedMuridPerilaku.id, catatan: formPerilaku.catatan, created_at: new Date().toISOString() };
  setListPerilaku([newPrilaku, ...listPerilaku]);
  setFormPerilaku({ catatan: '' });
  alert("Catatan perilaku berhasil ditambahkan!");
  if (checkConnection()) await supabase.from('catatan_perilaku').insert([{ murid_id: newPrilaku.murid_id, catatan: newPrilaku.catatan, ustadz_email: user?.email }]);
  };
  
  const handleSimpanNilaiIndividu = async (e) => {
  e.preventDefault();
  if (!formNilai.pelajaran || !formNilai.skor) return alert("Lengkapi Pelajaran dan Skor!");
  const safeLocalId = Math.floor(Math.random() * 10000000);
  const newNilai = { id: safeLocalId, murid_id: selectedMuridNilai.id, jenis_ujian: formNilai.jenis, pelajaran: formNilai.pelajaran, skor: parseInt(formNilai.skor), created_at: new Date().toISOString() };
  setListNilai([newNilai, ...listNilai]);
  setFormNilai({ ...formNilai, skor: '' });
  alert("Nilai berhasil disimpan!");
  if (checkConnection()) await supabase.from('nilai').insert([{ murid_id: newNilai.murid_id, jenis_ujian: newNilai.jenis_ujian, pelajaran: newNilai.pelajaran, skor: newNilai.skor, ustadz_email: user?.email }]);
  };
  
  const handleSimpanSakuBatas = async (e) => {
  e.preventDefault();
  if(!formSakuBatas.kelas || !formSakuBatas.fan) return alert("Kelas dan Fan wajib diisi!");
  const safeLocalId = Math.floor(Math.random() * 10000000);
  const newSaku = { ...formSakuBatas, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
  setListSakuBatas([newSaku, ...listSakuBatas]);
  setFormSakuBatas({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
  if (checkConnection()) await supabase.from('buku_saku_batas').insert([newSaku]);
  };
  
  const handleSimpanSakuTagihan = async (e) => {
  e.preventDefault();
  if(!formSakuTagihan.tanggal || !formSakuTagihan.kelas || !formSakuTagihan.kitab) return alert("Isi form dengan lengkap!");
  const safeLocalId = Math.floor(Math.random() * 10000000);
  const newTagihan = { ...formSakuTagihan, murid_id: formSakuTagihan.murid_id ? parseInt(formSakuTagihan.murid_id) : null, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
  setListSakuTagihan([newTagihan, ...listSakuTagihan]);
  setFormSakuTagihan({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
  if (checkConnection()) await supabase.from('buku_saku_tagihan').insert([newTagihan]);
  };
  
  const handleSimpanCapaianHafalan = async (e) => {
  e.preventDefault();
  if(!formCapaian.capaian) return alert("Isi Capaian / Batas Hafalan!");
  const safeLocalId = Math.floor(Math.random() * 10000000);
  const newCapaian = { id: safeLocalId, murid_id: selectedMuridHafalan.id, capaian: formCapaian.capaian, tanggal: formCapaian.tanggal, ustadz_email: user?.email, created_at: new Date().toISOString() };
  setListCapaian([newCapaian, ...listCapaian]);
  setFormCapaian({ ...formCapaian, capaian: '' });
  alert("Capaian hafalan ditambahkan!");
  if (checkConnection()) await supabase.from('capaian_hafalan').insert([newCapaian]);
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
  
  if (!user) {
  return (
  <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 font-sans max-w-md mx-auto">
  <div className="bg-white p-8 rounded-3xl shadow-xl w-full border border-slate-200">
  <div className="text-center mb-6">
  <i className="fa-solid fa-graduation-cap text-5xl text-emerald-600 mb-3 block"></i>
  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Buku Ustaz</h1>
  </div>
  <form onSubmit={handleEmailAuth} className="space-y-4">
  <input type="email" placeholder="Alamat Email" desert-pwa="true" required className="w-full border border-slate-300 rounded-xl py-3 px-4 focus:ring-2 ring-emerald-500 outline-none text-sm" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} />
  <input type="password" placeholder="Password Akun" required className="w-full border border-slate-300 rounded-xl py-3 px-4 focus:ring-2 ring-emerald-500 outline-none text-sm" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} />
  <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg disabled:opacity-50">
  {loading ? 'Memproses...' : (authMode === 'login' ? 'Masuk' : 'Daftar')}
  </button>
  </form>
  <div className="mt-5 text-center">
  <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-sm text-emerald-600 font-bold hover:underline">
  {authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
  </button>
  </div>
  </div>
  </div>
  );
  }
  
  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))].sort();
  const namaHariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hariIni = namaHariList[now.getDay()];
  const tanggalHariIniFull = now.toISOString().split('T')[0];
  
  const jdwlHariIni = listJadwal.filter(j => j.hari === hariIni).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
  const tagihanHariIni = listSakuTagihan.filter(t => t.tanggal === tanggalHariIniFull);
  
  const hour = now.getHours();
  let ucapanWaktu = 'Pagi';
  if (hour >= 11 && hour < 15) ucapanWaktu = 'Siang';
  else if (hour >= 15 && hour < 18) ucapanWaktu = 'Sore';
  else if (hour >= 18) ucapanWaktu = 'Malam';
  
  const besok = namaHariList[(now.getDay() + 1) % 7];
  const jdwlBesok = listJadwal.filter(j => j.hari === besok).sort((a,b)=>a.jam_mulai.localeCompare(b.jam_mulai));
  
  const toMinute = (jam) => {
  if (!jam) return 0;
  const [j,m] = jam.split(':').map(Number);
  return (j*60)+(m||0);
  };
  
  const infoDinamis = (() => {
  const menitSekarang = (now.getHours()*60)+now.getMinutes();
  const jadwalHari = [...jdwlHariIni];
  
  if (menitSekarang >= 0 && menitSekarang <= 659) {
  if (jadwalHari.length) return `☀️ Ahlan Ustaz. Hari ini Anda memiliki jadwal ${jadwalHari[0].pelajaran} di kelas ${jadwalHari[0].kelas} pukul ${jadwalHari[0].jam_mulai} WIB.`;
  return `☀️ Ahlan Ustaz. Hari ini tidak ada jadwal mengajar rutin.`;
  }
  
  for (let i=0;i<jadwalHari.length;i++){
  const sekarang = jadwalHari[i];
  const mulai = toMinute(sekarang.jam_mulai);
  const selesai = mulai + 60;
  
  if (menitSekarang < mulai && menitSekarang >= mulai-180){
  const sisa = mulai - menitSekarang;
  const jam = Math.floor(sisa/60);
  const menit = sisa%60;
  const teks = jam>0 ? `${jam} jam ${menit} menit` : `${menit} menit`;
  return `🕌 Ahlan Ustaz. Persiapkan KBM ${sekarang.pelajaran} kelas ${sekarang.kelas}. Pelajaran dimulai ${teks} lagi.`;
  }
  if (menitSekarang >= mulai && menitSekarang <= selesai){
  return `🟢 Ahlan Ustaz. KBM ${sekarang.pelajaran} di kelas ${sekarang.kelas} sedang berlangsung.`;
  }
  }
  
  if (menitSekarang >= 1020){
  if (jdwlBesok.length) return `📅 Ahlan Ustaz. Besok Anda memiliki jadwal ${jdwlBesok[0].pelajaran} di kelas ${jdwlBesok[0].kelas} pukul ${jdwlBesok[0].jam_mulai} WIB.`;
  return `🌙 Ahlan Ustaz. Besok tidak ada jadwal mengajar rutin.`;
  }
  return `✨ Ahlan Ustaz. Semoga kegiatan hari ini dimudahkan Allah.`;
  })();
  
  return (
  <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200 overflow-hidden pb-32 relative">
  <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
  <div className="flex items-center gap-2">
  <i className="fa-solid fa-graduation-cap text-lg"></i>
  <h1 className="text-xl font-bold tracking-tight">Buku Ustaz</h1>
  </div>
  <div className="flex items-center gap-3">
  {isOffline && <span className="text-[10px] bg-red-500 px-2 py-1 rounded font-bold uppercase tracking-wider animate-pulse">Offline</span>}
  <button onClick={() => syncSemuaDataKeCloud()} className="text-white bg-emerald-700 w-8 h-8 rounded-full flex items-center justify-center transition" title="Sinkron Cloud">
  {loading ? <i className="fa-solid fa-spinner fa-spin text-xs"></i> : <i className="fa-solid fa-cloud-arrow-up text-xs"></i>}
  </button>
  <button onClick={() => supabase.auth.signOut()} className="text-emerald-100 hover:text-white text-sm"><i className="fa-solid fa-right-from-bracket"></i></button>
  </div>
  </header>
  
  {deferredPrompt && (
  <div className="bg-emerald-100 border-b border-emerald-200 px-4 py-2 flex items-center justify-between">
  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
  <i className="fa-solid fa-download"></i>
  <span>Instal Aplikasi di HP</span>
  </div>
  <button onClick={handleInstallPWA} className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-700">Instal Sekarang</button>
  </div>
  )}
  
  <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
  
  {/* === TAB JADWAL === */}
  {activeTab === 'jadwal' && (
  <div className="space-y-4">
  <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white rounded-2xl shadow-lg border border-emerald-500 p-4">
  <div className="flex items-start gap-3">
  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
  <i className="fa-solid fa-bell text-amber-300"></i>
  </div>
  <div className="flex-1">
  <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-100">Smart Info</p>
  <p className="text-sm font-semibold leading-relaxed">{infoDinamis}</p>
  <div className="mt-2 text-[10px] text-emerald-100 flex flex-wrap gap-2">
  <span>📆 {hariIni}</span>
  <span>📚 {jdwlHariIni.length} Jadwal</span>
  {tagihanHariIni.length > 0 && <span>⚠️ {tagihanHariIni.length} Janji</span>}
  </div>
  </div>
  </div>
  </div>
  
  <div className="bg-white p-4 rounded-xl border shadow-sm">
  <div className="flex justify-between items-center mb-3 border-b pb-2">
  <h3 className="font-bold text-slate-800 text-xs uppercase text-emerald-600">Jadwal Mengajar Mingguan</h3>
  <button onClick={() => {setShowTambahJadwal(!showTambahJadwal); setFormJadwal({id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: ''})}} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">
  {showTambahJadwal ? 'Batal' : '+ Tambah Jadwal'}
  </button>
  </div>
  <div className="space-y-3">
  {namaHariList.map(h => {
  const jP = listJadwal.filter(j => j.hari === h).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
  if (jP.length === 0) return null;
  return (
  <div key={h} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
  <p className="text-xs font-bold text-slate-700 mb-1 border-b pb-1 flex items-center gap-1">
  <i className="fa-regular fa-calendar text-emerald-600"></i> {h}
  </p>
  {jP.map(j => (
  <div key={j.id} className="flex items-center justify-between py-1 border-b border-slate-200 last:border-0 text-sm">
  <div className="flex items-center gap-2">
  <span className="font-mono text-[10px] font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded">{j.jam_mulai}</span>
  <span className="text-slate-700 font-medium text-xs">{j.pelajaran} <span className="text-[10px] text-slate-500 bg-slate-200 px-1 rounded ml-1">Kls {j.kelas}</span></span>
  </div>
  <div className="flex gap-2">
  <button onClick={() => handleEditJadwal(j)} className="text-emerald-500 hover:text-emerald-700"><i className="fa-solid fa-pen text-[10px]"></i></button>
  <button onClick={() => handleHapusJadwal(j.id)} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-trash text-[10px]"></i></button>
  </div>
  </div>
  ))}
  </div>
  )
  })}
  {listJadwal.length === 0 && <p className="text-xs text-center text-slate-400 py-4">Belum ada jadwal yang ditambahkan.</p>}
  </div>
  </div>
  
  {showTambahJadwal && (
  <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-3 animate-fade-in">
  <h3 className="font-bold text-slate-800 text-xs border-b pb-2 text-emerald-600 uppercase tracking-wider">
  {formJadwal.id ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
  </h3>
  <div className="grid grid-cols-2 gap-2">
  <select className="border p-2.5 rounded-xl text-sm bg-slate-50 outline-none" value={formJadwal.hari} onChange={e => setFormJadwal({...formJadwal, hari: e.target.value})}>
  {namaHariList.map(h => <option key={h} value={h}>{h}</option>)}
  </select>
  <input type="time" className="border p-2.5 rounded-xl text-sm outline-none" value={formJadwal.jam_mulai} onChange={e => setFormJadwal({...formJadwal, jam_mulai: e.target.value})} />
  </div>
  <input type="text" placeholder="Kelas" className="w-full border rounded-xl p-2.5 text-sm" value={formJadwal.kelas} onChange={e => setFormJadwal({...formJadwal, kelas: e.target.value})} />
  <input type="text" placeholder="Nama Kitab / Pelajaran" className="w-full border rounded-xl p-2.5 text-sm" value={formJadwal.pelajaran} onChange={e => setFormJadwal({...formJadwal, pelajaran: e.target.value})} />
  <button onClick={handleSimpanJadwal} className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow hover:bg-emerald-700 transition">
  {formJadwal.id ? 'Simpan Perubahan' : 'Simpan Jadwal'}
  </button>
  </div>
  )}
  </div>
  )}
  
  {/* === TAB RAPOR & SANTRI === */}
  {activeTab === 'rapor' && (
  <div className="space-y-4">
  {!raporKelas && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
  <div className="flex justify-between items-center border-b pb-2">
  <h3 className="font-bold text-slate-800 text-sm text-emerald-600 flex items-center gap-2">
  <i className="fa-solid fa-users"></i> Data Santri & Rapor
  </h3>
  <button onClick={() => {setShowTambahMurid(!showTambahMurid); setFormMurid({id:null, nama:'', kelas:'', alamat:'', domisili:''})}} className="text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-1.5 rounded-lg">
  {showTambahMurid ? 'Batal' : '+ Santri Baru'}
  </button>
  </div>
  
  {showTambahMurid && (
  <form onSubmit={handleSimpanMurid} className="bg-emerald-50 p-4 border border-emerald-200 rounded-xl space-y-2 mb-2">
  <h4 className="text-xs font-bold text-emerald-800 mb-2">{formMurid.id ? 'Edit Data Santri' : 'Tambah Santri Baru'}</h4>
  <input type="text" placeholder="Nama Lengkap" required className="w-full border rounded-lg p-2 text-xs bg-white" value={formMurid.nama} onChange={e => setFormMurid({...formMurid, nama: e.target.value})} />
  <input type="text" placeholder="Kelas" required className="w-full border rounded-lg p-2 text-xs bg-white" value={formMurid.kelas} onChange={e => setFormMurid({...formMurid, kelas: e.target.value})} />
  <input type="text" placeholder="Kamar / Domisili" className="w-full border rounded-lg p-2 text-xs bg-white" value={formMurid.domisili} onChange={e => setFormMurid({...formMurid, domisili: e.target.value})} />
  <input type="text" placeholder="Alamat Rumah" className="w-full border rounded-lg p-2 text-xs bg-white" value={formMurid.alamat} onChange={e => setFormMurid({...formMurid, alamat: e.target.value})} />
  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 text-xs rounded-lg">{formMurid.id ? 'Simpan Perubahan' : 'Simpan Data'}</button>
  </form>
  )}
  
  <p className="text-xs text-slate-500 font-bold">Pilih Kelas untuk melihat Rapor / Edit Santri:</p>
  <div className="grid grid-cols-2 gap-2">
  {listKelasUnik.map(k => (
  <button key={k} onClick={() => setRaporKelas(k)} className="bg-slate-50 border p-4 rounded-xl text-center font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition">
  Kelas {k}
  </button>
  ))}
  {listKelasUnik.length === 0 && <p className="text-xs text-slate-400 col-span-2">Belum ada data kelas. Tambahkan santri baru.</p>}
  </div>
  </div>
  )}
  
  {raporKelas && !selectedMuridRapor && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
  <div className="flex justify-between items-center border-b pb-2">
  <h3 className="font-bold text-slate-800 text-sm">Daftar Santri Kelas {raporKelas}</h3>
  <button onClick={() => setRaporKelas('')} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded font-bold">Kembali</button>
  </div>
  <div className="space-y-2">
  {muridList.filter(m => m.kelas === raporKelas).map(m => (
  <div key={m.id} className="w-full bg-slate-50 p-3 rounded-xl border flex justify-between items-center text-sm">
  <div onClick={() => setSelectedMuridRapor(m)} className="flex-1 cursor-pointer font-semibold text-slate-700 flex items-center gap-2">
  <i className="fa-solid fa-user text-slate-300"></i> {m.nama}
  </div>
  <div className="flex gap-3 pl-2 border-l">
  <button onClick={() => { setRaporKelas(''); handleEditMurid(m); }} className="text-emerald-500 hover:text-emerald-700" title="Edit Data"><i className="fa-solid fa-pen text-xs"></i></button>
  <button onClick={() => handleHapusMurid(m.id)} className="text-red-400 hover:text-red-600" title="Hapus Data"><i className="fa-solid fa-trash text-xs"></i></button>
  </div>
  </div>
  ))}
  </div>
  </div>
  )}
  
  {raporKelas && selectedMuridRapor && (() => {
  const mId = selectedMuridRapor.id;
  const absens = listAbsensi.filter(a => a.murid_id === mId);
  const nilais = listNilai.filter(n => n.murid_id === mId);
  const hafalans = listCapaian.filter(c => c.murid_id === mId);
  const prilakus = listPerilaku.filter(p => p.murid_id === mId);
  
  const totalAbsen = absens.length;
  const hadir = absens.filter(a => a.status === 'Hadir').length;
  const persenHadir = totalAbsen > 0 ? Math.round((hadir / totalAbsen) * 100) : 100;
  
  return (
  <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
  {/* Perbaikan struktur JSX Rapor Tampilan */}
  <div className="flex justify-between items-start border-b pb-3">
  <div>
  <h2 className="text-lg font-bold text-slate-800">{selectedMuridRapor.nama}</h2>
  <p className="text-xs text-slate-400 font-medium">Kelas {selectedMuridRapor.kelas} | Kamar: {selectedMuridRapor.domisili || '-'}</p>
  </div>
  <div className="flex flex-col items-end gap-1.5">
  <button onClick={() => setSelectedMuridRapor(null)} className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold uppercase tracking-wider">Kembali</button>
  <div className="flex gap-1">
  <button onClick={() => exportRaporPDF(selectedMuridRapor)} className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded font-bold shadow transition"><i className="fa-solid fa-file-pdf"></i> PDF</button>
  <button onClick={() => shareRaporWA(selectedMuridRapor)} className="text-[10px] bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded font-bold shadow transition"><i className="fa-brands fa-whatsapp"></i> WA</button>
  </div>
  </div>
  </div>
  
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
  <div>
  <p className="text-[10px] uppercase font-bold text-slate-400">Kehadiran</p>
  <p className="text-lg font-black text-slate-700">{persenHadir}% <span className="text-xs font-normal text-slate-400">({hadir}/{totalAbsen} Hari)</span></p>
  </div>
  <div className="flex gap-2 text-[10px] font-bold text-white">
  <span className="bg-emerald-600 px-2 py-1 rounded">H: {hadir}</span>
  <span className="bg-amber-500 px-2 py-1 rounded">I: {absens.filter(a=>a.status==='Izin').length}</span>
  <span className="bg-red-500 px-2 py-1 rounded">A: {absens.filter(a=>a.status==='Alfa').length}</span>
  </div>
  </div>
  
  <div className="space-y-2">
  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide border-l-2 border-emerald-600 pl-2">Nilai Ujian & Tugas</h4>
  <div className="bg-slate-50 rounded-xl border p-2 text-xs space-y-1">
  {nilais.map(n => (
  <div key={n.id} className="flex justify-between py-1 border-b border-white last:border-0">
  <span className="text-slate-600"><b>[{n.jenis_ujian}]</b> {n.pelajaran}</span>
  <span className="font-bold text-emerald-600">{n.skor} Pts</span>
  </div>
  ))}
  {nilais.length === 0 && <p className="text-[11px] text-slate-400 text-center py-1">Belum ada data nilai.</p>}
  </div>
  </div>
  
  <div className="space-y-2">
  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide border-l-2 border-emerald-600 pl-2">Pencapaian Hafalan</h4>
  <div className="bg-slate-50 rounded-xl border p-2 text-xs space-y-1 max-h-32 overflow-y-auto">
  {hafalans.map(c => (
  <div key={c.id} className="py-1 border-b border-white last:border-0">
  <span className="text-[10px] font-mono text-slate-400 block">{c.tanggal}</span>
  <span className="text-slate-700 font-medium">{c.capaian}</span>
  </div>
  ))}
  {hafalans.length === 0 && <p className="text-[11px] text-slate-400 text-center py-1">Belum ada riwayat setoran.</p>}
  </div>
  </div>
  
  <div className="space-y-2">
  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide border-l-2 border-emerald-600 pl-2">Catatan Sikap & Perilaku</h4>
  <div className="bg-slate-50 rounded-xl border p-2 text-xs space-y-1">
  {prilakus.map(p => (
  <div key={p.id} className="py-1 border-b border-white last:border-0 text-slate-700">
  • {p.catatan}
  </div>
  ))}
  {prilakus.length === 0 && <p className="text-[11px] text-slate-400 text-center py-1">Tidak ada catatan khusus.</p>}
  </div>
  </div>
  </div>
  );
  })()}
  </div>
  )}
  
  {/* === TAB ABSENSI === */}
  {activeTab === 'absen' && (
  <div className="space-y-4">
  <div className="bg-white p-3 rounded-xl border flex items-center justify-between shadow-sm">
  <label className="text-xs font-bold text-slate-500"><i className="fa-solid fa-filter"></i> Filter Kelas:</label>
  <select className="border p-1.5 rounded-lg text-xs font-bold bg-slate-50 outline-none" value={filterKelasAbsen} onChange={e => setFilterKelasAbsen(e.target.value)}>
  <option value="Semua">Semua Kelas</option>
  {listKelasUnik.map(k => <option key={k} value={k}>{k}</option>)}
  </select>
  </div>
  <div className="space-y-2">
  {muridList.filter(m => filterKelasAbsen === 'Semua' || m.kelas === filterKelasAbsen).map(m => {
  const aH = listAbsensi.find(a => a.murid_id === m.id && a.tanggal === tanggalHariIniFull);
  return (
  <div key={m.id} className="bg-white p-3.5 rounded-xl border flex items-center justify-between shadow-sm">
  <div>
  <h4 className="font-bold text-slate-800 text-sm">{m.nama}</h4>
  <p className="text-[9px] text-slate-400 font-bold uppercase">Kelas {m.kelas}</p>
  </div>
  <div className="flex gap-1">
  <button onClick={() => handleSimpanAbsen(m.id, 'Hadir')} className={`w-8 h-8 rounded-lg font-bold text-xs shadow-sm ${aH?.status === 'Hadir' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>H</button>
  <button onClick={() => handleSimpanAbsen(m.id, 'Izin')} className={`w-8 h-8 rounded-lg font-bold text-xs shadow-sm ${aH?.status === 'Izin' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>I</button>
  <button onClick={() => handleSimpanAbsen(m.id, 'Alfa')} className={`w-8 h-8 rounded-lg font-bold text-xs shadow-sm ${aH?.status === 'Alfa' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>A</button>
  </div>
  </div>
  );
  })}
  {muridList.length === 0 && <p className="text-center text-xs text-slate-400 mt-5">Tidak ada data santri.</p>}
  </div>
  </div>
  )}
  
  {/* === TAB BUKU SAKU === */}
  {activeTab === 'saku' && (
  <div className="space-y-4">
  <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner">
  <button onClick={() => setBukuSakuTab('batas')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${bukuSakuTab === 'batas' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Batas Kitab</button>
  <button onClick={() => setBukuSakuTab('tagihan')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${bukuSakuTab === 'tagihan' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Janji Tagihan</button>
  </div>
  
  {bukuSakuTab === 'batas' && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
  <h3 className="font-bold text-slate-800 text-xs border-b pb-2 uppercase text-emerald-600">Catatan Batas Mengajar</h3>
  <div className="grid grid-cols-2 gap-2">
  <input type="text" placeholder="Kelas" className="border rounded-xl p-2.5 text-sm" value={formSakuBatas.kelas} onChange={e => setFormSakuBatas({...formSakuBatas, kelas: e.target.value})} />
  <input type="text" placeholder="Fan / Kitab" className="border rounded-xl p-2.5 text-sm" value={formSakuBatas.fan} onChange={e => setFormSakuBatas({...formSakuBatas, fan: e.target.value})} />
  </div>
  <input type="text" placeholder="Materi Terakhir" className="w-full border rounded-xl p-2.5 text-sm" value={formSakuBatas.materi} onChange={e => setFormSakuBatas({...formSakuBatas, materi: e.target.value})} />
  <input type="text" placeholder="Halaman / Bab" className="w-full border rounded-xl p-2.5 text-sm" value={formSakuBatas.halaman} onChange={e => setFormSakuBatas({...formSakuBatas, halaman: e.target.value})} />
  <input type="text" placeholder="Target Pertemuan Berikutnya" className="w-full border rounded-xl p-2.5 text-sm" value={formSakuBatas.target} onChange={e => setFormSakuBatas({...formSakuBatas, target: e.target.value})} />
  <button onClick={handleSimpanSakuBatas} className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow hover:bg-emerald-700">Simpan Catatan</button>
  </div>
  )}
  
  {bukuSakuTab === 'tagihan' && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
  <h3 className="font-bold text-slate-800 text-xs border-b pb-2 uppercase text-emerald-600">Janji Ulangan / Setoran</h3>
  <input type="date" className="w-full border rounded-xl p-2.5 text-sm text-slate-700" value={formSakuTagihan.tanggal} onChange={e => setFormSakuTagihan({...formSakuTagihan, tanggal: e.target.value})} />
  <div className="grid grid-cols-2 gap-2">
  <input type="text" placeholder="Kelas" className="border rounded-xl p-2.5 text-sm" value={formSakuTagihan.kelas} onChange={e => setFormSakuTagihan({...formSakuTagihan, kelas: e.target.value})} />
  <input type="text" placeholder="Pelajaran" className="border rounded-xl p-2.5 text-sm" value={formSakuTagihan.kitab} onChange={e => setFormSakuTagihan({...formSakuTagihan, kitab: e.target.value})} />
  </div>
  <div className="grid grid-cols-2 gap-2">
  <input type="text" placeholder="Mulai Dari..." className="border rounded-xl p-2.5 text-sm" value={formSakuTagihan.target_dari} onChange={e => setFormSakuTagihan({...formSakuTagihan, target_dari: e.target.value})} />
  <input type="text" placeholder="Sampai..." className="border rounded-xl p-2.5 text-sm" value={formSakuTagihan.target_sampai} onChange={e => setFormSakuTagihan({...formSakuTagihan, target_sampai: e.target.value})} />
  </div>
  <select className="w-full border rounded-xl p-2.5 text-sm bg-white" value={formSakuTagihan.murid_id} onChange={e => setFormSakuTagihan({...formSakuTagihan, murid_id: e.target.value})}>
  <option value="">Berlaku Semua Murid Kelas Tersebut</option>
  {muridList.filter(m => !formSakuTagihan.kelas || m.kelas === formSakuTagihan.kelas).map(m => (
  <option key={m.id} value={m.id}>{m.nama}</option>
  ))}
  </select>
  <button onClick={handleSimpanSakuTagihan} className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow hover:bg-emerald-700">Simpan Tagihan</button>
  </div>
  )}
  </div>
  )}
  
  {/* === TAB SIKAP / PERILAKU === */}
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
  
  {/* === TAB PENILAIAN === */}
  {activeTab === 'nilai' && (
  <div className="space-y-4">
  <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner">
  <button onClick={() => setNilaiModeTab('ujian')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${nilaiModeTab === 'ujian' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Nilai Akademik</button>
  <button onClick={() => setNilaiModeTab('hafalan')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${nilaiModeTab === 'hafalan' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Setoran Hafalan</button>
  </div>
  
  {nilaiModeTab === 'ujian' && (
  <div className="space-y-4">
  {!nilaiKelas && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
  <h3 className="font-bold text-slate-800 text-xs border-b pb-2 text-emerald-600 uppercase tracking-wider">Pilih Kelas (Nilai)</h3>
  <div className="grid grid-cols-2 gap-2">
  {listKelasUnik.map(k => (
  <button key={k} onClick={() => setNilaiKelas(k)} className="bg-slate-50 border p-3 rounded-xl font-bold text-slate-700 hover:border-emerald-500">Kelas {k}</button>
  ))}
  </div>
  </div>
  )}
  
  {nilaiKelas && !selectedMuridNilai && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
  <div className="flex flex-col gap-2 border-b pb-3">
  <div className="flex justify-between items-center">
  <h3 className="font-bold text-slate-800 text-sm">Pilih Santri Kelas {nilaiKelas}</h3>
  <button onClick={() => setNilaiKelas('')} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded font-bold">Kembali</button>
  </div>
  <div className="flex gap-2">
  <button onClick={() => exportNilaiKelasPDF(nilaiKelas)} className="flex-1 text-[10px] bg-red-500 text-white px-2 py-2 rounded-lg font-bold shadow hover:bg-red-600 transition"><i className="fa-solid fa-file-pdf"></i> Cetak PDF Nilai Kelas</button>
  <button onClick={() => shareNilaiKelasWA(nilaiKelas)} className="flex-1 text-[10px] bg-green-500 text-white px-2 py-2 rounded-lg font-bold shadow hover:bg-green-600 transition"><i className="fa-brands fa-whatsapp"></i> Share WA Kelas</button>
  </div>
  </div>
  <div className="space-y-1.5">
  {muridList.filter(m => m.kelas === nilaiKelas).map(m => (
  <button key={m.id} onClick={() => setSelectedMuridNilai(m)} className="w-full bg-slate-50 p-2.5 rounded-xl border text-left font-semibold text-sm text-slate-700 hover:bg-emerald-50">{m.nama}</button>
  ))}
  </div>
  </div>
  )}
  
  {nilaiKelas && selectedMuridNilai && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
  <div className="flex justify-between items-center border-b pb-2">
  <h3 className="font-bold text-slate-800 text-sm">Input Nilai: <span className="text-emerald-600">{selectedMuridNilai.nama}</span></h3>
  <button onClick={() => setSelectedMuridNilai(null)} className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">Kembali</button>
  </div>
  <input type="text" placeholder="Nama Mata Pelajaran" className="w-full border rounded-xl p-2.5 text-sm" value={formNilai.pelajaran} onChange={e => setFormNilai({...formNilai, pelajaran: e.target.value})} />
  <div className="grid grid-cols-3 gap-1">
  {['Ulangan', 'Tugas', 'Ujian Lisan'].map(j => (
  <button key={j} type="button" onClick={() => setFormNilai({...formNilai, jenis: j})} className={`py-2 text-[10px] font-bold rounded-lg border ${formNilai.jenis === j ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{j}</button>
  ))}
  </div>
  <input type="number" placeholder="Skor Angka (0-100)" className="w-full border rounded-xl p-2.5 text-sm font-bold text-emerald-700" value={formNilai.skor} onChange={e => setFormNilai({...formNilai, skor: e.target.value})} />
  <button onClick={handleSimpanNilaiIndividu} className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow hover:bg-emerald-700">Simpan Nilai</button>
  </div>
  )}
  </div>
  )}
  
  {nilaiModeTab === 'hafalan' && (
  <div className="space-y-4">
  {!hafalanKelas && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
  <h3 className="font-bold text-slate-800 text-xs border-b pb-2 text-emerald-600 uppercase tracking-wider">Pilih Kelas (Hafalan)</h3>
  <div className="grid grid-cols-2 gap-2">
  {listKelasUnik.map(k => (
  <button key={k} onClick={() => setHafalanKelas(k)} className="bg-slate-50 border p-3 rounded-xl font-bold text-slate-700 hover:border-emerald-500">Kelas {k}</button>
  ))}
  </div>
  </div>
  )}
  
  {hafalanKelas && !selectedMuridHafalan && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
  <div className="flex justify-between items-center border-b pb-2">
  <h3 className="font-bold text-slate-800 text-sm">Pilih Santri Kelas {hafalanKelas}</h3>
  <button onClick={() => setHafalanKelas('')} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded font-bold">Kembali</button>
  </div>
  <div className="space-y-1.5">
  {muridList.filter(m => m.kelas === hafalanKelas).map(m => (
  <button key={m.id} onClick={() => setSelectedMuridHafalan(m)} className="w-full bg-slate-50 p-2.5 rounded-xl border text-left font-semibold text-sm text-slate-700 hover:bg-emerald-50">{m.nama}</button>
  ))}
  </div>
  </div>
  )}
  
  {hafalanKelas && selectedMuridHafalan && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
  <div className="flex justify-between items-center border-b pb-2">
  <h3 className="font-bold text-slate-800 text-sm">Setoran: <span className="text-emerald-600">{selectedMuridHafalan.nama}</span></h3>
  <button onClick={() => setSelectedMuridHafalan(null)} className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">Kembali</button>
  </div>
  <input type="date" className="w-full border rounded-xl p-2.5 text-sm text-slate-600" value={formCapaian.tanggal} onChange={e => setFormCapaian({...formCapaian, tanggal: e.target.value})} />
  <textarea placeholder="Contoh: Juz 30, Surat An-Naba' Ayat 1-20" className="w-full border rounded-xl p-2.5 text-sm h-20 outline-none resize-none" value={formCapaian.capaian} onChange={e => setFormCapaian({...formCapaian, capaian: e.target.value})}></textarea>
  <button onClick={handleSimpanCapaianHafalan} className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow hover:bg-emerald-700">Simpan Progres</button>
  </div>
  )}
  </div>
  )}
  </div>
  )}
  
  {/* === TAB BANK SOAL === */}
  {activeTab === 'soal' && (
  <div className="space-y-4">
  <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner">
  <button onClick={() => {setSoalTab('arsip'); setFormSoal({id: null, pelajaran: '', kelas: '', batasan: '', isi: ''})}} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${soalTab === 'arsip' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Arsip Soal</button>
  <button onClick={() => setSoalTab('buat')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${soalTab === 'buat' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>Buat Soal</button>
  </div>
  
  {soalTab === 'buat' && (
  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
  <h3 className="font-bold text-slate-800 text-xs border-b pb-2 uppercase text-emerald-600">
  {formSoal.id ? 'Edit Soal Ujian' : 'Buat Soal Ujian Baru'}
  </h3>
  <div className="grid grid-cols-2 gap-2">
  <input type="text" placeholder="Mata Pelajaran" className="w-full border rounded-xl p-2.5 text-sm" value={formSoal.pelajaran} onChange={e => setFormSoal({...formSoal, pelajaran: e.target.value})} />
  <input type="text" placeholder="Kelas Target" className="w-full border rounded-xl p-2.5 text-sm" value={formSoal.kelas} onChange={e => setFormSoal({...formSoal, kelas: e.target.value})} />
  </div>
  <input type="text" placeholder="Batasan Materi (Opsional)" className="w-full border rounded-xl p-2.5 text-sm" value={formSoal.batasan} onChange={e => setFormSoal({...formSoal, batasan: e.target.value})} />
  <textarea placeholder="Tulis teks pertanyaan atau lembar ujian..." className="w-full border rounded-xl p-2.5 text-sm h-32 resize-none" value={formSoal.isi} onChange={e => setFormSoal({...formSoal, isi: e.target.value})}></textarea>
  <button onClick={handleSimpanSoal} className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow hover:bg-emerald-700">
  {formSoal.id ? 'Simpan Perubahan Soal' : 'Simpan ke Bank Soal'}
  </button>
  </div>
  )}
  
  {soalTab === 'arsip' && (
  <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
  <h3 className="font-bold text-slate-800 text-xs border-b pb-2 uppercase text-emerald-600">Dokumen Arsip Soal</h3>
  {listBankSoal.length === 0 ? (
  <p className="text-xs text-center text-slate-400 py-4">Belum ada soal yang disimpan.</p>
  ) : (
  listBankSoal.map(s => (
  <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 relative">
  <div className="flex justify-between items-start mb-2 border-b pb-2">
  <div>
  <h4 className="text-sm font-bold text-slate-800">{s.pelajaran}</h4>
  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">Kelas {s.kelas}</span>
  </div>
  <div className="flex gap-1.5">
  <button onClick={() => exportSoalPDF(s)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded" title="Cetak PDF"><i className="fa-solid fa-file-pdf text-[10px]"></i></button>
  <button onClick={() => shareSoalWA(s)} className="text-green-600 hover:text-green-800 bg-green-50 p-1.5 rounded" title="Share WA"><i className="fa-brands fa-whatsapp text-[10px]"></i></button>
  <button onClick={() => handleEditSoal(s)} className="text-emerald-500 hover:text-emerald-700 bg-emerald-50 p-1.5 rounded" title="Edit Soal"><i className="fa-solid fa-pen text-[10px]"></i></button>
  <button onClick={() => handleHapusSoal(s.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded" title="Hapus Soal"><i className="fa-solid fa-trash text-[10px]"></i></button>
  </div>
  </div>
  <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-3">{s.isi_soal}</p>
  </div>
  ))
  )}
  </div>
  )}
  </div>
  )}
  </main>
  
  {/* FOOTER BAR FIXED */}
  <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-between px-2 py-2 z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
  {[
  { id: 'jadwal', icon: 'fa-calendar-day', label: 'Jadwal' },
  { id: 'rapor', icon: 'fa-users', label: 'Santri' },
  { id: 'absen', icon: 'fa-clipboard-user', label: 'Absen' },
  { id: 'saku', icon: 'fa-book-bookmark', label: 'Saku' },
  { id: 'perilaku', icon: 'fa-star-half-stroke', label: 'Sikap' },
  { id: 'nilai', icon: 'fa-file-signature', label: 'Nilai' },
  { id: 'soal', icon: 'fa-folder-open', label: 'Soal' }
  ].map(m => {
  const isA = activeTab === m.id;
  return (
  <button key={m.id} onClick={() => { setActiveTab(m.id); setNilaiKelas(''); setSelectedMuridNilai(null); setHafalanKelas(''); setSelectedMuridHafalan(null); setPerilakuKelas(''); setSelectedMuridPerilaku(null); setRaporKelas(''); setSelectedMuridRapor(null); }} className="flex flex-col items-center justify-center py-0.5 w-12 outline-none">
  <i className={`fa-solid ${m.icon} text-[18px] mb-0.5 ${isA ? 'text-emerald-600 scale-105 transition-transform' : 'text-slate-400'}`}></i>
  <span className={`text-[8px] font-black ${isA ? 'text-emerald-700' : 'text-slate-400'}`}>{m.label}</span>
  </button>
  );
  })}
  </nav>
  </div>
  );
  }