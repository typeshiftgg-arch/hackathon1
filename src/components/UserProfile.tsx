import React, { useEffect, useState } from 'react';
import { getUser, updateUser, getDashboard } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Settings, Save, Wallet, Target, TrendingUp, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserProfile({ userId, refreshKey, onRefresh }: any) {
  const [user, setUser] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [form, setForm] = useState({ monthlyIncome: 0, savingsGoal: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUser(userId).then(u => {
      setUser(u);
      setForm({ monthlyIncome: u.monthlyIncome, savingsGoal: u.savingsGoal });
    }).catch(console.error);

    getDashboard(userId).then(setDashboard).catch(console.error);
  }, [userId, refreshKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(userId, { monthlyIncome: Number(form.monthlyIncome), savingsGoal: Number(form.savingsGoal) });
      toast.success('Profile updated');
      onRefresh();
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !dashboard) return <div className="p-8 text-center text-slate-400">Loading profile...</div>;

  const riskScore = Math.round(dashboard.riskScore);
  const healthColor = riskScore > 70 ? 'text-red-500' : riskScore > 40 ? 'text-amber-500' : 'text-emerald-500';
  const healthText = riskScore > 70 ? 'Needs Attention' : riskScore > 40 ? 'Fair' : 'Excellent';

  return (
    <div className="space-y-6 pb-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-blue-500" /> Profile
      </h2>

      {/* Financial Health Score */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center">
        <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center justify-center gap-2">
          <HeartPulse className="w-4 h-4" /> Financial Health Score
        </h3>
        <div className="flex items-end justify-center gap-2 mb-2">
          <span className={`text-5xl font-bold ${healthColor}`}>{100 - riskScore}</span>
          <span className="text-slate-500 mb-1">/ 100</span>
        </div>
        <p className={`text-sm font-medium ${healthColor}`}>{healthText}</p>
        <p className="text-xs text-slate-400 mt-2">Based on your spending patterns and goals</p>
      </div>

      {/* Financial Goals */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" /> Financial Goals
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Monthly Income (₹)
            </label>
            <input
              type="number"
              required
              value={form.monthlyIncome}
              onChange={e => setForm({ ...form, monthlyIncome: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
              <Target className="w-4 h-4" /> Monthly Savings Goal (₹)
            </label>
            <input
              type="number"
              required
              value={form.savingsGoal}
              onChange={e => setForm({ ...form, savingsGoal: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Savings Trajectory */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" /> 6-Month Savings Trajectory
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboard.savingsTrajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} />
              <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} width={40} />
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="goal" name="Target Goal" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="projected" name="Projected" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
