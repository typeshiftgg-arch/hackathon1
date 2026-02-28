import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getActiveInterventions } from '../services/api';

export default function TopBar({ userId, refreshKey, onBellClick, userName }: any) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getActiveInterventions(userId).then(data => setUnreadCount(data.length)).catch(console.error);
  }, [userId, refreshKey]);

  return (
    <div className="bg-black sticky top-0 z-50 px-4 py-3 flex justify-between items-center border-b border-[#00ff55]/10 max-w-md mx-auto md:max-w-4xl backdrop-blur-md bg-opacity-80">
      <div className="flex items-center gap-3 bg-gradient-to-b from-white/5 to-transparent p-2 pr-4 rounded-full border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md">
        <div className="w-8 h-8 rounded-full bg-[#00ff55] flex items-center justify-center text-black font-bold font-syne shadow-[0_0_10px_rgba(0,255,85,0.5)]">
          {userName ? userName.charAt(0).toUpperCase() : 'U'}
        </div>
        <span className="text-sm font-bold text-white font-syne tracking-wide">{userName || 'User'}</span>
      </div>
      <button onClick={onBellClick} className="relative p-2 text-[#eef2ee]/60 hover:text-[#00ff55] transition-colors">
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
        )}
      </button>
    </div>
  );
}
