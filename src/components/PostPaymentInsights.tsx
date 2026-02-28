import React, { useEffect, useState } from 'react';
import { ArrowLeft, Target } from 'lucide-react';
import { getDashboard } from '../services/api';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PostPaymentInsights({ tx, onClose, userId }: any) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [dreams, setDreams] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState(6); // months

  useEffect(() => {
    getDashboard(userId).then(setDashboard).catch(console.error);
    axios.get(`/api/dreams/${userId}`).then(res => setDreams(res.data)).catch(console.error);
  }, [userId, tx]);

  if (!dashboard) return <div className="p-8 text-center text-slate-400">Loading insights...</div>;

  // Calculate projections
  const monthlyIncome = 50000; 
  const frequency = 1; 
  const reducedFrequency = 0.5; 

  const currentBalance = dashboard.savingsTrajectory[0]?.projected || 0;
  
  const projectionData = [];
  for (let i = 0; i <= timeRange; i++) {
    const monthName = new Date();
    monthName.setMonth(monthName.getMonth() + i);
    
    // Non-linear growth (compound interest simulation or just varying spending)
    // Adding some randomness/fluctuation to make it look like a "stock graph"
    const fluctuation = Math.sin(i * 1.5) * 2000; // Increased amplitude for more drastic look
    
    // Make the divergence more extreme over time
    const divergence = Math.pow(i, 1.8) * 500;

    const costA = (tx.amount * frequency * i) + fluctuation + divergence;
    const costB = (tx.amount * reducedFrequency * i) + (fluctuation * 0.5);
    
    const baseSavings = (monthlyIncome * 0.2) * i;

    projectionData.push({
      name: monthName.toLocaleDateString('en-US', { month: 'short' }),
      'Current Habit': Math.round(baseSavings - costA + currentBalance),
      'Reduced Habit': Math.round(baseSavings - costB + currentBalance),
    });
  }

  return (
    <div className="space-y-6 pb-6 animate-in slide-in-from-right-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onClose}><ArrowLeft className="w-6 h-6" /></button>
        <div>
          <h2 className="text-xl font-bold">{tx.category} Insights 📊</h2>
          <p className="text-xs text-slate-400">Your {tx.category} story this month</p>
        </div>
      </div>

      {/* Projection Graphs */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-slate-400">Balance Projection</h3>
          <div className="flex gap-2 bg-slate-900 rounded-lg p-1">
            {[1, 3, 6, 12].map(m => (
              <button 
                key={m}
                onClick={() => setTimeRange(m)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${timeRange === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {m}M
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorReduced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                itemStyle={{ color: '#f8fafc' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
              />
              <Legend />
              <Area type="monotone" dataKey="Current Habit" stroke="#ef4444" fillOpacity={1} fill="url(#colorCurrent)" strokeWidth={4} />
              <Area type="monotone" dataKey="Reduced Habit" stroke="#10b981" fillOpacity={1} fill="url(#colorReduced)" strokeWidth={4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dreams Impact */}
      {dreams.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" /> Impact on Goals
          </h3>
          <div className="space-y-4">
            {dreams.map(dream => {
              // Calculate how much closer/further
              // Assuming savings go towards dream. 
              // If I spend 500, that's 500 less for the dream.
              // But let's frame it as "If you saved this instead..."
              const savedPercent = (tx.amount / dream.cost) * 100;
              return (
                <div key={dream.id} className="bg-slate-900 p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white">{dream.name}</span>
                    <span className="text-xs text-emerald-400">+{savedPercent.toFixed(2)}% closer (if saved)</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Saving this amount instead would get you <strong>{savedPercent.toFixed(2)}%</strong> closer to your goal of ₹{(dream.cost || 0).toLocaleString()}.
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${Math.min(100, savedPercent)}%`}}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
