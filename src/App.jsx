import React, { useState, useEffect } from 'react';
import { getSession, subscribeAuth, signOut } from './lib/supabase';
import { syncAllDataFromCloud, insertJadwal, deleteJadwal, insertAbsensiBatch, deleteAbsensiByDateAndMurids, insertPerilaku, deletePerilaku, insertNilai, insertSakuBatas, deleteSakuBatas, insertSakuTagihan, deleteSakuTagihan, insertCapaian, deleteCapaian, insertMurid, updateMurid, deleteMurid } from './lib/api';
import AuthScreen from './components/AuthScreen';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import JadwalTab from './components/tabs/JadwalTab';
import AbsensiTab from './components/tabs/AbsensiTab';
import BukuSakuTab from './components/tabs/BukuSakuTab';
import HafalanTab from './components/tabs/HafalanTab';
import PerilakuTab from './components/tabs/PerilakuTab';
import NilaiTab from './components/tabs/NilaiTab';
import SoalTab from './components/tabs/SoalTab';
import MuridTab from './components/tabs/MuridTab';
import JadwalModal from './components/modals/JadwalModal';

export default function App() {
  // --- CORE & AUTH STATE ---
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('jadwal');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // --- DATABASE DATA STATE ---
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

  // --- MODAL STATE ---
  const [showTambahJadwal, setShowTambahJadwal] = useState(false);
  const [formJadwal, setFormJadwal] = useState({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });

  // --- SYSTEM EFFECTS ---
  useEffect(() => {
    getSession().then(setUser);
    const { data: { subscription } } = subscribeAuth(setUser);

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

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
    if (user && !isOffline) syncData();
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

  // --- FUNCTIONS ---
  const syncData = async () => {
    setLoading(true);
    const data = await syncAllDataFromCloud();
    if (data) {
      setMuridList(data.murid);
      setListAbsensi(data.absensi);
      setListBatas(data.batas);
      setListPerilaku(data.perilaku);
      setListNilai(data.nilai);
      setListBankSoal(data.soal);
      setListJadwal(data.jadwal);
      setListSakuBatas(data.sakuBatas);
      setListSakuTagihan(data.sakuTagihan);
      setListCapaian(data.capaian);
    }
    setLoading(false);
  };

  const checkConnection = () => {
    if (isOffline) {
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

  const handleLogout = async () => {
    if (!window.confirm("Apakah Anda yakin ingin keluar dari aplikasi?")) return;
    setLoading(true);
    await signOut();
    setLoading(false);
  };

  // --- JADWAL HANDLERS ---
  const handleTambahJadwal = () => {
    setFormJadwal({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
    setShowTambahJadwal(true);
  };

  const handleSimpanJadwal = async (data) => {
    const safeLocalId = Math.floor(Math.random() * 10000000);
    const newJadwal = { ...data, id: safeLocalId, ustadz_email: user?.email, created_at: new Date().toISOString() };
    setListJadwal([...listJadwal, newJadwal]);
    setShowTambahJadwal(false);
    alert("Jadwal ditambahkan!");
    if (checkConnection()) {
      await insertJadwal(newJadwal);
    }
  };

  const handleHapusJadwal = async (id) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;
    setListJadwal(listJadwal.filter(j => j.id !== id));
    if (checkConnection()) {
      await deleteJadwal(id);
    }
  };

  // --- RENDER ---
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 md:pb-0 md:pl-64 flex flex-col">
      <Header
        user={user}
        isOffline={isOffline}
        loading={loading}
        onSync={syncData}
        onLogout={handleLogout}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        deferredPrompt={deferredPrompt}
        onInstall={handleInstallPWA}
        onLogout={handleLogout}
      />

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
        {activeTab === 'jadwal' && (
          <JadwalTab
            listJadwal={listJadwal}
            onTambah={handleTambahJadwal}
            onHapus={handleHapusJadwal}
          />
        )}

        {activeTab === 'absensi' && (
          <AbsensiTab
            muridList={muridList}
            listAbsensi={listAbsensi}
            setListAbsensi={setListAbsensi}
            user={user}
            checkConnection={checkConnection}
            insertAbsensiBatch={insertAbsensiBatch}
            deleteAbsensiByDateAndMurids={deleteAbsensiByDateAndMurids}
          />
        )}

        {activeTab === 'bukusaku' && (
          <BukuSakuTab
            muridList={muridList}
            listSakuBatas={listSakuBatas}
            listSakuTagihan={listSakuTagihan}
            setListSakuBatas={setListSakuBatas}
            setListSakuTagihan={setListSakuTagihan}
            user={user}
            checkConnection={checkConnection}
            insertSakuBatas={insertSakuBatas}
            deleteSakuBatas={deleteSakuBatas}
            insertSakuTagihan={insertSakuTagihan}
            deleteSakuTagihan={deleteSakuTagihan}
          />
        )}

        {activeTab === 'hafalan' && (
          <HafalanTab
            muridList={muridList}
            listCapaian={listCapaian}
            setListCapaian={setListCapaian}
            user={user}
            checkConnection={checkConnection}
            insertCapaian={insertCapaian}
            deleteCapaian={deleteCapaian}
          />
        )}

        {activeTab === 'perilaku' && (
          <PerilakuTab
            muridList={muridList}
            listPerilaku={listPerilaku}
            setListPerilaku={setListPerilaku}
            user={user}
            checkConnection={checkConnection}
            insertPerilaku={insertPerilaku}
            deletePerilaku={deletePerilaku}
          />
        )}

        {activeTab === 'nilai' && (
          <NilaiTab
            muridList={muridList}
            listNilai={listNilai}
            setListNilai={setListNilai}
            user={user}
            checkConnection={checkConnection}
            insertNilai={insertNilai}
          />
        )}

        {activeTab === 'soal' && (
          <SoalTab
            listBankSoal={listBankSoal}
            setListBankSoal={setListBankSoal}
            user={user}
            checkConnection={checkConnection}
          />
        )}

        {activeTab === 'murid' && (
          <MuridTab
            muridList={muridList}
            setMuridList={setMuridList}
            user={user}
            checkConnection={checkConnection}
            insertMurid={insertMurid}
            updateMurid={updateMurid}
            deleteMurid={deleteMurid}
          />
        )}
      </main>

      <JadwalModal
        show={showTambahJadwal}
        onClose={() => setShowTambahJadwal(false)}
        onSave={handleSimpanJadwal}
        formJadwal={formJadwal}
        setFormJadwal={setFormJadwal}
      />
    </div>
  );
}
