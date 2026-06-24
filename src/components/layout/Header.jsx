import React from 'react';

export default function Header({ user, isOffline, loading, onSync, onLogout }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center md:hidden">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight">Aplikasi Ustaz</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isOffline && (
            <span className="flex items-center px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-1 animate-pulse"></span> Offline
            </span>
          )}
          <button
            onClick={onSync}
            disabled={loading || isOffline}
            className={`p-2 rounded-xl transition-all ${isOffline ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} ${loading ? 'animate-spin' : ''}`}
            title="Sinkronisasi Data"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-3 py-1">
            <div className="w-6 h-6 bg-emerald-500 rounded-full text-white flex items-center justify-center text-xs font-bold mr-2">U</div>
            <span className="text-sm font-medium text-gray-600 truncate max-w-[120px]">{user?.email?.split('@')[0]}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
