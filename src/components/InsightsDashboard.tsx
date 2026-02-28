import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, AlertCircle, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

export default function InsightsDashboard({ userId, refreshKey }: any) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getDashboard(userId).then(setData).catch(console.error);
  }, [userId, refreshKey]);

  if (!data) return <div className="p-8 text-center text-slate-400">Loading insights...</div>;

  const pieData = Object.entries(data.spendingByCategory).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 pb-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
        <PieIcon className="w-6 h-6 text-blue-500" /> Insights
      </h2>

      {/* Spending Breakdown */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Spending Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={80}
                paddingAngle={5} dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Weekly Pulse</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.weeklyTrend}>
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickFormatter={(val) => val.slice(5)} />
              <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={(val) => `₹${val}`} width={40} />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} cursor={{ fill: '#334155' }} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* What If I Continue */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 mb-4">What If I Continue?</h3>
        <p className="text-sm text-slate-300 mb-4">
          In 30 days you will spend <strong className="text-white">₹{Math.round(data.futureProjection.projectedSpend).toLocaleString()}</strong>, leaving <strong className="text-emerald-400">₹{Math.round(data.futureProjection.remainingForSavings).toLocaleString()}</strong> for savings.
        </p>
        <div className="w-full bg-slate-700 rounded-full h-3 mb-2 overflow-hidden flex">
          <div className="bg-blue-500 h-3" style={{ width: `${Math.min(100, (data.futureProjection.projectedSpend / (data.futureProjection.projectedSpend + data.futureProjection.remainingForSavings)) * 100)}%` }}></div>
          <div className="bg-emerald-500 h-3" style={{ width: `${Math.max(0, (data.futureProjection.remainingForSavings / (data.futureProjection.projectedSpend + data.futureProjection.remainingForSavings)) * 100)}%` }}></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Projected Spend</span>
          <span>Remaining</span>
        </div>
      </div>

      {/* Detected Patterns */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Detected Patterns</h3>
        {data.detectedPatterns.length === 0 ? (
          <div className="text-emerald-400 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" /> No harmful patterns detected!
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.detectedPatterns.map((pattern: string) => (
              <div key={pattern} className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                {pattern.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
