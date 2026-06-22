// File: src/tabs/JadwalTab.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function JadwalTab({ listJadwal, setListJadwal, user, isOffline }) {
  const [showTambahJadwal, setShowTambahJadwal] = useState(false);
  const [formJadwal, setFormJadwal] = useState({ id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: '' });
  const [now, setNow] = useState(new Date());

  // Update jam setiap menit untuk fitur "Smart Info"
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const namaHariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hariIni = namaHariList[now.getDay()];
  
  const checkConnection = () => {
    if (isOffline) {
      alert("Aplikasi offline! Data hanya disimpan di HP sementara waktu.");
      return false;
    }
    return true;
  };

  // === FUNGSI CRUD JADWAL ===
  const handleSimpanJadwal = async (e) => {
    e.preventDefault();
    if(!formJadwal.jam_mulai || !formJadwal.kelas || !formJadwal.pelajaran) return alert("Lengkapi form jadwal!");
    
    if (formJadwal.id) {
      // Mode Edit
      const updatedList = listJadwal.map(j => j.id === formJadwal.id ? formJadwal : j);
      setListJadwal(updatedList);
      alert("Jadwal diperbarui!");
      if(checkConnection()){
        await supabase.from('jadwal_mengajar')
          .update({ hari: formJadwal.hari, jam_mulai: formJadwal.jam_mulai, kelas: formJadwal.kelas, pelajaran: formJadwal.pelajaran })
          .eq('id', formJadwal.id);
      }
    } else {
      // Mode Tambah Baru
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

  // === LOGIKA SMART INFO ===
  const jdwlHariIni = listJadwal.filter(j => j.hari === hariIni).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
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
    
    for (let i=0; i<jadwalHari.length; i++){
      const sekarang = jadwalHari[i];
      const mulai = toMinute(sekarang.jam_mulai);
      const selesai = mulai + 60; // Asumsi 1 jam KBM
      
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

  // === RENDER TAMPILAN ===
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Smart Info Card */}
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
              <span>📚 {jdwlHariIni.length} Jadwal Hari Ini</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Jadwal */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h3 className="font-bold text-slate-800 text-xs uppercase text-emerald-600">Jadwal Mengajar Mingguan</h3>
          <button 
            onClick={() => {setShowTambahJadwal(!showTambahJadwal); setFormJadwal({id: null, hari: 'Senin', jam_mulai: '', kelas: '', pelajaran: ''})}} 
            className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold"
          >
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

      {/* Form Tambah/Edit Jadwal */}
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
  );
}
