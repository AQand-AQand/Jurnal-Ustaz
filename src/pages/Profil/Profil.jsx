import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

export default function Profil({ profile, user, onRefresh }) {
  const [formData, setFormData] = useState({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', foto_profil: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setFormData({
      nama_lengkap: profile.nama_lengkap || '',
      nama_panggilan: profile.nama_panggilan || '',
      nomor_whatsapp: profile.nomor_whatsapp || '',
      foto_profil: profile.foto_profil || ''
    });
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nama_lengkap: formData.nama_lengkap,
          nama_panggilan: formData.nama_panggilan,
          nomor_whatsapp: formData.nomor_whatsapp,
          foto_profil: formData.foto_profil
        })
        .eq('user_id', user.id);

      if (error) throw error;
      alert("Profil Anda berhasil diperbarui!");
      onRefresh();
    } catch (err) {
      alert("Gagal memperbarui profil: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSalinLinkJadwal = () => {
    const linkPublik = `${window.location.origin}/share/jadwal?ustaz=${user.id}`;
    navigator.clipboard.writeText(linkPublik);
    alert("Tautan jadwal mengajar publik berhasil disalin ke clipboard!");
  };

  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4 animate-fade-in">
      <div className="border-b pb-3 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <i className="fa-solid fa-id-card text-emerald-600"></i> Profil Saya
        </h3>
        <button onClick={handleSalinLinkJadwal} className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 py-1.5 px-3 rounded-lg flex items-center gap-1 hover:bg-emerald-100">
          <i className="fa-solid fa-share-nodes"></i> Bagikan Jadwal
        </button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-3.5">
        <center>
          <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-emerald-500 overflow-hidden flex items-center justify-center shadow-inner relative group">
            {formData.foto_profil ? (
              <img src={formData.foto_profil} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <i className="fa-solid fa-camera text-2xl text-slate-300"></i>
            )}
          </div>
        </center>

        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Email (Kunci Otentikasi)</label>
          <input type="text" className="w-full border rounded-xl p-2.5 text-xs bg-slate-100 text-slate-400 font-mono" disabled value={user?.email || ''} />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Nama Lengkap & Gelar Akademik</label>
          <input type="text" required className="w-full border rounded-xl p-2.5 text-xs bg-slate-50 font-medium" value={formData.nama_lengkap} onChange={e => setFormData({...formData, nama_lengkap: e.target.value})} />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Nama Panggilan Akrab</label>
          <input type="text" required className="w-full border rounded-xl p-2.5 text-xs bg-slate-50 font-medium" value={formData.nama_panggilan} onChange={e => setFormData({...formData, nama_panggilan: e.target.value})} />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Nomor Kontak WhatsApp</label>
          <input type="tel" className="w-full border rounded-xl p-2.5 text-xs bg-slate-50 font-medium" value={formData.nomor_whatsapp} onChange={e => setFormData({...formData, nomor_whatsapp: e.target.value})} />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">URL Link Foto Profil (Opsional)</label>
          <input type="url" placeholder="https://image-host.com/avatar.jpg" className="w-full border rounded-xl p-2.5 text-xs bg-slate-50 font-mono" value={formData.foto_profil} onChange={e => setFormData({...formData, foto_profil: e.target.value})} />
        </div>

        <button type="submit" disabled={saving} className="w-full bg-emerald-600 text-white text-xs font-bold py-3 rounded-xl transition shadow hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Menyimpan Perubahan...' : 'Simpan Pembaruan Profil'}
        </button>
      </form>
    </div>
  );
}
