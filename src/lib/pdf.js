import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePDF = (title, headers, body, extraInfo = []) => {
  const doc = new jsPDF();
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(5, 150, 105);
  doc.text(title, 14, 20);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  let startY = 28;
  extraInfo.forEach((info) => {
    doc.text(info, 14, startY);
    startY += 6;
  });
  doc.autoTable({
    startY: startY + 4,
    head: [headers],
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], fontSize: 10, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 9, font: "Helvetica", textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });
  doc.save(`${title.replace(/ /g, '_')}.pdf`);
};

export const shareWA = (text) => {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
};

export const exportSoalPDF = (soal, userEmail) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Soal Ujian: ${soal.pelajaran}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Pengajar: ${userEmail || 'Ustaz'}`, 14, 28);
  doc.text(`Kelas: ${soal.kelas}`, 14, 34);
  doc.text(`Batasan: ${soal.batasan || '-'}`, 14, 40);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 46);
  doc.line(14, 50, 196, 50);
  doc.setFontSize(12);
  const splitText = doc.splitTextToSize(soal.isi_soal, 180);
  doc.text(splitText, 14, 60);
  doc.save(`Soal_${soal.pelajaran}_Kelas_${soal.kelas}.pdf`);
};

export const shareSoalWA = (soal, userEmail) => {
  const text = `*SOAL UJIAN*\n📚 Pelajaran: ${soal.pelajaran}\n👨‍🏫 Pengajar: ${userEmail || 'Ustaz'}\n🏫 Kelas: ${soal.kelas}\n📑 Batasan: ${soal.batasan || '-'}\n\n*Pertanyaan:*\n${soal.isi_soal}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
};

export const exportNilaiKelasPDF = (kelas, muridList, listNilai, userEmail) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Rekap Nilai Kelas ${kelas}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Nama Pengajar: ${userEmail || 'Ustaz'}`, 14, 28);
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

export const shareNilaiKelasWA = (kelas, muridList, listNilai, userEmail) => {
  let text = `*REKAP NILAI KELAS ${kelas}*\n👨‍🏫 Pengajar: ${userEmail || 'Ustaz'}\n📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`;
  const muridDiKelas = muridList.filter(m => m.kelas === kelas);
  muridDiKelas.forEach(m => {
    const nilaiMurid = listNilai.filter(n => n.murid_id === m.id);
    if (nilaiMurid.length > 0) {
      text += `👤 *${m.nama}*\n`;
      nilaiMurid.forEach(n => { text += `- ${n.pelajaran} (${n.jenis_ujian}): ${n.skor}\n`; });
      text += `\n`;
    }
  });
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
};

export const exportRaporPDF = (murid, listAbsensi, listNilai, userEmail) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Rapor Akademik Santri`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Nama Santri: ${murid.nama}`, 14, 28);
  doc.text(`Kelas: ${murid.kelas}`, 14, 34);
  doc.text(`Pengajar: ${userEmail || 'Ustaz'}`, 14, 40);
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

export const shareRaporWA = (murid, listAbsensi, listNilai, userEmail) => {
  const absens = listAbsensi.filter(a => a.murid_id === murid.id);
  const hadir = absens.filter(a => a.status === 'Hadir').length;
  const nilais = listNilai.filter(n => n.murid_id === murid.id);

  let text = `*RAPOR AKADEMIK SANTRI*\n👤 Nama: ${murid.nama}\n🏫 Kelas: ${murid.kelas}\n👨‍🏫 Pengajar: ${userEmail || 'Ustaz'}\n📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n*📊 Kehadiran:*\n${hadir} Hari Hadir (dari ${absens.length} tercatat)\n\n*📝 Nilai Ujian:*\n`;
  if (nilais.length === 0) text += `- Belum ada nilai\n`;
  nilais.forEach(n => { text += `- ${n.pelajaran} (${n.jenis_ujian}): *${n.skor}*\n`; });
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
};
