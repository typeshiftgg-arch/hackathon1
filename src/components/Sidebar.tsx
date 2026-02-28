import React from 'react';
import { Home, Clock, Target, Settings, LogOut, CreditCard, LayoutDashboard } from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, onClose }: any) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'pay', label: 'Pay', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <Clock className="w-5 h-5" /> },
    { id: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" /> },
    { id: 'categories', label: 'Categories', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="h-full bg-black border-r border-[#00ff55]/10 flex flex-col w-64">
      <div className="p-6 flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-8 font-syne">PaisaPulse <span className="text-[#00ff55]">💸</span></h1>
        <nav className="space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-syne uppercase tracking-wider text-sm ${
                currentTab === item.id 
                  ? 'bg-[#00ff55] text-black font-bold shadow-[0_0_15px_rgba(0,255,85,0.4)]' 
                  : 'text-[#eef2ee]/60 hover:bg-[#00ff55]/10 hover:text-[#00ff55] hover:border-l-2 hover:border-[#00ff55]'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="p-6 border-t border-[#00ff55]/10 shrink-0">
        <button className="flex items-center gap-3 text-[#eef2ee]/40 hover:text-[#ff4455] w-full px-4 py-2 transition-colors font-syne uppercase tracking-wider text-xs">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
