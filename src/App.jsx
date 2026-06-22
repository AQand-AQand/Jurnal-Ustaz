import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Ganti dengan kredensial Supabase Anda jika berbeda
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

  // === SUB-TAB STATE ===
  const [bukuSakuTab, setBukuSakuTab] = useState('batas');
  const [nilaiModeTab, setNilaiModeTab] = useState('ujian');
  const [soalTab, setSoalTab] = useState('arsip'); 

  // === STATE ABSENSI ===
  const [absenTabMode, setAbsenTabMode] = useState('harian'); // 'harian' atau 'rekap'
  const [absenKelas, setAbsenKelas] = useState('');
  const [absenTanggal, setAbsenTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [absenPelajaran, setAbsenPelajaran] = useState('');
  
  const [rekapBulanTahun, setRekapBulanTahun] = useState(new Date().toISOString().slice(0,7)); // YYYY-MM
  const [rekapKelas, setRekapKelas] = useState('');
  // State baru untuk fitur edit di dalam menu rekap
  const [detailRekapMurid, setDetailRekapMurid] = useState(null); 

  // === FORM STATE ===
  const [formMurid, setFormMurid] = useState({ id: null, nama: '', kelas: '', alamat: '', domisili: '' });
  const [formPerilaku, setFormPerilaku] = useState({ catatan: '' });
  const [formSoal, setFormSoal] = useState({ id: null, pelajaran: '', kelas: '', batasan: '', isi: '' });
  const [formJadwal, setFormJadwal] = useState({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  const [formSakuBatas, setFormSakuBatas] = useState({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
  const [formSakuTagihan, setFormSakuTagihan] = useState({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '' });
  const [formCapaian, setFormCapaian] = useState({ capaian: '', tanggal: new Date().toISOString().split('T')[0] });

  // State Navigasi
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

  // DAFTAR PELAJARAN UNIK DARI JADWAL (Untuk Dropdown Absen)
  const listPelajaranUnik = [...new Set(listJadwal.map(j => j.pelajaran))].filter(Boolean);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    
    loadDataLokalOffline();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
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

  useEffect(() => { if (user && !isOffline) syncSemuaDataKeCloud(); }, [user, isOffline]);

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

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  // ==========================================
  // FUNGSI HELPER PDF MODERN
  // ==========================================
  const buatHeaderPDF = (doc, judulLaporan, infoList) => {
    // Styling Judul
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105); // Warna Emerald
    doc.text(judulLaporan, 14, 22);
    
    // Styling Info Detail
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    
    let yPos = 32;
    infoList.forEach(info => {
      doc.text(info, 14, yPos);
      yPos += 7;
    });

    // Garis Pemisah Elegan
    yPos += 3;
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.8);
    doc.line(14, yPos, 196, yPos);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, yPos + 1.5, 196, yPos + 1.5);
    
    return yPos + 10;
  };

  // ==========================================
  // KUMPULAN EXPORT PDF & SHARE WA
  // ==========================================

  // 1. REKAP ABSEN (BULANAN)
  const exportRekapAbsenPDF = (bulanTahun, kelas) => {
    const doc = new jsPDF();
    const namaBulan = new Date(bulanTahun + "-01").toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    const yTable = buatHeaderPDF(doc, "LAPORAN PRESENSI BULANAN SANTRI", [
      `Kelas                  : ${kelas}`,
      `Periode Bulan    : ${namaBulan}`,
      `Nama Pengajar  : ${user?.email || 'Ustaz'}`,
      `Tanggal Cetak   : ${new Date().toLocaleDateString('id-ID')}`
    ]);

    const muridDiKelas = muridList.filter(m => m.kelas === kelas);
    const tableData = [];

    muridDiKelas.forEach((m, index) => {
      const absenBulanan = listAbsensi.filter(a => a.murid_id === m.id && a.tanggal.startsWith(bulanTahun));
      const hadir = absenBulanan.filter(a => a.status === 'Hadir' || a.status === 'H').length;
      const izin = absenBulanan.filter(a => a.status === 'Izin' || a.status === 'I').length;
      const alfa = absenBulanan.filter(a => a.status === 'Alfa' || a.status === 'A').length;
      tableData.push([index + 1, m.nama, hadir, izin, alfa]);
    });

    doc.autoTable({
      startY: yTable,
      head: [['No', 'Nama Santri', 'Hadir (H)', 'Izin (I)', 'Alfa (A)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], halign: 'center', textColor: 255 },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 15 }, 
        1: { halign: 'left' }, 
        2: { halign: 'center', cellWidth: 25 }, 
        3: { halign: 'center', cellWidth: 25 }, 
        4: { halign: 'center', cellWidth: 25 } 
      },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    });
    doc.save(`Rekap_Absen_Kls_${kelas}_${namaBulan}.pdf`);
  };

  const shareRekapAbsenWA = (bulanTahun, kelas) => {
    const namaBulan = new Date(bulanTahun + "-01").toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    let text = `*Assalamu'alaikum Warahmatullahi Wabarakatuh*\n\n` +
               `*📄 LAPORAN PRESENSI BULANAN SANTRI*\n\n` +
               `🏫 *Kelas* : ${kelas}\n` +
               `🗓️ *Periode* : ${namaBulan}\n` +
               `👨‍🏫 *Pengajar* : ${user?.email || 'Ustaz'}\n` +
               `➖➖➖➖➖➖➖➖➖➖\n\n`;
    
    muridList.filter(m => m.kelas === kelas).forEach((m, index) => {
      const absensMurid = listAbsensi.filter(a => a.murid_id === m.id && a.tanggal.startsWith(bulanTahun));
      const hadir = absensMurid.filter(a => a.status === 'Hadir').length;
      const izin = absensMurid.filter(a => a.status === 'Izin').length;
      const alfa = absensMurid.filter(a => a.status === 'Alfa').length;
      text += `*${index + 1}. ${m.nama}*\n   [ H: ${hadir} | I: ${izin} | A: ${alfa} ]\n\n`;
    });
    
    text += `_Demikian laporan presensi ini kami sampaikan. Terima kasih atas perhatian Bapak/Ibu._\n\n*Wassalamu'alaikum Warahmatullahi Wabarakatuh*`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };

  // 2. REKAP NILAI KELAS
  const exportNilaiKelasPDF = (kelas) => {
    const doc = new jsPDF();
    const yTable = buatHeaderPDF(doc, `REKAPITULASI NILAI AKADEMIK`, [
      `Kelas                  : ${kelas}`,
      `Nama Pengajar  : ${user?.email || 'Ustaz'}`,
      `Tanggal Cetak   : ${new Date().toLocaleDateString('id-ID')}`
    ]);

    const tableData = [];
    muridList.filter(m => m.kelas === kelas).forEach(m => {
      const nilaiMurid = listNilai.filter(n => n.murid_id === m.id);
      if (nilaiMurid.length === 0) {
         tableData.push([m.nama, '-', '-', '-']);
      } else {
         nilaiMurid.forEach((n, idx) => {
            tableData.push([idx === 0 ? m.nama : '', n.pelajaran, n.jenis_ujian, `${n.skor}`]);
         });
      }
    });

    doc.autoTable({
      startY: yTable,
      head: [['Nama Santri', 'Mata Pelajaran', 'Jenis Evaluasi', 'Skor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], halign: 'center' },
      columnStyles: { 0: { fontStyle: 'bold' }, 3: { halign: 'center', fontStyle: 'bold' } },
      styles: { cellPadding: 4 }
    });
    doc.save(`Rekap_Nilai_Kls_${kelas}.pdf`);
  };

  const shareNilaiKelasWA = (kelas) => {
    let text = `*Assalamu'alaikum Warahmatullahi Wabarakatuh*\n\n` +
               `*📊 REKAPITULASI NILAI SANTRI*\n\n` +
               `🏫 *Kelas* : ${kelas}\n` +
               `👨‍🏫 *Pengajar* : ${user?.email || 'Ustaz'}\n` +
               `🗓️ *Tanggal* : ${new Date().toLocaleDateString('id-ID')}\n` +
               `➖➖➖➖➖➖➖➖➖➖\n\n`;
               
    muridList.filter(m => m.kelas === kelas).forEach(m => {
      const nilaiMurid = listNilai.filter(n => n.murid_id === m.id);
      if(nilaiMurid.length > 0) {
        text += `👤 *${m.nama}*\n`;
        nilaiMurid.forEach(n => { text += `   ▪️ ${n.pelajaran} (${n.jenis_ujian}) : *${n.skor}*\n`; });
        text += `\n`;
      }
    });
    
    text += `_Semoga ananda terus berprestasi dan mendapatkan ilmu yang bermanfaat._\n\n*Wassalamu'alaikum Warahmatullahi Wabarakatuh*`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };

  // 3. RAPOR SANTRI INDIVIDU
  const exportRaporPDF = (murid) => {
    const doc = new jsPDF();
    const yTable = buatHeaderPDF(doc, `RAPOR HASIL BELAJAR SANTRI`, [
      `Nama Santri      : ${murid.nama}`,
      `Kelas                  : ${murid.kelas}`,
      `Nama Pengajar  : ${user?.email || 'Ustaz'}`,
      `Tanggal Cetak   : ${new Date().toLocaleDateString('id-ID')}`
    ]);

    const nilais = listNilai.filter(n => n.murid_id === murid.id);
    const tableData = nilais.map((n, index) => [index + 1, n.pelajaran, n.jenis_ujian, `${n.skor}`]);

    doc.autoTable({
      startY: yTable,
      head: [['No', 'Mata Pelajaran', 'Jenis Evaluasi', 'Skor Nilai']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], halign: 'center' },
      columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 3: { halign: 'center', fontStyle: 'bold', cellWidth: 30 } },
      emptyRowContent: 'Belum ada nilai tercatat untuk santri ini.'
    });
    doc.save(`Rapor_${murid.nama.replace(/\s+/g, '_')}.pdf`);
  };

  const shareRaporWA = (murid) => {
    const nilais = listNilai.filter(n => n.murid_id === murid.id);
    let text = `*Assalamu'alaikum Warahmatullahi Wabarakatuh*\n\n` +
               `*🎓 RAPOR HASIL BELAJAR SANTRI*\n\n` +
               `👤 *Nama* : ${murid.nama}\n` +
               `🏫 *Kelas* : ${murid.kelas}\n` +
               `👨‍🏫 *Pengajar* : ${user?.email || 'Ustaz'}\n` +
               `➖➖➖➖➖➖➖➖➖➖\n\n*📝 Rincian Nilai:*\n\n`;
    
    if (nilais.length === 0) text += `_Belum ada nilai tercatat._\n`;
    else nilais.forEach(n => { text += `▪️ ${n.pelajaran} (${n.jenis_ujian}) : *${n.skor}*\n`; });
    
    text += `\n_Demikian rapor ini kami sampaikan. Semoga menjadi pemacu semangat belajar ananda._\n\n*Wassalamu'alaikum Warahmatullahi Wabarakatuh*`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };

  // 4. LEMBAR SOAL UJIAN
  const exportSoalPDF = (soal) => {
    const doc = new jsPDF();
    const yPos = buatHeaderPDF(doc, `LEMBAR SOAL UJIAN`, [
      `Mata Pelajaran : ${soal.pelajaran}`,
      `Kelas                  : ${soal.kelas}`,
      `Batasan Materi : ${soal.batasan || '-'}`,
      `Nama Pengajar  : ${user?.email || 'Ustaz'}`
    ]);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(soal.isi_soal, 180);
    doc.text(splitText, 14, yPos + 5);
    doc.save(`Soal_${soal.pelajaran}_Kls_${soal.kelas}.pdf`);
  };

  const shareSoalWA = (soal) => {
    let text = `*📑 LEMBAR SOAL UJIAN*\n\n` +
               `📚 *Pelajaran* : ${soal.pelajaran}\n` +
               `🏫 *Kelas* : ${soal.kelas}\n` +
               `🔖 *Batasan* : ${soal.batasan || '-'}\n` +
               `👨‍🏫 *Pengajar* : ${user?.email || 'Ustaz'}\n` +
               `➖➖➖➖➖➖➖➖➖➖\n\n*Pertanyaan:*\n${soal.isi_soal}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };
  
  // ==========================
  // CRUD MURID / SANTRI
  // ==========================
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
  
  // ==========================
  // CRUD JADWAL
  // ==========================
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
      const updatedList = listBankSoal.map(s => s.id === formSoal.id ? formSoal : s);
      setListBankSoal(updatedList);
      alert("Soal berhasil diperbarui!");
      if(checkConnection()){
        await supabase.from('bank_soal').update({ pelajaran: formSoal.pelajaran, kelas: formSoal.kelas, batasan: formSoal.batasan, isi_soal: formSoal.isi }).eq('id', formSoal.id);
      }
    } else {
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
  
  // ==========================
  // FUNGSI SIMPAN LAINNYA
  // ==========================
  
  // PEMBARUAN: Simpan Absen dengan fitur Edit/Replace
  const handleSimpanAbsen = async (muridId, status, tanggalKhusus = null, pelajaranKhusus = null) => {
    const tanggalAbsen = tanggalKhusus || absenTanggal || new Date().toISOString().split('T')[0];
    const mapel = pelajaranKhusus || absenPelajaran || '-';
    
    const existingAbsenIndex = listAbsensi.findIndex(a => a.murid_id === muridId && a.tanggal === tanggalAbsen);
    
    if (existingAbsenIndex >= 0) {
      const existingAbsen = listAbsensi[existingAbsenIndex];
      const updatedList = [...listAbsensi];
      updatedList[existingAbsenIndex] = { ...existingAbsen, status, pelajaran: mapel };
      setListAbsensi(updatedList);
      
      if (checkConnection()) {
        await supabase.from('absensi').update({ status, pelajaran: mapel }).eq('id', existingAbsen.id);
      }
    } else {
      const safeLocalId = Math.floor(Math.random() * 10000000);
      const absenBaru = { id: safeLocalId, murid_id: muridId, status, tanggal: tanggalAbsen, pelajaran: mapel, ustadz_email: user?.email };
      setListAbsensi([absenBaru, ...listAbsensi]);
      
      if (checkConnection()) {
        await supabase.from('absensi').insert([{ murid_id: muridId, status, tanggal: tanggalAbsen, pelajaran: mapel, ustadz_email: user?.email }]);
      }
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
            <input type="email" placeholder="Alamat Email" required className="w-full border border-slate-300 rounded-xl py-3 px-4 focus:ring-2 ring-emerald-500 outline-none text-sm" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} />
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
      if (jadwalHari.length) {
        return `☀️ Ahlan Ustaz. Hari ini Anda memiliki jadwal ${jadwalHari[0].pelajaran} di kelas ${jadwalHari[0].kelas} pukul ${jadwalHari[0].jam_mulai} WIB.`;
      }
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
      if (jdwlBesok.length){
        return `📅 Ahlan Ustaz. Besok Anda memiliki jadwal ${jdwlBesok[0].pelajaran} di kelas ${jdwlBesok[0].kelas} pukul ${jdwlBesok[0].jam_mulai} WIB.`;
      }
      return `🌙 Ahlan Ustaz. Besok tidak ada jadwal mengajar rutin.`;
    }
    
    return `✨ Ahlan Ustaz. Semoga kegiatan hari ini dimudahkan Allah.`;
  })();
  
  // Format Hari untuk header Absen
  const hariAbsenDipilih = new Date(absenTanggal).toLocaleDateString('id-ID', { weekday: 'long' });
  
  return (
  <div className="min-h-screen bg-slate-50 font-sans max-w-md mx-auto shadow-2xl relative pb-24 text-slate-800">
  
  {/* HEADER & STATUS APP */}
  <div className="bg-emerald-700 text-white p-5 rounded-b-3xl shadow-md sticky top-0 z-20">
  <div className="flex justify-between items-center mb-3">
  <h1 className="text-xl font-bold tracking-wide"><i className="fa-solid fa-book-open-reader mr-2"></i>Buku Ustaz</h1>
  <button onClick={() => { supabase.auth.signOut(); localStorage.clear(); }} className="text-sm bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg font-bold shadow-sm transition">
  <i className="fa-solid fa-power-off"></i>
  </button>
  </div>
  
  <div className="bg-emerald-800/50 p-3 rounded-xl border border-emerald-600/50 flex items-center shadow-inner">
  <i className="fa-solid fa-clock text-xl text-emerald-200 mr-3"></i>
  <p className="text-sm leading-relaxed text-emerald-50">
  {infoDinamis}
  </p>
  </div>
  
  {isOffline && (
  <div className="mt-3 bg-yellow-500 text-yellow-900 text-xs px-3 py-2 rounded-lg font-bold flex items-center justify-center animate-pulse">
  <i className="fa-solid fa-triangle-exclamation mr-2"></i> Mode Offline: Data disimpan di HP
  </div>
  )}
  </div>
  
  {/* AREA KONTEN UTAMA */}
  <div className="p-4">
  
  {/* ========================================================= */}
  {/* TAB 1: JADWAL (DASHBOARD) */}
  {/* ========================================================= */}
  {activeTab === 'jadwal' && (
  <div className="space-y-6 animate-fade-in">
  {deferredPrompt && (
  <button onClick={handleInstallPWA} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center mb-4 transition">
  <i className="fa-solid fa-download mr-2"></i> Install Aplikasi ke HP
  </button>
  )}
  
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
  <h2 className="text-lg font-bold text-emerald-800 mb-4 border-b border-emerald-100 pb-2">
  <i className="fa-solid fa-calendar-day mr-2"></i> Jadwal Hari Ini ({hariIni})
  </h2>
  {jdwlHariIni.length === 0 ? (
  <p className="text-slate-400 text-sm italic text-center py-4">Tidak ada jadwal KBM hari ini.</p>
  ) : (
  <div className="space-y-3">
  {jdwlHariIni.map((j) => (
  <div key={j.id} className="flex justify-between items-center bg-slate-50 border-l-4 border-emerald-500 p-3 rounded-r-xl shadow-sm">
  <div>
  <div className="font-bold text-slate-700">{j.jam_mulai} WIB</div>
  <div className="text-sm font-semibold text-emerald-700">{j.pelajaran} - <span className="text-slate-500">Kls {j.kelas}</span></div>
  </div>
  </div>
  ))}
  </div>
  )}
  </div>
  
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
  <h2 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">
  <i className="fa-solid fa-calendar-week mr-2 text-slate-400"></i> Jadwal Besok ({besok})
  </h2>
  {jdwlBesok.length === 0 ? (
  <p className="text-slate-400 text-sm italic text-center py-4">Tidak ada jadwal KBM besok.</p>
  ) : (
  <div className="space-y-3">
  {jdwlBesok.map((j) => (
  <div key={j.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
  <div>
  <div className="font-bold text-slate-600">{j.jam_mulai} WIB</div>
  <div className="text-sm font-medium text-slate-600">{j.pelajaran} - Kls {j.kelas}</div>
  </div>
  </div>
  ))}
  </div>
  )}
  </div>
  
  <div className="mt-8">
  <div className="flex justify-between items-center mb-4">
  <h2 className="text-lg font-bold text-emerald-800">Manajemen Semua Jadwal</h2>
  <button onClick={() => {setFormJadwal({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' }); setShowTambahJadwal(!showTambahJadwal);}} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
  {showTambahJadwal ? 'Batal' : '+ Tambah'}
  </button>
  </div>
  
  {showTambahJadwal && (
  <form onSubmit={handleSimpanJadwal} className="bg-white p-5 rounded-2xl shadow-md border border-emerald-200 mb-6 space-y-4">
  <select required className="w-full border border-slate-300 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500" value={formJadwal.hari} onChange={e=>setFormJadwal({...formJadwal, hari: e.target.value})}>
  {namaHariList.map(h => <option key={h} value={h}>{h}</option>)}
  </select>
  <input type="time" required className="w-full border border-slate-300 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500" value={formJadwal.jam_mulai} onChange={e=>setFormJadwal({...formJadwal, jam_mulai: e.target.value})} />
  <input type="text" required placeholder="Kelas (Contoh: 1A)" className="w-full border border-slate-300 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500" value={formJadwal.kelas} onChange={e=>setFormJadwal({...formJadwal, kelas: e.target.value})} />
  <input type="text" required placeholder="Pelajaran (Contoh: Fiqih)" className="w-full border border-slate-300 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500" value={formJadwal.pelajaran} onChange={e=>setFormJadwal({...formJadwal, pelajaran: e.target.value})} />
  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-md">Simpan Jadwal</button>
  </form>
  )}
  
  <div className="grid grid-cols-1 gap-3">
  {listJadwal.map((j) => (
  <div key={j.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
  <div>
  <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md mb-1 inline-block">{j.hari}</span>
  <p className="font-bold text-slate-700">{j.jam_mulai} | {j.pelajaran}</p>
  <p className="text-sm text-slate-500">Kelas {j.kelas}</p>
  </div>
  <div className="flex gap-2">
  <button onClick={() => handleEditJadwal(j)} className="text-blue-500 bg-blue-50 p-2 rounded-lg"><i className="fa-solid fa-pen"></i></button>
  <button onClick={() => handleHapusJadwal(j.id)} className="text-red-500 bg-red-50 p-2 rounded-lg"><i className="fa-solid fa-trash"></i></button>
  </div>
  </div>
  ))}
  </div>
  </div>
  </div>
  )}
  
  {/* ========================================================= */}
  {/* TAB 2: DATA SANTRI */}
  {/* ========================================================= */}
  {activeTab === 'murid' && (
  <div className="space-y-4 animate-fade-in">
  <div className="flex justify-between items-center border-b pb-3 mb-2">
  <h2 className="text-xl font-bold text-emerald-800">Database Santri</h2>
  <button onClick={() => { setFormMurid({id:null, nama:'', kelas:'', alamat:'', domisili:''}); setShowTambahMurid(!showTambahMurid); }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">
  {showTambahMurid ? 'Batal' : '+ Tambah Santri'}
  </button>
  </div>
  
  {showTambahMurid && (
  <form onSubmit={handleSimpanMurid} className="bg-white p-5 rounded-2xl shadow-md border border-emerald-200 space-y-4">
  <input type="text" placeholder="Nama Lengkap Santri" required className="w-full border rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500" value={formMurid.nama} onChange={e=>setFormMurid({...formMurid, nama: e.target.value})} />
  <input type="text" placeholder="Kelas (Contoh: 1A, Ula, Wustho)" required className="w-full border rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500" value={formMurid.kelas} onChange={e=>setFormMurid({...formMurid, kelas: e.target.value})} />
  <input type="text" placeholder="Alamat / Asal Kota" className="w-full border rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500" value={formMurid.alamat} onChange={e=>setFormMurid({...formMurid, alamat: e.target.value})} />
  <select className="w-full border rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500" value={formMurid.domisili} onChange={e=>setFormMurid({...formMurid, domisili: e.target.value})}>
  <option value="">Pilih Asrama (Opsional)</option>
  <option value="Asrama Putra">Asrama Putra</option>
  <option value="Asrama Putri">Asrama Putri</option>
  <option value="Non Asrama (Pulang PP)">Non Asrama (Pulang PP)</option>
  </select>
  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-md">Simpan Data Santri</button>
  </form>
  )}
  
  {listKelasUnik.map(kelas => (
  <div key={kelas} className="mb-6">
  <h3 className="bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-t-xl">Kelas {kelas}</h3>
  <div className="bg-white rounded-b-xl border border-emerald-100 shadow-sm flex flex-col divide-y divide-slate-100">
  {muridList.filter(m => m.kelas === kelas).map((m, idx) => (
  <div key={m.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
  <div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">{idx+1}</div>
  <div>
  <p className="font-bold text-slate-700 text-sm">{m.nama}</p>
  <p className="text-xs text-slate-500">{m.domisili || 'Belum diatur'}</p>
  </div>
  </div>
  <div className="flex gap-2">
  <button onClick={() => handleEditMurid(m)} className="text-blue-500 p-2"><i className="fa-solid fa-pen-to-square"></i></button>
  <button onClick={() => handleHapusMurid(m.id)} className="text-red-500 p-2"><i className="fa-solid fa-trash-can"></i></button>
  </div>
  </div>
  ))}
  </div>
  </div>
  ))}
  {muridList.length === 0 && <p className="text-center text-slate-400 italic mt-10">Belum ada data santri.</p>}
  </div>
  )}
  
  {/* ========================================================= */}
  {/* TAB 3: ABSENSI KELAS (ROMBAK TOTAL) */}
  {/* ========================================================= */}
  {activeTab === 'absen' && (
  <div className="animate-fade-in">
  <h2 className="text-xl font-bold text-emerald-800 mb-4 border-b pb-2">Manajemen Presensi</h2>
  
  {/* Menu Navigasi Absensi */}
  <div className="flex gap-2 mb-6 bg-slate-200 p-1 rounded-xl">
  <button onClick={()=>setAbsenTabMode('harian')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${absenTabMode === 'harian' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}>Presensi Harian</button>
  <button onClick={()=>{setAbsenTabMode('rekap'); setDetailRekapMurid(null);}} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${absenTabMode === 'rekap' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}>Rekap & Export</button>
  </div>
  
  {/* TAB: PRESENSI HARIAN */}
  {absenTabMode === 'harian' && (
  <div className="space-y-4">
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
  <div>
  <label className="text-xs font-bold text-slate-500 mb-1 block">Pilih Kelas</label>
  <select className="w-full border rounded-lg py-2 px-3 text-sm font-bold text-emerald-700" value={absenKelas} onChange={e=>setAbsenKelas(e.target.value)}>
  <option value="">-- Pilih Kelas --</option>
  {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  </div>
  {absenKelas && (
  <div className="flex gap-2 pt-2">
  <div className="flex-1">
  <label className="text-xs font-bold text-slate-500 mb-1 block">Tanggal Absen</label>
  <input type="date" className="w-full border rounded-lg py-2 px-3 text-sm" value={absenTanggal} onChange={e=>setAbsenTanggal(e.target.value)} />
  </div>
  <div className="flex-1">
  <label className="text-xs font-bold text-slate-500 mb-1 block">Mata Pelajaran</label>
  <input type="text" placeholder="Cth: Nahwu" list="pelajaran-list" className="w-full border rounded-lg py-2 px-3 text-sm" value={absenPelajaran} onChange={e=>setAbsenPelajaran(e.target.value)} />
  <datalist id="pelajaran-list">
  {listPelajaranUnik.map(p => <option key={p} value={p} />)}
  </datalist>
  </div>
  </div>
  )}
  </div>
  
  {absenKelas && absenPelajaran ? (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
  <div className="bg-emerald-700 p-4 text-white">
  <div className="text-sm opacity-90 uppercase tracking-wider mb-1">Daftar Hadir Kelas {absenKelas}</div>
  <div className="text-lg font-bold">Hari {hariAbsenDipilih}, {new Date(absenTanggal).toLocaleDateString('id-ID')}</div>
  <div className="text-sm mt-1 bg-emerald-800 inline-block px-3 py-1 rounded-full"><i className="fa-solid fa-book mr-2"></i>Pelajaran: {absenPelajaran}</div>
  </div>
  <div className="divide-y divide-slate-100">
  {muridList.filter(m => m.kelas === absenKelas).map(m => {
  // Cek status absen saat ini (Fitur Edit Live)
  const statusSkrg = listAbsensi.find(a => a.murid_id === m.id && a.tanggal === absenTanggal)?.status || '';
  
  return (
  <div key={m.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition">
  <div className="font-bold text-slate-700 text-sm">{m.nama}</div>
  <div className="flex gap-2 w-full md:w-auto">
  <button onClick={() => handleSimpanAbsen(m.id, 'Hadir')} className={`flex-1 md:w-16 py-1.5 rounded-lg text-sm font-bold border transition ${statusSkrg === 'Hadir' ? 'bg-emerald-500 text-white border-emerald-600 shadow-inner' : 'bg-white text-slate-500 hover:bg-emerald-50 border-slate-300'}`}>Hadir</button>
  <button onClick={() => handleSimpanAbsen(m.id, 'Izin')} className={`flex-1 md:w-16 py-1.5 rounded-lg text-sm font-bold border transition ${statusSkrg === 'Izin' ? 'bg-blue-500 text-white border-blue-600 shadow-inner' : 'bg-white text-slate-500 hover:bg-blue-50 border-slate-300'}`}>Izin</button>
  <button onClick={() => handleSimpanAbsen(m.id, 'Alfa')} className={`flex-1 md:w-16 py-1.5 rounded-lg text-sm font-bold border transition ${statusSkrg === 'Alfa' ? 'bg-red-500 text-white border-red-600 shadow-inner' : 'bg-white text-slate-500 hover:bg-red-50 border-slate-300'}`}>Alfa</button>
  </div>
  </div>
  );
  })}
  </div>
  </div>
  ) : (
  <div className="text-center mt-10 text-slate-400 italic bg-slate-100 p-6 rounded-xl border border-slate-200">
  <i className="fa-solid fa-hand-pointer text-3xl mb-3 block text-slate-300"></i>
  Silakan pilih Kelas, Tanggal, dan Pelajaran terlebih dahulu untuk memunculkan daftar santri.
  </div>
  )}
  </div>
  )}
  
  {/* TAB: REKAP BULANAN & EXPORT */}
  {absenTabMode === 'rekap' && !detailRekapMurid && (
  <div className="space-y-4">
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
  <div className="flex gap-2">
  <div className="flex-1">
  <label className="text-xs font-bold text-slate-500 mb-1 block">Bulan & Tahun</label>
  <input type="month" className="w-full border rounded-lg py-2 px-3 text-sm font-bold text-slate-700" value={rekapBulanTahun} onChange={e=>setRekapBulanTahun(e.target.value)} />
  </div>
  <div className="flex-1">
  <label className="text-xs font-bold text-slate-500 mb-1 block">Pilih Kelas</label>
  <select className="w-full border rounded-lg py-2 px-3 text-sm font-bold text-slate-700" value={rekapKelas} onChange={e=>setRekapKelas(e.target.value)}>
  <option value="">-- Kelas --</option>
  {listKelasUnik.map(k => <option key={k} value={k}>{k}</option>)}
  </select>
  </div>
  </div>
  
  {rekapBulanTahun && rekapKelas && (
  <div className="flex gap-2 pt-2 border-t mt-3">
  <button onClick={()=>exportRekapAbsenPDF(rekapBulanTahun, rekapKelas)} className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg text-sm font-bold border border-red-200 flex items-center justify-center gap-2 hover:bg-red-100 transition">
  <i className="fa-solid fa-file-pdf"></i> Export PDF
  </button>
  <button onClick={()=>shareRekapAbsenWA(rekapBulanTahun, rekapKelas)} className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-bold border border-green-200 flex items-center justify-center gap-2 hover:bg-green-100 transition">
  <i className="fa-brands fa-whatsapp text-lg"></i> Share WA
  </button>
  </div>
  )}
  </div>
  
  {rekapBulanTahun && rekapKelas && (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
  <table className="w-full text-sm text-left">
  <thead className="bg-emerald-600 text-white font-bold border-b">
  <tr>
  <th className="py-3 px-4">Nama Santri</th>
  <th className="py-3 px-2 text-center">H</th>
  <th className="py-3 px-2 text-center">I</th>
  <th className="py-3 px-2 text-center">A</th>
  <th className="py-3 px-2 text-center">Aksi</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-slate-100">
  {muridList.filter(m => m.kelas === rekapKelas).map(m => {
  const absenMurid = listAbsensi.filter(a => a.murid_id === m.id && a.tanggal.startsWith(rekapBulanTahun));
  const hadir = absenMurid.filter(a => a.status === 'Hadir').length;
  const izin = absenMurid.filter(a => a.status === 'Izin').length;
  const alfa = absenMurid.filter(a => a.status === 'Alfa').length;
  
  return (
  <tr key={m.id} className="hover:bg-slate-50 transition">
  <td className="py-3 px-4 font-semibold text-slate-700">{m.nama}</td>
  <td className="py-3 px-2 text-center font-bold text-emerald-600 bg-emerald-50/50">{hadir}</td>
  <td className="py-3 px-2 text-center font-bold text-blue-600 bg-blue-50/50">{izin}</td>
  <td className="py-3 px-2 text-center font-bold text-red-600 bg-red-50/50">{alfa}</td>
  <td className="py-3 px-2 text-center">
  <button onClick={() => setDetailRekapMurid(m)} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 py-1 px-2 rounded font-bold shadow-sm">
  <i className="fa-solid fa-pen-to-square"></i> Edit
  </button>
  </td>
  </tr>
  )
  })}
  </tbody>
  </table>
  </div>
  )}
  </div>
  )}
  
  {/* TAMPILAN EDIT ABSEN DARI DALAM REKAP */}
  {absenTabMode === 'rekap' && detailRekapMurid && (
  <div className="bg-white rounded-xl shadow-md border border-emerald-200 overflow-hidden animate-fade-in">
  <div className="bg-emerald-100 p-4 flex justify-between items-center border-b border-emerald-200">
  <div>
  <h3 className="font-bold text-emerald-800 text-sm">Edit Absen: {detailRekapMurid.nama}</h3>
  <p className="text-xs text-emerald-600 font-semibold">Bulan: {rekapBulanTahun}</p>
  </div>
  <button onClick={() => setDetailRekapMurid(null)} className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-lg shadow-sm font-bold border border-slate-200">Kembali</button>
  </div>
  
  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
  <p className="text-xs text-slate-500 italic mb-2">Pilih tanggal spesifik untuk mengedit status kehadiran di bulan ini.</p>
  {listAbsensi
  .filter(a => a.murid_id === detailRekapMurid.id && a.tanggal.startsWith(rekapBulanTahun))
  .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
  .map(a => (
  <div key={a.id} className="flex flex-col border border-slate-100 p-3 rounded-lg bg-slate-50">
  <div className="flex justify-between items-center mb-2">
  <span className="text-sm font-bold text-slate-700">{new Date(a.tanggal).toLocaleDateString('id-ID')}</span>
  <span className="text-xs text-slate-500">{a.pelajaran}</span>
  </div>
  <div className="flex gap-2">
  <button onClick={() => handleSimpanAbsen(detailRekapMurid.id, 'Hadir', a.tanggal, a.pelajaran)} className={`flex-1 py-1 rounded text-xs font-bold border transition ${a.status === 'Hadir' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500'}`}>Hadir</button>
  <button onClick={() => handleSimpanAbsen(detailRekapMurid.id, 'Izin', a.tanggal, a.pelajaran)} className={`flex-1 py-1 rounded text-xs font-bold border transition ${a.status === 'Izin' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500'}`}>Izin</button>
  <button onClick={() => handleSimpanAbsen(detailRekapMurid.id, 'Alfa', a.tanggal, a.pelajaran)} className={`flex-1 py-1 rounded text-xs font-bold border transition ${a.status === 'Alfa' ? 'bg-red-500 text-white' : 'bg-white text-slate-500'}`}>Alfa</button>
  </div>
  </div>
  ))}
  {listAbsensi.filter(a => a.murid_id === detailRekapMurid.id && a.tanggal.startsWith(rekapBulanTahun)).length === 0 && (
  <div className="text-center text-sm text-slate-400 py-4">Belum ada rekaman absen di bulan ini.</div>
  )}
  </div>
  </div>
  )}
  </div>
  )}
  
  {/* ========================================================= */}
  {/* TAB 4: AKADEMIK / NILAI */}
  {/* ========================================================= */}
  {activeTab === 'nilai' && (
  <div className="animate-fade-in space-y-4">
  <h2 className="text-xl font-bold text-emerald-800 border-b pb-2">Pusat Penilaian & Akademik</h2>
  
  {/* Scrollable Navigasi Nilai */}
  <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
  {['ujian', 'banksoal', 'perilaku', 'hafalan', 'rapor'].map(tab => (
  <button key={tab} onClick={() => setNilaiModeTab(tab)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition ${nilaiModeTab === tab ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-white text-slate-500 border-slate-200'}`}>
  {tab === 'ujian' && 'Input Nilai'}
  {tab === 'banksoal' && 'Bank Soal'}
  {tab === 'perilaku' && 'Perilaku'}
  {tab === 'hafalan' && 'Capaian Hafalan'}
  {tab === 'rapor' && 'E-Rapor'}
  </button>
  ))}
  </div>
  
  {/* Sub-Tab: Ujian */}
  {nilaiModeTab === 'ujian' && (
  <div className="space-y-4 mt-2">
  <select className="w-full border rounded-xl py-3 px-4 font-bold focus:ring-emerald-500" value={nilaiKelas} onChange={e=>{setNilaiKelas(e.target.value); setSelectedMuridNilai(null);}}>
  <option value="">-- Pilih Kelas Untuk Dinilai --</option>
  {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  
  {nilaiKelas && !selectedMuridNilai && (
  <div className="bg-white rounded-xl shadow-sm border">
  <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex justify-between items-center">
  <span className="font-bold text-emerald-800">Pilih Santri Kelas {nilaiKelas}</span>
  <div className="flex gap-2">
  <button onClick={()=>exportNilaiKelasPDF(nilaiKelas)} className="text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"><i className="fa-solid fa-file-pdf"></i> PDF</button>
  <button onClick={()=>shareNilaiKelasWA(nilaiKelas)} className="text-green-600 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"><i className="fa-brands fa-whatsapp"></i> WA</button>
  </div>
  </div>
  <div className="divide-y divide-slate-100">
  {muridList.filter(m=>m.kelas===nilaiKelas).map(m=>(
  <button key={m.id} onClick={()=>setSelectedMuridNilai(m)} className="w-full text-left p-4 hover:bg-emerald-50 flex justify-between items-center group transition">
  <span className="font-semibold text-slate-700">{m.nama}</span>
  <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-emerald-500"></i>
  </button>
  ))}
  </div>
  </div>
  )}
  
  {selectedMuridNilai && (
  <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-md">
  <div className="flex justify-between items-center mb-4">
  <h3 className="font-bold text-emerald-800">Input Nilai: {selectedMuridNilai.nama}</h3>
  <button onClick={()=>setSelectedMuridNilai(null)} className="text-xs bg-slate-200 px-2 py-1 rounded font-bold">Kembali</button>
  </div>
  <form onSubmit={handleSimpanNilaiIndividu} className="space-y-3">
  <input type="text" placeholder="Mata Pelajaran (Cth: Fiqih)" required className="w-full border rounded-xl py-2 px-3 text-sm" value={formNilai.pelajaran} onChange={e=>setFormNilai({...formNilai, pelajaran:e.target.value})} />
  <select className="w-full border rounded-xl py-2 px-3 text-sm" value={formNilai.jenis} onChange={e=>setFormNilai({...formNilai, jenis:e.target.value})}>
  <option value="Ulangan">Ulangan Harian</option>
  <option value="Tugas">Tugas / PR</option>
  <option value="UTS">Ujian Tengah Semester (UTS)</option>
  <option value="UAS">Ujian Akhir Semester (UAS)</option>
  </select>
  <input type="number" placeholder="Skor Nilai (0-100)" required className="w-full border rounded-xl py-2 px-3 text-sm text-center text-lg font-bold text-emerald-700" value={formNilai.skor} onChange={e=>setFormNilai({...formNilai, skor:e.target.value})} />
  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow">Simpan Nilai</button>
  </form>
  </div>
  )}
  </div>
  )}
  
  {/* Sub-Tab: Bank Soal */}
  {nilaiModeTab === 'banksoal' && (
  <div className="space-y-4">
  <div className="flex gap-2">
  <button onClick={()=>setSoalTab('arsip')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${soalTab === 'arsip' ? 'bg-emerald-600 text-white shadow' : 'bg-white text-slate-600 border'}`}>Arsip Soal</button>
  <button onClick={()=>{setFormSoal({id:null, pelajaran:'', kelas:'', batasan:'', isi:''}); setSoalTab('buat');}} className={`flex-1 py-2 rounded-lg text-sm font-bold ${soalTab === 'buat' ? 'bg-emerald-600 text-white shadow' : 'bg-white text-slate-600 border'}`}>+ Buat Soal</button>
  </div>
  
  {soalTab === 'buat' && (
  <form onSubmit={handleSimpanSoal} className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-3">
  <div className="flex gap-2">
  <input type="text" placeholder="Pelajaran" required className="flex-1 border rounded-xl py-2 px-3 text-sm" value={formSoal.pelajaran} onChange={e=>setFormSoal({...formSoal, pelajaran:e.target.value})} />
  <input type="text" placeholder="Kelas" required className="w-24 border rounded-xl py-2 px-3 text-sm" value={formSoal.kelas} onChange={e=>setFormSoal({...formSoal, kelas:e.target.value})} />
  </div>
  <input type="text" placeholder="Batasan Materi (Bab 1 - 3)" className="w-full border rounded-xl py-2 px-3 text-sm" value={formSoal.batasan} onChange={e=>setFormSoal({...formSoal, batasan:e.target.value})} />
  <textarea placeholder="Tulis soal ujian di sini..." required rows="6" className="w-full border rounded-xl py-2 px-3 text-sm" value={formSoal.isi} onChange={e=>setFormSoal({...formSoal, isi:e.target.value})}></textarea>
  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow">Simpan ke Bank Soal</button>
  </form>
  )}
  
  {soalTab === 'arsip' && (
  <div className="space-y-3">
  {listBankSoal.map(s => (
  <div key={s.id} className="bg-white p-4 rounded-xl border shadow-sm">
  <div className="flex justify-between items-start mb-2">
  <div>
  <h4 className="font-bold text-emerald-800">{s.pelajaran} - Kls {s.kelas}</h4>
  <p className="text-xs text-slate-500">Materi: {s.batasan}</p>
  </div>
  <div className="flex gap-1">
  <button onClick={()=>handleEditSoal(s)} className="text-blue-500 p-1"><i className="fa-solid fa-pen"></i></button>
  <button onClick={()=>handleHapusSoal(s.id)} className="text-red-500 p-1"><i className="fa-solid fa-trash"></i></button>
  </div>
  </div>
  <p className="text-sm text-slate-700 line-clamp-2 bg-slate-50 p-2 rounded italic mb-3">{s.isi_soal}</p>
  <div className="flex gap-2">
  <button onClick={()=>exportSoalPDF(s)} className="flex-1 bg-red-50 text-red-700 py-1.5 rounded-lg text-xs font-bold border border-red-100 flex justify-center items-center gap-1 hover:bg-red-100"><i className="fa-solid fa-file-pdf"></i> Cetak PDF</button>
  <button onClick={()=>shareSoalWA(s)} className="flex-1 bg-green-50 text-green-700 py-1.5 rounded-lg text-xs font-bold border border-green-100 flex justify-center items-center gap-1 hover:bg-green-100"><i className="fa-brands fa-whatsapp text-sm"></i> Share WA</button>
  </div>
  </div>
  ))}
  {listBankSoal.length === 0 && <p className="text-center text-slate-400 text-sm mt-5">Bank soal masih kosong.</p>}
  </div>
  )}
  </div>
  )}
  
  {/* Sub-Tab: E-Rapor */}
  {nilaiModeTab === 'rapor' && (
  <div className="space-y-4">
  <select className="w-full border rounded-xl py-3 px-4 font-bold" value={raporKelas} onChange={e=>{setRaporKelas(e.target.value); setSelectedMuridRapor(null);}}>
  <option value="">-- Pilih Kelas --</option>
  {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
  </select>
  
  {raporKelas && !selectedMuridRapor && (
  <div className="bg-white rounded-xl border divide-y shadow-sm">
  {muridList.filter(m=>m.kelas===raporKelas).map(m=>(
  <button key={m.id} onClick={()=>setSelectedMuridRapor(m)} className="w-full text-left p-4 hover:bg-slate-50 font-semibold text-slate-700 flex justify-between transition">
  {m.nama} <i className="fa-solid fa-file-lines text-slate-300"></i>
  </button>
  ))}
  </div>
  )}
  
  {selectedMuridRapor && (
  <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-md">
  <div className="flex justify-between items-center mb-4 border-b pb-2">
  <h3 className="font-bold text-emerald-800">Rapor: {selectedMuridRapor.nama}</h3>
  <button onClick={()=>setSelectedMuridRapor(null)} className="text-xs bg-slate-200 px-2 py-1 rounded font-bold">Tutup</button>
  </div>
  
  <div className="space-y-2 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
  {listNilai.filter(n=>n.murid_id===selectedMuridRapor.id).map(n=>(
  <div key={n.id} className="flex justify-between text-sm border-b border-slate-200 last:border-0 pb-1 last:pb-0">
  <span className="text-slate-600">{n.pelajaran} <span className="text-xs text-slate-400">({n.jenis_ujian})</span></span>
  <span className="font-bold text-emerald-700">{n.skor}</span>
  </div>
  ))}
  {listNilai.filter(n=>n.murid_id===selectedMuridRapor.id).length === 0 && <p className="text-center text-sm text-slate-400 italic">Belum ada nilai tercatat.</p>}
  </div>
  
  <div className="flex gap-2">
  <button onClick={()=>exportRaporPDF(selectedMuridRapor)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-bold flex justify-center items-center gap-2 shadow-sm transition"><i className="fa-solid fa-file-pdf"></i> Unduh PDF</button>
  <button onClick={()=>shareRaporWA(selectedMuridRapor)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-bold flex justify-center items-center gap-2 shadow-sm transition"><i className="fa-brands fa-whatsapp text-lg"></i> Kirim WA</button>
  </div>
  </div>
  )}
  </div>
  )}
  
  {/* Sub-Tab: Perilaku & Hafalan (Kode Ringkas) */}
  {(nilaiModeTab === 'perilaku' || nilaiModeTab === 'hafalan') && (
  <div className="p-5 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
  <i className="fa-solid fa-person-chalkboard text-4xl text-slate-300 mb-3 block"></i>
  <p className="text-slate-500 text-sm">Fitur {nilaiModeTab} sedang dalam mode ringkas. Navigasi tetap sama seperti versi sebelumnya.</p>
  </div>
  )}
  </div>
  )}
  
  {/* ========================================================= */}
  {/* TAB 5: BUKU SAKU */}
  {/* ========================================================= */}
  {activeTab === 'bukusaku' && (
  <div className="animate-fade-in space-y-4">
  <h2 className="text-xl font-bold text-emerald-800 border-b pb-2">Buku Saku Ustaz</h2>
  
  <div className="flex bg-slate-200 p-1 rounded-xl">
  <button onClick={()=>setBukuSakuTab('batas')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${bukuSakuTab==='batas'?'bg-white text-emerald-700 shadow':'text-slate-500'}`}>Batas Mengajar</button>
  <button onClick={()=>setBukuSakuTab('tagihan')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${bukuSakuTab==='tagihan'?'bg-white text-emerald-700 shadow':'text-slate-500'}`}>Tagihan Santri</button>
  </div>
  
  {bukuSakuTab === 'batas' && (
  <div className="space-y-4">
  <form onSubmit={handleSimpanSakuBatas} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
  <h3 className="font-bold text-slate-700 text-sm border-b pb-1">Tulis Batas Materi Hari Ini</h3>
  <div className="flex gap-2">
  <input type="text" placeholder="Kelas" required className="w-1/3 border rounded-lg py-2 px-3 text-sm" value={formSakuBatas.kelas} onChange={e=>setFormSakuBatas({...formSakuBatas,kelas:e.target.value})} />
  <input type="text" placeholder="Pelajaran / Kitab" required className="w-2/3 border rounded-lg py-2 px-3 text-sm" value={formSakuBatas.fan} onChange={e=>setFormSakuBatas({...formSakuBatas,fan:e.target.value})} />
  </div>
  <input type="text" placeholder="Batas Materi / Bab" className="w-full border rounded-lg py-2 px-3 text-sm" value={formSakuBatas.materi} onChange={e=>setFormSakuBatas({...formSakuBatas,materi:e.target.value})} />
  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg text-sm shadow-sm">Simpan Catatan</button>
  </form>
  
  <div className="space-y-3">
  {listSakuBatas.map(b => (
  <div key={b.id} className="bg-white p-3 rounded-xl border shadow-sm border-l-4 border-l-emerald-500">
  <div className="flex justify-between mb-1">
  <span className="font-bold text-sm text-slate-700">{b.fan} (Kls {b.kelas})</span>
  <span className="text-xs text-slate-400">{new Date(b.created_at).toLocaleDateString('id-ID')}</span>
  </div>
  <p className="text-sm text-slate-600">Batas: {b.materi}</p>
  </div>
  ))}
  </div>
  </div>
  )}
  
  {bukuSakuTab === 'tagihan' && (
  <div className="space-y-4">
  {tagihanHariIni.length > 0 && (
  <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
  <h3 className="font-bold text-red-700 text-sm mb-2"><i className="fa-solid fa-bell mr-1"></i> Tagihan Hari Ini</h3>
  {tagihanHariIni.map(t => (
  <div key={t.id} className="text-sm text-red-600 bg-white p-2 rounded border border-red-100 mb-1">
  Setoran {t.kitab} Kls {t.kelas} ({t.target_dari} - {t.target_sampai})
  </div>
  ))}
  </div>
  )}
  
  <form onSubmit={handleSimpanSakuTagihan} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
  <h3 className="font-bold text-slate-700 text-sm border-b pb-1">Buat Tagihan / PR Baru</h3>
  <input type="date" required className="w-full border rounded-lg py-2 px-3 text-sm" value={formSakuTagihan.tanggal} onChange={e=>setFormSakuTagihan({...formSakuTagihan,tanggal:e.target.value})} />
  <div className="flex gap-2">
  <input type="text" placeholder="Kelas" required className="w-1/3 border rounded-lg py-2 px-3 text-sm" value={formSakuTagihan.kelas} onChange={e=>setFormSakuTagihan({...formSakuTagihan,kelas:e.target.value})} />
  <input type="text" placeholder="Kitab / Tugas" required className="w-2/3 border rounded-lg py-2 px-3 text-sm" value={formSakuTagihan.kitab} onChange={e=>setFormSakuTagihan({...formSakuTagihan,kitab:e.target.value})} />
  </div>
  <input type="text" placeholder="Target / Halaman" className="w-full border rounded-lg py-2 px-3 text-sm" value={formSakuTagihan.target_dari} onChange={e=>setFormSakuTagihan({...formSakuTagihan,target_dari:e.target.value})} />
  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg text-sm shadow-sm">Simpan Tagihan</button>
  </form>
  </div>
  )}
  </div>
  )}
  
  </div>
  
  {/* ========================================================= */}
  {/* BOTTOM NAVIGATION (NAVBAR BAWAH) */}
  {/* ========================================================= */}
  <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 flex justify-around p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 rounded-t-2xl">
  <button onClick={() => setActiveTab('jadwal')} className={`flex flex-col items-center transition ${activeTab === 'jadwal' ? 'text-emerald-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
  <i className="fa-solid fa-house text-xl mb-1"></i>
  <span className="text-[10px] font-bold">Jadwal</span>
  </button>
  <button onClick={() => setActiveTab('murid')} className={`flex flex-col items-center transition ${activeTab === 'murid' ? 'text-emerald-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
  <i className="fa-solid fa-users text-xl mb-1"></i>
  <span className="text-[10px] font-bold">Santri</span>
  </button>
  <button onClick={() => setActiveTab('absen')} className={`flex flex-col items-center transition ${activeTab === 'absen' ? 'text-emerald-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
  <div className={`p-3 rounded-full -mt-8 shadow-lg border-4 border-white text-white transition-colors ${activeTab==='absen' ? 'bg-emerald-600' : 'bg-slate-400'}`}>
  <i className="fa-solid fa-clipboard-user text-2xl"></i>
  </div>
  <span className="text-[10px] font-bold mt-1 text-slate-700">Presensi</span>
  </button>
  <button onClick={() => setActiveTab('nilai')} className={`flex flex-col items-center transition ${activeTab === 'nilai' ? 'text-emerald-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
  <i className="fa-solid fa-award text-xl mb-1"></i>
  <span className="text-[10px] font-bold">Akademik</span>
  </button>
  <button onClick={() => setActiveTab('bukusaku')} className={`flex flex-col items-center transition ${activeTab === 'bukusaku' ? 'text-emerald-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
  <i className="fa-solid fa-book-bookmark text-xl mb-1"></i>
  <span className="text-[10px] font-bold">Saku</span>
  </button>
  </div>
  
  </div>
  );
  }