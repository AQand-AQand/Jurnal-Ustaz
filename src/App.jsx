// File: src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Import Seluruh Komponen Tab Hasil Refactoring Sempurna
import JadwalTab from './tabs/JadwalTab';
import RaporTab from './tabs/RaporTab';
import AbsenTab from './tabs/AbsenTab';
import SakuTab from './tabs/SakuTab';
import PerilakuTab from './tabs/PerilakuTab';
import NilaiTab from './tabs/NilaiTab';
import SoalTab from './tabs/SoalTab'; // Komponen Terakhir Tahap 9

export default function App() {
  const [user, setUser] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('jadwal');

  // === STATE DATA UTAMA (GLOBAL STATE) ===
  const [listJadwal, setListJadwal] = useState([]);
  const [muridList, setMuridList] = useState([]);
  const [listAbsensi, setListAbsensi] = useState([]);
  const [listBatas, setListBatas] = useState([]);
  const [listPerilaku, setListPerilaku] = useState([]);
  const [listNilai, setListNilai] = useState([]);
  const [listSoal, setListSoal] = useState([]); // State Tabungan Bank Soal

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    
    // Ambil data LocalStorage HP saat awal aplikasi terbuka (Offline First)
    const savedJadwal = localStorage.getItem('off_jadwal');
    const savedMurid = localStorage.getItem('off_murid');
    const savedAbsen = localStorage.getItem('off_absen');
    const savedBatas = localStorage.getItem('off_batas');
    const savedPerilaku = localStorage.getItem('off_perilaku');
    const savedNilai = localStorage.getItem('off_nilai');
    const savedSoal = localStorage.getItem('off_soal'); // Cache Soal

    if (savedJadwal) setListJadwal(JSON.parse(savedJadwal));
    if (savedMurid) setMuridList(JSON.parse(savedMurid));
    if (savedAbsen) setListAbsensi(JSON.parse(savedAbsen));
    if (savedBatas) setListBatas(JSON.parse(savedBatas));
    if (savedPerilaku) setListPerilaku(JSON.parse(savedPerilaku));
    if (savedNilai) setListNilai(JSON.parse(savedNilai));
    if (savedSoal) setListSoal(JSON.parse(savedSoal));

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sinkronisasi Cache Otomatis ke Local Storage HP ketika data state berubah
  useEffect(() => {
    if (listJadwal.length > 0) localStorage.setItem('off_jadwal', JSON.stringify(listJadwal));
  }, [listJadwal]);

  useEffect(() => {
    if (muridList.length > 0) localStorage.setItem('off_murid', JSON.stringify(muridList));
  }, [muridList]);

  useEffect(() => {
    if (listAbsensi.length > 0) localStorage.setItem('off_absen', JSON.stringify(listAbsensi));
  }, [listAbsensi]);

  useEffect(() => {
    if (listBatas.length > 0) localStorage.setItem('off_batas', JSON.stringify(listBatas));
  }, [listBatas]);

  useEffect(() => {
    if (listPerilaku.length > 0) localStorage.setItem('off_perilaku', JSON.stringify(listPerilaku));
  }, [listPerilaku]);

  useEffect(() => {
    if (listNilai.length > 0) localStorage.setItem('off_nilai', JSON.stringify(listNilai));
  }, [listNilai]);

  useEffect(() => {
    if (listSoal.length > 0) localStorage.setItem('off_soal', JSON.stringify(listSoal));
  }, [listSoal]);

  // === FUNGSI UTAMA: TARIK DATA DARI SUPABASE CLOUD ===
  const handleSyncData = async () => {
    if (isOffline) return alert("Gagal Sinkron! HP Anda sedang tidak ada internet.");
    setLoading(true);
    try {
      // 1. Tarik Data Jadwal
      const { data: jdwl } = await supabase.from('jadwal_mengajar').select('*');
      if (jdwl) setListJadwal(jdwl);

      // 2. Tarik Data Santri/Murid
      const { data: mrd } = await supabase.from('murid').select('*');
      if (mrd) setMuridList(mrd);

      // 3. Tarik Data Absensi
      const { data: abs } = await supabase.from('absensi').select('*');
      if (abs) setListAbsensi(abs);

      // 4. Tarik Data Batas Buku Saku
      const { data: bts } = await supabase.from('batas_saku').select('*');
      if (bts) setListBatas(bts);

      // 5. Tarik Data Jurnal Perilaku
      const { data: prlk } = await supabase.from('catatan_perilaku').select('*');
      if (prlk) setListPerilaku(prlk);

      // 6. Tarik Data Rekap Nilai Akademik
      const { data: nli } = await supabase.from('nilai_ujian').select('*');
      if (nli) setListNilai(nli);

      // 7. Tarik Data Bank Soal Ujian
      const { data: sol } = await supabase.from('bank_soal').select('*');
      if (sol) setListSoal(sol);

      alert("Sinkronisasi database berhasil!");
    } catch (err) {
      console.log("Sinkron cloud bermasalah:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync data cloud ketika pertama kali masuk aplikasi dan dalam kondisi online
  useEffect(() => {
    if (user && !isOffline) {
      handleSyncData();
    }
  }, [user, isOffline]);

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200 overflow-hidden relative">
      <Header isOffline={isOffline} loading={loading} onSync={handleSyncData} />
      
      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-24">
        
        {/* TAB 1: JADWAL */}
        {activeTab === 'jadwal' && (
          <JadwalTab 
            listJadwal={listJadwal} 
            setListJadwal={setListJadwal} 
            user={user} 
            isOffline={isOffline} 
          />
        )}

        {/* TAB 2: SANTRI / RAPOR */}
        {activeTab === 'rapor' && (
          <RaporTab 
            muridList={muridList}
            setMuridList={setMuridList}
            user={user}
            isOffline={isOffline}
          />
        )}
        
        {/* TAB 3: ABSEN */}
        {activeTab === 'absen' && (
  <AbsenTab 
    muridList={muridList} 
    listAbsensi={listAbsensi} 
    setListAbsensi={setListAbsensi} 
    user={user} 
    checkConnection={checkConnection}
  />
)}

        {/* TAB 4: BUKU SAKU */}
        {activeTab === 'saku' && (
          <SakuTab 
            listBatas={listBatas}
            setListBatas={setListBatas}
            muridList={muridList}
            user={user}
            isOffline={isOffline}
          />
        )}

        {/* TAB 5: CATATAN PERILAKU / AKHLAK */}
        {activeTab === 'perilaku' && (
          <PerilakuTab 
            listPerilaku={listPerilaku}
            setListPerilaku={setListPerilaku}
            muridList={muridList}
            user={user}
            isOffline={isOffline}
          />
        )}

        {/* TAB 6: INPUT DATA NILAI */}
        {activeTab === 'nilai' && (
          <NilaiTab 
            listNilai={listNilai}
            setListNilai={setListNilai}
            muridList={muridList}
            listJadwal={listJadwal}
            user={user}
            isOffline={isOffline}
          />
        )}

        {/* TAB 7: BANK SOAL UJIAN (PERBAIKAN TOTAL SELESAI) */}
        {activeTab === 'soal' && (
          <SoalTab 
            listSoal={listSoal}
            setListSoal={setListSoal}
            listJadwal={listJadwal}
            user={user}
            isOffline={isOffline}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={(tabId) => setActiveTab(tabId)} />
    </div>
  );
}
