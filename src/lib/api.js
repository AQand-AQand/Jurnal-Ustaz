import { supabase } from './supabase';

// Sync all data from cloud
export const syncAllDataFromCloud = async () => {
  if (!navigator.onLine) return null;

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

    return {
      murid: m || [],
      absensi: a || [],
      batas: b || [],
      perilaku: p || [],
      nilai: n || [],
      soal: bs || [],
      jadwal: jdwl || [],
      sakuBatas: skb || [],
      sakuTagihan: skt || [],
      capaian: ch || [],
    };
  } catch (err) {
    console.log("Gagal sinkron:", err);
    return null;
  }
};

// Murid CRUD
export const insertMurid = async (murid) => {
  return await supabase.from('murid').insert([murid]);
};

export const updateMurid = async (id, data) => {
  return await supabase.from('murid').update(data).eq('id', id);
};

export const deleteMurid = async (id) => {
  return await supabase.from('murid').delete().eq('id', id);
};

// Jadwal CRUD
export const insertJadwal = async (jadwal) => {
  return await supabase.from('jadwal_mengajar').insert([jadwal]);
};

export const updateJadwal = async (id, data) => {
  return await supabase.from('jadwal_mengajar').update(data).eq('id', id);
};

export const deleteJadwal = async (id) => {
  return await supabase.from('jadwal_mengajar').delete().eq('id', id);
};

// Bank Soal CRUD
export const insertSoal = async (soal) => {
  return await supabase.from('bank_soal').insert([soal]);
};

export const updateSoal = async (id, data) => {
  return await supabase.from('bank_soal').update(data).eq('id', id);
};

export const deleteSoal = async (id) => {
  return await supabase.from('bank_soal').delete().eq('id', id);
};

// Absensi
export const insertAbsensi = async (absensi) => {
  return await supabase.from('absensi').insert([absensi]);
};

export const deleteAbsensiByDateAndMurids = async (tanggal, muridIds) => {
  return await supabase.from('absensi').delete()
    .eq('tanggal', tanggal)
    .in('murid_id', muridIds);
};

export const insertAbsensiBatch = async (absensiList) => {
  return await supabase.from('absensi').insert(absensiList);
};

// Perilaku
export const insertPerilaku = async (perilaku) => {
  return await supabase.from('catatan_perilaku').insert([perilaku]);
};

export const deletePerilaku = async (id) => {
  return await supabase.from('catatan_perilaku').delete().eq('id', id);
};

// Nilai
export const insertNilai = async (nilai) => {
  return await supabase.from('nilai').insert([nilai]);
};

// Buku Saku Batas
export const insertSakuBatas = async (batas) => {
  return await supabase.from('buku_saku_batas').insert([batas]);
};

export const deleteSakuBatas = async (id) => {
  return await supabase.from('buku_saku_batas').delete().eq('id', id);
};

// Buku Saku Tagihan
export const insertSakuTagihan = async (tagihan) => {
  return await supabase.from('buku_saku_tagihan').insert([tagihan]);
};

export const deleteSakuTagihan = async (id) => {
  return await supabase.from('buku_saku_tagihan').delete().eq('id', id);
};

// Capaian Hafalan
export const insertCapaian = async (capaian) => {
  return await supabase.from('capaian_hafalan').insert([capaian]);
};

export const deleteCapaian = async (id) => {
  return await supabase.from('capaian_hafalan').delete().eq('id', id);
};
