// File: src/components/BottomNav.jsx
import React from 'react';

export default function BottomNav({ activeTab, onChangeTab }) {
  const menuItems = [
    { id: 'jadwal', icon: 'fa-calendar-day', label: 'Jadwal' },
    { id: 'rapor', icon: 'fa-users', label: 'Santri' },
    { id: 'absen', icon: 'fa-clipboard-user', label: 'Absen' },
    { id: 'saku', icon: 'fa-book-bookmark', label: 'Saku' },
    { id: 'perilaku', icon: 'fa-star-half-stroke', label: 'Sikap' },
    { id: 'nilai', icon: 'fa-file-signature', label: 'Nilai' },
    { id: 'soal', icon: 'fa-folder-open', label: 'Soal' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-between px-2 py-2 z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      {menuItems.map(m => {
        const isActive = activeTab === m.id;
        return (
          <button 
            key={m.id} 
            onClick={() => onChangeTab(m.id)} 
            className="flex flex-col items-center justify-center py-0.5 w-12 outline-none"
          >
            <i className={`fa-solid ${m.icon} text-[18px] mb-0.5 transition-transform ${isActive ? 'text-emerald-600 scale-105' : 'text-slate-400 hover:text-slate-500'}`}></i>
            <span className={`text-[8px] font-black ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
              {m.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
