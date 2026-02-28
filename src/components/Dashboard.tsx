import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, Brain, TrendingUp, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import axios from 'axios';

export default function Dashboard({ userId, refreshKey }: any) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [behavioralDNA, setBehavioralDNA] = useState<string>('');
  const [loadingDNA, setLoadingDNA] = useState(false);

  useEffect(() => {
    getDashboard(userId).then(data => {
      setDashboard(data);
      if (data) {
        fetchBehavioralDNA(data);
      }
    }).catch(console.error);
  }, [userId, refreshKey]);

  const fetchBehavioralDNA = async (data: any) => {
    setLoadingDNA(true);
    try {
      const context = {
        riskScore: data.riskScore,
        spendingTrend: data.weeklySpending,
        topCategories: data.categoryBreakdown.slice(0, 3)
      };
      
      const res = await axios.post('/api/gemini/dna', { context });
      setBehavioralDNA(res.data.dna);
    } catch (e) {
      console.error(e);
      setBehavioralDNA("Your financial behavior indicates a balanced approach, though recent activity suggests a slight increase in impulsive spending.");
    } finally {
      setLoadingDNA(false);
    }
  };

  if (!dashboard) return <div className="p-8 text-center text-slate-400">Loading dashboard...</div>;

  const healthScore = Math.round(100 - dashboard.riskScore);
  const healthColor = healthScore > 80 ? 'text-emerald-400' : healthScore > 50 ? 'text-yellow-400' : 'text-red-400';
  const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      <h2 className="text-2xl font-bold text-white mb-6">Payment Dashboard</h2>

      {/* Financial Health Score */}
      <div className="bg-[#050505] rounded-2xl p-6 border border-[#00ff55]/20 flex items-center justify-between shadow-[0_0_20px_rgba(0,255,85,0.05)]">
        <div>
          <h3 className="text-[#00ff55] font-medium mb-1 font-syne uppercase tracking-wide text-xs">Financial Health Score</h3>
          <div className={`text-6xl font-bold font-syne ${healthColor}`}>{healthScore}</div>
          <p className="text-xs text-[#eef2ee]/40 mt-2 font-dm">Based on your spending habits & risk</p>
        </div>
        <div className="h-24 w-24 rounded-full border-4 border-[#00ff55]/10 flex items-center justify-center relative bg-black shadow-[0_0_15px_rgba(0,255,85,0.1)]">
           <Activity className={`w-10 h-10 ${healthColor}`} />
           <div className="absolute inset-0 rounded-full border-4 border-current opacity-20 animate-pulse" style={{color: healthScore > 50 ? '#00ff55' : '#ff4455'}}></div>
        </div>
      </div>

      {/* Behavioral DNA */}
      <div className="bg-gradient-to-r from-[#050505] to-[#00ff55]/5 rounded-2xl p-6 border border-[#00ff55]/20 relative overflow-hidden shadow-[0_0_20px_rgba(0,255,85,0.05)]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain className="w-24 h-24 text-[#00ff55]" />
        </div>
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <Brain className="w-5 h-5 text-[#00ff55]" />
          <h3 className="text-[#00ff55] font-bold font-syne uppercase tracking-wide">Behavioral DNA 🧬</h3>
        </div>
        <p className="text-[#eef2ee] text-sm leading-relaxed italic font-dm relative z-10 border-l-2 border-[#00ff55] pl-4">
          {loadingDNA ? "Analyzing your financial patterns..." : `"${behavioralDNA}"`}
        </p>
      </div>

      {/* Weekly Pulse */}
      <div className="bg-[#050505] rounded-2xl p-6 border border-[#00ff55]/20 shadow-[0_0_20px_rgba(0,255,85,0.05)]">
        <h3 className="text-[#00ff55] font-medium mb-4 flex items-center gap-2 font-syne">
          <TrendingUp className="w-4 h-4" /> Weekly Pulse
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboard.weeklySpending}>
              <defs>
                <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff55" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00ff55" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00ff55" strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="day" stroke="#00ff55" strokeOpacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000000', borderColor: '#00ff55', color: '#eef2ee' }}
                itemStyle={{ color: '#00ff55' }}
                formatter={(value: number) => [`₹${value}`, 'Spent']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#00ff55" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorPulse)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Drilldown */}
      <div className="bg-[#050505] rounded-2xl p-6 border border-[#00ff55]/20 shadow-[0_0_20px_rgba(0,255,85,0.05)]">
        <h3 className="text-[#00ff55] font-medium mb-4 flex items-center gap-2 font-syne">
          <PieChartIcon className="w-4 h-4" /> Category Drilldown
        </h3>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboard.categoryBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="amount"
                stroke="none"
              >
                {dashboard.categoryBreakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#000000', borderColor: '#00ff55', color: '#eef2ee', borderRadius: '12px' }}
                itemStyle={{ color: '#00ff55', fontFamily: 'DM Sans' }}
                formatter={(value: number) => [`₹${(value || 0).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#eef2ee' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Future Projection: What If I Continue? */}
      <div className="bg-[#050505] rounded-2xl p-6 border border-[#00ff55]/20 shadow-[0_0_20px_rgba(0,255,85,0.05)]">
        <h3 className="text-[#00ff55] font-medium mb-4 flex items-center gap-2 font-syne">
          <AlertTriangle className="w-4 h-4 text-[#ffaa00]" /> What If I Continue?
        </h3>
        <div className="space-y-4">
          <div className="bg-black p-5 rounded-xl border border-[#00ff55]/20 relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between mb-3 relative z-10">
              <span className="text-sm text-[#eef2ee]/60 font-dm">Projected Monthly Spend</span>
              <span className="text-sm font-bold text-[#eef2ee] font-mono">₹{Math.round((dashboard.monthlySpend || 0) * 1.2).toLocaleString()}</span>
            </div>
            <div className="w-full bg-[#050505] rounded-full h-2 border border-[#00ff55]/10 relative z-10">
              <div className="bg-[#ffaa00] h-full rounded-full shadow-[0_0_10px_rgba(255,170,0,0.4)]" style={{width: '80%'}}></div>
            </div>
            <p className="text-xs text-[#ffaa00] mt-3 font-dm flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> At this rate, you might exceed your budget by 20%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
