import React, { useState } from 'react';
import { generatePDF, shareWA } from '../../lib/pdf';

export default function AbsensiTab({ muridList, listAbsensi, setListAbsensi, user, checkConnection, insertAbsensiBatch, deleteAbsensiByDateAndMurids }) {
  const [absenTab, setAbsenTab] = useState('harian');
  const [filterKelasAbsen, setFilterKelasAbsen] = useState('');
  const [draftAbsen, setDraftAbsen] = useState({});
  const [absenBulan, setAbsenBulan] = useState(new Date().toISOString().slice(0, 7));
  const [absenTahun, setAbsenTahun] = useState(new Date().getFullYear().toString());
  const [absenKelasBulanan, setAbsenKelasBulanan] = useState('');
  const [absenRekapType, setAbsenRekapType] = useState('bulanan');
  const [loading, setLoading] = useState(false);
  const [now] = useState(new Date());

  const namaHariIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const hariIni = namaHariIndo[now.getDay()];
  const tanggalHariIni = now.getDate();
  const bulanHariIni = namaBulanIndo[now.getMonth()];
  const tahunHariIni = now.getFullYear();
  const stringTglHariIni = now.toISOString().split('T')[0];

  const setStatusAbsen = (muridId, status) => {
    setDraftAbsen(prev => ({ ...prev, [muridId]: status }));
  };

  const eksekusiSimpanAbsenMasal = async () => {
    if (!filterKelasAbsen) return alert("Silakan pilih kelas terlebih dahulu!");

    setLoading(true);
    const muridDiKelas = muridList.filter(m => m.kelas === filterKelasAbsen);
    let daftarAbsenLama = [...listAbsensi];
    const absenBaruUntukDisimpan = [];

    muridDiKelas.forEach(m => {
      const statusFinal = draftAbsen[m.id] || daftarAbsenLama.find(a => a.murid_id === m.id && a.tanggal === stringTglHariIni)?.status;

      if (statusFinal) {
        daftarAbsenLama = daftarAbsenLama.filter(a => !(a.murid_id === m.id && a.tanggal === stringTglHariIni));
        const itemAbsenBaru = {
          id: Math.floor(Math.random() * 1000000),
          murid_id: m.id,
          status: statusFinal,
          tanggal: stringTglHariIni,
          ustadz_email: user?.email
        };
        daftarAbsenLama.unshift(itemAbsenBaru);
        absenBaruUntukDisimpan.push(itemAbsenBaru);
      }
    });

    setListAbsensi(daftarAbsenLama);

    if (checkConnection() && absenBaruUntukDisimpan.length > 0) {
      try {
        const idMuridKelas = muridDiKelas.map(m => m.id);
        await deleteAbsensiByDateAndMurids(stringTglHariIni, idMuridKelas);
        await insertAbsensiBatch(absenBaruUntukDisimpan);
      } catch (e) {
        console.error("Gagal sinkron absen ke cloud:", e);
      }
    }

    setLoading(false);
    alert(`Alhamdulillah, data absensi Kelas ${filterKelasAbsen} hari ini berhasil disimpan/diperbarui!`);
  };

  const muridRekap = absenKelasBulanan ? muridList.filter(m => m.kelas === absenKelasBulanan) : [];
  const dataRekapTampil = muridRekap.map(m => {
    const absenMuridTerkait = listAbsensi.filter(a => {
      const cocokMurid = a.murid_id === m.id;
      const cocokWaktu = absenRekapType === 'bulanan'
        ? a.tanggal.startsWith(absenBulan)
        : a.tanggal.startsWith(absenTahun);
      return cocokMurid && cocokWaktu;
    });

    return {
      nama: m.nama,
      h: absenMuridTerkait.filter(x => x.status === 'Hadir').length,
      i: absenMuridTerkait.filter(x => x.status === 'Izin').length,
      a: absenMuridTerkait.filter(x => x.status === 'Alfa').length,
    };
  });

  const teksWAFormal = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYang terhormat Bapak/Ibu Wali Santri,\nBerikut kami sampaikan laporan rekapitulasi kehadiran santri *Kelas ${absenKelasBulanan}* untuk periode *${absenRekapType === 'bulanan' ? absenBulan : 'Tahun ' + absenTahun}*.\n\nMohon periksa dokumen PDF yang dilampirkan oleh ustadz untuk melihat rincian kehadiran putra/putri Anda.\n\nTerima kasih atas perhatian dan kerjasamanya.\nSemoga para santri senantiasa diberikan kemudahan dalam menuntut ilmu.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.`;

  const eksekusiCetakRekap = () => {
    const bodyTable = dataRekapTampil.map(d => [d.nama, d.h, d.i, d.a]);
    const judul = `Laporan Kehadiran Kelas ${absenKelasBulanan}`;
    const infoEkstra = [
      `Periode: ${absenRekapType === 'bulanan' ? absenBulan : absenTahun}`,
      `Dicetak pada: ${tanggalHariIni} ${bulanHariIni} ${tahunHariIni}`
    ];
    generatePDF(judul, ["Nama Santri", "Hadir", "Izin", "Alfa"], bodyTable, infoEkstra);
  };

  const kelasTersedia = [...new Set(muridList.map(m => m.kelas))].sort();

  return (
    <div className="space-y-5 animate-fadeIn max-w-5xl mx-auto">
      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl shadow-inner mb-2">
        <button
          onClick={() => setAbsenTab('harian')}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl transition-all duration-300 ${absenTab === 'harian' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Absen Harian
        </button>
        <button
          onClick={() => setAbsenTab('arsip')}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl transition-all duration-300 ${absenTab === 'arsip' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Rekapitulasi
        </button>
      </div>

      {absenTab === 'harian' && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 animate-slideUp">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl mb-5 shadow-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-0.5">Jurnal Kehadiran</p>
              <h4 className="text-lg font-black leading-none">{hariIni}</h4>
              <p className="text-xs font-medium text-emerald-50 mt-1">{tanggalHariIni} {bulanHariIni} {tahunHariIni}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
              <i className="fa-solid fa-calendar-check text-2xl text-white"></i>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Pilih Kelas</label>
            <select
              className="w-full border border-slate-200 bg-slate-50 py-2.5 px-4 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
              value={filterKelasAbsen}
              onChange={e => setFilterKelasAbsen(e.target.value)}
            >
              <option value="">-- Sentuh untuk memilih kelas --</option>
              {kelasTersedia.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
          </div>

          {filterKelasAbsen ? (
            <div className="space-y-3 mt-5">
              <h4 className="text-xs font-bold text-slate-400 border-b border-slate-100 pb-2 mb-3">Daftar Santri Kelas {filterKelasAbsen}</h4>
              {muridList.filter(m => m.kelas === filterKelasAbsen).map((m, index) => {
                const statusAktif = draftAbsen[m.id] || listAbsensi.find(a => a.murid_id === m.id && a.tanggal === stringTglHariIni)?.status || '';

                return (
                  <div key={m.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center transition-all hover:border-emerald-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-white text-slate-500 font-bold text-[10px] flex items-center justify-center border border-slate-200 shadow-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xs">{m.nama}</h4>
                        {statusAktif ? (
                          <p className="text-[9px] font-bold text-emerald-600 mt-0.5"><i className="fa-solid fa-check-circle mr-1"></i>Telah diisi</p>
                        ) : (
                          <p className="text-[9px] font-bold text-rose-500 mt-0.5"><i className="fa-solid fa-circle-exclamation mr-1"></i>Belum diisi</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                      <button onClick={() => setStatusAbsen(m.id, 'Hadir')} className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${statusAktif === 'Hadir' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-100'}`}>H</button>
                      <button onClick={() => setStatusAbsen(m.id, 'Izin')} className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${statusAktif === 'Izin' ? 'bg-amber-400 text-white shadow-md shadow-amber-400/30' : 'text-slate-400 hover:bg-slate-100'}`}>I</button>
                      <button onClick={() => setStatusAbsen(m.id, 'Alfa')} className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${statusAktif === 'Alfa' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'text-slate-400 hover:bg-slate-100'}`}>A</button>
                    </div>
                  </div>
                );
              })}

              <button onClick={eksekusiSimpanAbsenMasal} disabled={loading} className="w-full bg-emerald-600 text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 mt-6 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center disabled:opacity-70">
                <i className="fa-solid fa-floppy-disk mr-2"></i> {loading ? 'Menyimpan...' : 'Simpan & Edit Absensi'}
              </button>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <i className="fa-solid fa-arrow-pointer text-2xl opacity-50 mb-2"></i>
              <p className="text-xs font-semibold">Pilih kelas untuk memunculkan daftar santri.</p>
            </div>
          )}
        </div>
      )}

      {absenTab === 'arsip' && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 animate-slideUp">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Laporan Kehadiran</h3>
            <p className="text-[10px] text-slate-400 font-medium">Rekapitulasi bulanan & tahunan</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3 mb-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">A. Pilih Kelas</label>
              <select className="w-full border border-slate-200 bg-white py-2 px-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500" value={absenKelasBulanan} onChange={e => setAbsenKelasBulanan(e.target.value)}>
                <option value="">-- Pilih Kelas --</option>
                {kelasTersedia.map(k => <option key={k} value={k}>Kelas {k}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">B. Jenis Rekap</label>
                <select className="w-full border border-slate-200 bg-white py-2 px-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500" value={absenRekapType} onChange={e => setAbsenRekapType(e.target.value)}>
                  <option value="bulanan">Bulanan</option>
                  <option value="tahunan">Tahunan</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">C. Waktu</label>
                {absenRekapType === 'bulanan' ? (
                  <input type="month" className="w-full border border-slate-200 bg-white py-1.5 px-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500" value={absenBulan} onChange={e => setAbsenBulan(e.target.value)} />
                ) : (
                  <input type="number" placeholder="Contoh: 2024" className="w-full border border-slate-200 bg-white py-2 px-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500" value={absenTahun} onChange={e => setAbsenTahun(e.target.value)} />
                )}
              </div>
            </div>
          </div>

          {absenKelasBulanan && (absenBulan || absenTahun) ? (
            <div className="animate-fadeIn">
              <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center">
                <i className="fa-solid fa-table-list mr-1.5 text-emerald-600"></i> Pratinjau Data Rekapitulasi
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] text-slate-600 uppercase">
                      <th className="p-2 border-b border-slate-200 font-black">Nama Santri</th>
                      <th className="p-2 border-b border-slate-200 font-black text-center text-emerald-600">H</th>
                      <th className="p-2 border-b border-slate-200 font-black text-center text-amber-500">I</th>
                      <th className="p-2 border-b border-slate-200 font-black text-center text-rose-500">A</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {dataRekapTampil.length > 0 ? dataRekapTampil.map((d, idx) => (
                      <tr key={idx} className="text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <td className="p-2 border-b border-slate-100 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{d.nama}</td>
                        <td className="p-2 border-b border-slate-100 text-center">{d.h}</td>
                        <td className="p-2 border-b border-slate-100 text-center">{d.i}</td>
                        <td className="p-2 border-b border-slate-100 text-center">{d.a}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-[10px] text-slate-400 font-medium">Tidak ada data murid di kelas ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button onClick={eksekusiCetakRekap} className="flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95">
                  <i className="fa-solid fa-file-pdf mr-1.5 text-sm"></i> Unduh PDF
                </button>
                <button onClick={() => shareWA(teksWAFormal)} className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95">
                  <i className="fa-brands fa-whatsapp mr-1.5 text-sm"></i> Bagikan (WA)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl bg-slate-50">
              <p className="text-[10px] font-semibold text-slate-400">Lengkapi filter di atas untuk melihat data.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
