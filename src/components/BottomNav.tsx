import React from 'react';
import { Home, Send, PieChart, User } from 'lucide-react';

export default function BottomNav({ currentTab, setCurrentTab }: any) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'pay', icon: Send, label: 'Pay' },
    { id: 'insights', icon: PieChart, label: 'Insights' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full ${currentTab === tab.id ? 'text-blue-500' : 'text-slate-400'}`}
          >
            <tab.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
