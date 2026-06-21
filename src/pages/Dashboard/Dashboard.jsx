import React from 'react';

export default function Dashboard({ profile, stats, infoDinamis, hariIni }) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* KARTU SAPAAN PERSONAL */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 text-white p-5 rounded-3xl shadow-xl border border-emerald-600 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-white/10 text-9xl font-black">KBM</div>
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl border border-white/30 flex items-center justify-center shadow-inner">
            {profile?.foto_profil ? (
              <img src={profile.foto_profil} alt="Profil" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <i className="fa-solid fa-user-tie text-xl text-emerald-100"></i>
            )}
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wide">Assalamu'alaikum, {profile?.nama_panggilan || 'Ustaz'}</h2>
            <p className="text-[11px] text-emerald-100/90 font-medium">Platform SIM KBM • {profile?.role?.toUpperCase()}</p>
          </div>
        </div>
        <div className="mt-4 bg-black/10 p-3 rounded-xl border border-white/10 text-xs leading-relaxed font-medium">
          {infoDinamis}
        </div>
      </div>

      {/* METRIK STATISTIK UTAMA (REAL TIME) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm"><i className="fa-solid fa-calendar-day"></i></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hari Ini</p>
            <p className="text-sm font-extrabold text-slate-700">{hariIni}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm"><i className="fa-solid fa-book-open"></i></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KBM Aktif</p>
            <p className="text-sm font-extrabold text-slate-700">{stats.kbmHariIni} Kelas</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm"><i className="fa-solid fa-scroll"></i></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fan Aktif</p>
            <p className="text-sm font-extrabold text-slate-700">{stats.fanAktif} Kitab</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm"><i className="fa-solid fa-users-rectangle"></i></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelas Binaan</p>
            <p className="text-sm font-extrabold text-slate-700">{stats.kelasAktif} Ruang</p>
          </div>
        </div>
      </div>

      {/* TARGET BULANAN PROGRES */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <i className="fa-solid fa-bullseye text-red-500"></i> Target KBM Bulan Ini
          </span>
          <span className="text-xs font-black text-emerald-600">{stats.targetBulanIni}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500" style={{ width: `${stats.targetBulanIni}%` }}></div>
        </div>
        <p className="text-[10px] text-slate-400 font-medium mt-1.5">Sistem kalkulasi berdasarkan total input target_mengajar di database.</p>
      </div>
    </div>
  );
}
