// File: src/tabs/AbsenTab.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AbsenTab({ listAbsensi, setListAbsensi, muridList, listJadwal, user, isOffline }) {
  // === STATE INTERNAL ABSEN ===
  const [subTabAbsen, setSubTabAbsen] = useState('input');
  const [tempAbsen, setTempAbsen] = useState({}); // Menyimpan klik sementara sebelum tombol simpan ditekan
  const [absenTanggal, setAbsenTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [absenKelas, setAbsenKelas] = useState('');
  const [absenPelajaran, setAbsenPelajaran] = useState('');
  
  const [rekapBulan, setRekapBulan] = useState('');
  const [rekapKelas, setRekapKelas] = useState('');

  // Sinkronisasi data unik untuk Dropdown Opsi
  const listKelasUnik = [...new Set(muridList.map(m => m.kelas))].filter(Boolean).sort();
  const listPelajaranUnik = [...new Set(listJadwal.map(j => j.pelajaran))].filter(Boolean).sort();

  const getBulanTahunLabel = (yyyy_mm) => {
    if (!yyyy_mm) return '';
    const [year, month] = yyyy_mm.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const checkConnection = () => {
    if (isOffline) {
      alert("Aplikasi offline! Perubahan disimpan di HP sementara waktu.");
      return false;
    }
    return true;
  };

  // === FUNGSI LOGIKA 1: SIMPAN & EDIT ABSEN BULK ===
  const handleSimpanAbsenBulk = async () => {
    if (!absenKelas || !absenTanggal || !absenPelajaran) {
      return alert("Pilih Tanggal, Kelas, dan Pelajaran terlebih dahulu!");
    }

    const muridDiKelas = muridList.filter(m => m.kelas === absenKelas);
    if (muridDiKelas.length === 0) return alert("Tidak ada santri di kelas ini!");

    const dataToSave = [];

    muridDiKelas.forEach(m => {
      // Fitur Deteksi Otomatis (Edit Mode): Cek apakah tanggal & pelajaran ini sudah pernah diinput
      const existing = listAbsensi.find(a => a.murid_id === m.id && a.tanggal === absenTanggal && a.pelajaran === absenPelajaran);
      
      // Ambil status pilihan terbaru, jika tidak ada klik baru gunakan data lama, jika kosong default ke 'Hadir'
      const status = tempAbsen[m.id] || (existing ? existing.status : 'Hadir');
      const safeId = existing ? existing.id : Math.floor(Math.random() * 10000000);

      dataToSave.push({
        id: safeId,
        murid_id: m.id,
        status: status,
        tanggal: absenTanggal,
        pelajaran: absenPelajaran,
        ustadz_email: user?.email
      });
    });

    // Bersihkan data lama di lokal yang koordinatnya sama agar tidak duplikat
    const filteredOld = listAbsensi.filter(a => {
      const isSameMurid = muridDiKelas.some(m => m.id === a.murid_id);
      const isSameDateAndPel = a.tanggal === absenTanggal && a.pelajaran === absenPelajaran;
      return !(isSameMurid && isSameDateAndPel);
    });

    // Gabungkan data baru ke state lokal
    const updatedAbsensi = [...dataToSave, ...filteredOld];
    setListAbsensi(updatedAbsensi);
    alert("Data absensi berhasil disimpan!");
    setTempAbsen({}); // Reset click temporary

    // Sinkronisasi ke Supabase Cloud jika Online
    if (checkConnection()) {
      try {
        const muridIds = muridDiKelas.map(m => m.id);
        // Hapus koordinat data lama di cloud, lalu timpa dengan insert bulk baru (Metode Upsert Aman)
        await supabase.from('absensi').delete()
          .in('murid_id', muridIds).eq('tanggal', absenTanggal).eq('pelajaran', absenPelajaran);
        await supabase.from('absensi').insert(dataToSave);
      } catch (err) {
        console.error("Gagal sinkron cloud:", err);
      }
    }
  };

  // === FUNGSI LOGIKA 2: EXPORT REKAP PDF ===
  const exportAbsenPDF = (bulanValue, kelas) => {
    if (!bulanValue || !kelas) return alert("Pilih bulan dan kelas terlebih dahulu!");
    const labelBulan = getBulanTahunLabel(bulanValue);
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Arsip Presensi Murid - Kelas ${kelas}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Periode Bulan: ${labelBulan}`, 14, 28);
    doc.text(`Nama Pengajar: ${user?.email || 'Ustadz'}`, 14, 34);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 40);
    
    const muridDiKelas = muridList.filter(m => m.kelas === kelas);
    const tableData = [];
    
    muridDiKelas.forEach(m => {
      const absensMurid = listAbsensi.filter(a => a.murid_id === m.id && a.tanggal && a.tanggal.startsWith(bulanValue));
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
    doc.save(`Presensi_Kelas_${kelas}_${labelBulan}.pdf`);
  };
  
  // === FUNGSI LOGIKA 3: BAGIKAN REKAP WA ===
  const shareAbsenWA = (bulanValue, kelas) => {
    if (!bulanValue || !kelas) return alert("Pilih bulan dan kelas terlebih dahulu!");
    const labelBulan = getBulanTahunLabel(bulanValue);
    let text = `*ARSIP PRESENSI KELAS ${kelas}*\n📅 *Bulan:* ${labelBulan}\n👨‍🏫 *Pengajar:* ${user?.email || 'Ustadz'}\n\n`;
    
    const muridDiKelas = muridList.filter(m => m.kelas === kelas);
    muridDiKelas.forEach(m => {
      const absensMurid = listAbsensi.filter(a => a.murid_id === m.id && a.tanggal && a.tanggal.startsWith(bulanValue));
      const hadir = absensMurid.filter(a => a.status === 'Hadir' || a.status === 'H').length;
      const izin = absensMurid.filter(a => a.status === 'Izin' || a.status === 'I').length;
      const alfa = absensMurid.filter(a => a.status === 'Alfa' || a.status === 'A').length;
      text += `👤 *${m.nama}*\n   - Hadir: ${hadir}x\n   - Izin: ${izin}x\n   - Alfa: ${alfa}x\n\n`;
    });
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Tab Selector Navigasi */}
      <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner">
        <button 
          onClick={() => { setSubTabAbsen('input'); setTempAbsen({}); }} 
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${subTabAbsen === 'input' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}
        >
          Input / Edit Absen
        </button>
        <button 
          onClick={() => setSubTabAbsen('rekap')} 
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${subTabAbsen === 'rekap' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}
        >
          Rekap Bulanan
        </button>
      </div>
      
      {/* INTERMUKA SUBTAB 1: INPUT ABSENSI */}
      {subTabAbsen === 'input' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Tanggal Absen</label>
                <input 
                  type="date" 
                  className="border p-2.5 rounded-xl text-sm w-full outline-none text-slate-700 bg-slate-50 font-medium" 
                  value={absenTanggal} 
                  onChange={(e) => { setAbsenTanggal(e.target.value); setTempAbsen({}); }} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Pilih Kelas</label>
                <select 
                  className="border p-2.5 rounded-xl text-sm w-full outline-none bg-slate-50 font-medium text-slate-700" 
                  value={absenKelas} 
                  onChange={(e) => { setAbsenKelas(e.target.value); setTempAbsen({}); }}
                >
                  <option value="">-- Kelas --</option>
                  {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Mata Pelajaran</label>
              <select 
                className="border p-2.5 rounded-xl text-sm w-full outline-none bg-slate-50 font-medium text-slate-700" 
                value={absenPelajaran} 
                onChange={(e) => { setAbsenPelajaran(e.target.value); setTempAbsen({}); }}
              >
                <option value="">-- Pilih Mata Pelajaran --</option>
                {listPelajaranUnik.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {absenKelas && absenPelajaran && (
            <div className="space-y-2">
              <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl text-[11px] font-medium border border-emerald-200">
                💡 <b>Mode Edit Otomatis:</b> Jika tanggal lampau dipilih, mengubah opsi di bawah lalu menyimpan akan langsung memperbarui berkas arsip lama.
              </div>
              
              {muridList.filter(m => m.kelas === absenKelas).map(m => {
                const existing = listAbsensi.find(a => a.murid_id === m.id && a.tanggal === absenTanggal && a.pelajaran === absenPelajaran);
                const statusSaatIni = tempAbsen[m.id] || (existing ? existing.status : 'Hadir');

                return (
                  <div key={m.id} className="bg-white p-3 rounded-xl border flex items-center justify-between shadow-sm">
                    <span className="text-sm font-semibold text-slate-700">{m.nama}</span>
                    <div className="flex gap-1">
                      {['Hadir', 'Izin', 'Alfa'].map(st => {
                        const label = st.charAt(0);
                        const isSelected = statusSaatIni === st || statusSaatIni === label; 
                        const color = st === 'Hadir' ? 'bg-emerald-600' : st === 'Izin' ? 'bg-amber-500' : 'bg-red-500';
                        
                        return (
                          <button 
                            key={st} 
                            onClick={() => setTempAbsen({ ...tempAbsen, [m.id]: st })} 
                            className={`w-10 h-9 rounded-lg text-xs font-bold transition-all ${isSelected ? `${color} text-white shadow` : 'bg-slate-100 text-slate-400'}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              <button 
                onClick={handleSimpanAbsenBulk} 
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2 text-sm"
              >
                <i className="fa-solid fa-cloud-arrow-up"></i> Simpan / Perbarui Absensi
              </button>
            </div>
          )}

          {(!absenKelas || !absenPelajaran) && (
            <div className="text-center text-xs text-slate-400 py-10 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
              Silakan lengkapi pilihan Tanggal, Kelas, dan Pelajaran di atas.
            </div>
          )}
        </div>
      )}
      
      {/* INTERMUKA SUBTAB 2: REKAP BULANAN */}
      {subTabAbsen === 'rekap' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Pilih Bulan</label>
                <input 
                  type="month" 
                  className="border p-2.5 rounded-xl text-sm w-full outline-none text-slate-700 bg-slate-50 font-medium" 
                  onChange={(e) => setRekapBulan(e.target.value)} 
                  value={rekapBulan} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Pilih Kelas</label>
                <select 
                  className="border p-2.5 rounded-xl text-sm w-full outline-none bg-slate-50 font-medium text-slate-700" 
                  onChange={(e) => setRekapKelas(e.target.value)} 
                  value={rekapKelas}
                >
                  <option value="">-- Kelas --</option>
                  {listKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                </select>
              </div>
            </div>
            
            {rekapBulan && rekapKelas && (
              <div className="pt-2 flex gap-2 border-t mt-2">
                <button 
                  onClick={() => exportAbsenPDF(rekapBulan, rekapKelas)} 
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-xs font-bold shadow transition"
                >
                  <i className="fa-solid fa-file-pdf"></i> Export PDF
                </button>
                <button 
                  onClick={() => shareAbsenWA(rekapBulan, rekapKelas)} 
                  className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-xs font-bold shadow transition"
                >
                  <i className="fa-brands fa-whatsapp"></i> Bagikan WA
                </button>
              </div>
            )}
          </div>

          {rekapBulan && rekapKelas && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-700 uppercase pl-1">
                Data Rekap Kelas {rekapKelas} - {getBulanTahunLabel(rekapBulan)}
              </h4>
              
              {muridList.filter(m => m.kelas === rekapKelas).map(m => {
                const absensMurid = listAbsensi.filter(a => a.murid_id === m.id && a.tanggal && a.tanggal.startsWith(rekapBulan));
                const hadir = absensMurid.filter(a => a.status === 'Hadir' || a.status === 'H').length;
                const izin = absensMurid.filter(a => a.status === 'Izin' || a.status === 'I').length;
                const alfa = absensMurid.filter(a => a.status === 'Alfa' || a.status === 'A').length;

                return (
                  <div key={m.id} className="bg-slate-50 p-3 rounded-xl border flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">{m.nama}</span>
                    <div className="flex gap-1.5 text-[10px] font-bold">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">H: {hadir}</span>
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md">I: {izin}</span>
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md">A: {alfa}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(!rekapBulan || !rekapKelas) && (
            <div className="text-center text-xs text-slate-400 py-10 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
              Silakan pilih Bulan dan Kelas untuk menampilkan rekapitulasi.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
