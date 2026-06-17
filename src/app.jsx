import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gjfdxqhwwytcgylokksq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); 
  const [activeTab, setActiveTab] = useState('database');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Perubahan kunci: variabel state disesuaikan
  const [muridList, setMuridList] = useState([]);
  const [listAbsensi, setListAbsensi] = useState([]);
  const [listBatas, setListBatas] = useState([]);
  const [listPerilaku, setListPerilaku] = useState([]);
  const [listNilai, setListNilai] = useState([]);
  const [listBankSoal, setListBankSoal] = useState([]);

  const [viewProfilStage, setViewProfilStage] = useState('kelas');
  const [selectedKelasProfil, setSelectedKelasProfil] = useState(null);
  const [selectedMuridProfil, setSelectedMuridProfil] = useState(null);

  // Form disesuaikan
  const [formMurid, setFormMurid] = useState({ nama: '', kelas: '', alamat: '', domisili: '' });
  const [formBatas, setFormBatas] = useState({ fan: '', batas: '' });
  const [formPerilaku, setFormPerilaku] = useState({ murid_id: '', catatan: '' });
  const [formNilai, setFormNilai] = useState({ murid_id: '', jenis_ujian: 'Ulangan', pelajaran: '', skor: '' });
  const [formSoal, setFormSoal] = useState({ pelajaran: '', kelas: '', batasan: '', isi: '' });

  const [filterKelasAbsen, setFilterKelasAbsen] = useState('Semua');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    
    // Sinkronisasi data dari tabel 'murid'
    const syncData = async () => {
      if (user && !isOffline) {
        setLoading(true);
        const { data: m } = await supabase.from('murid').select('*').order('nama', { ascending: true });
        const { data: a } = await supabase.from('absensi').select('*');
        const { data: b } = await supabase.from('batas_mengajar').select('*');
        const { data: p } = await supabase.from('catatan_perilaku').select('*');
        const { data: n } = await supabase.from('nilai').select('*');
        const { data: bs } = await supabase.from('bank_soal').select('*');

        if (m) setMuridList(m);
        if (a) setListAbsensi(a);
        if (b) setListBatas(b);
        if (p) setListPerilaku(p);
        if (n) setListNilai(n);
        if (bs) setListBankSoal(bs);
        setLoading(false);
      }
    };
    syncData();

    return () => subscription.unsubscribe();
  }, [user]);

  const handleSimpanMurid = async (e) => {
    e.preventDefault();
    if (!formMurid.nama || !formMurid.kelas) return alert("Nama dan Kelas wajib diisi!");
    
    setLoading(true);
    const { error } = await supabase.from('murid').insert([{ ...formMurid, ustadz_email: user?.email }]);
    if (error) alert("Gagal menyimpan: " + error.message);
    else {
      setFormMurid({ nama: '', kelas: '', alamat: '', domisili: '' });
      window.location.reload(); // Refresh untuk ambil data baru
    }
    setLoading(false);
  };

  // ... (Fungsi lainnya seperti handleSimpanAbsen, Nilai, dsb disesuaikan from('murid'))
  // Pastikan setiap supabase.from('santri') diubah menjadi supabase.from('murid')

  return (
    /* Tampilan Anda tetap sama, pastikan map data menggunakan muridList */
    // ... sisa kode UI Anda
  );
}