// File: src/components/Header.jsx
import React from 'react';
import { supabase } from '../lib/supabase';

export default function Header({ isOffline, loading, onSync }) {
  return (
    <header className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-graduation-cap text-lg"></i>
        <h1 className="text-xl font-bold tracking-tight">Buku Ustaz</h1>
      </div>
      <div className="flex items-center gap-3">
        {isOffline && (
          <span className="text-[10px] bg-red-500 px-2 py-1 rounded font-bold uppercase tracking-wider animate-pulse">
            Offline
          </span>
        )}
        <button 
          onClick={onSync} 
          className="text-white bg-emerald-700 w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-emerald-800" 
          title="Sinkron Cloud"
        >
          {loading ? (
            <i className="fa-solid fa-spinner fa-spin text-xs"></i>
          ) : (
            <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
          )}
        </button>
        <button 
          onClick={() => supabase.auth.signOut()} 
          className="text-emerald-100 hover:text-white text-sm transition"
          title="Keluar"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    </header>
  );
}
