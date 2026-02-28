import React, { useState, useEffect } from 'react';
import { Plus, Target, X, PiggyBank } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function GoalsPanel({ userId, onClose, balance, setBalance }: any) {
  const [dreams, setDreams] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', cost: '', targetDate: '' });
  const [showForm, setShowForm] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);

  useEffect(() => {
    loadDreams();
  }, [userId]);

  const loadDreams = async () => {
    try {
      const res = await axios.get(`/api/dreams/${userId}`);
      setDreams(res.data.map((d: any) => ({ ...d, saved: d.saved || 0 })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.cost) return;
    try {
      await axios.post('/api/dreams', { 
        userId, 
        name: form.name, 
        cost: Number(form.cost),
        targetDate: form.targetDate 
      });
      setForm({ name: '', cost: '', targetDate: '' });
      setShowForm(false);
      loadDreams();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSavings = async (goalId: string) => {
    const amount = Number(savingsAmount);
    if (!amount || amount <= 0) return;
    
    if (amount > balance) {
      toast.error('Insufficient balance to save this amount');
      return;
    }

    // Update local state for demo purposes (in real app, update backend)
    try {
      await axios.put(`/api/dreams/${goalId}/save`, { amount });
      setDreams(prev => prev.map(d => {
        if (d.id === goalId) {
          return { ...d, saved: (d.saved || 0) + amount };
        }
        return d;
      }));
      
      // Deduct from main balance
      setBalance((prev: number) => prev - amount);
      
      setSavingsAmount('');
      setActiveGoalId(null);
      toast.success(`Saved ₹${amount} towards your goal!`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save amount');
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#eef2ee] flex items-center gap-2 font-syne">
          My Goals
        </h2>
        {onClose && <button onClick={onClose}><X className="w-6 h-6 text-[#00ff55]" /></button>}
      </div>

      {showForm ? (
        <div className="bg-[#050505] p-6 rounded-2xl border border-[#00ff55]/20 mb-6 animate-in slide-in-from-top-4 shadow-[0_0_20px_rgba(0,255,85,0.05)]">
          <h3 className="text-lg font-bold mb-4 text-[#00ff55] font-syne uppercase tracking-wide">Add New Goal</h3>
          <div className="space-y-4">
            <input 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Goal Name (e.g. Dubai Trip)"
              className="w-full bg-black border border-[#00ff55]/20 rounded-xl p-4 text-[#eef2ee] placeholder:text-[#eef2ee]/30 focus:border-[#00ff55] outline-none font-dm transition-colors"
            />
            <input 
              type="number"
              value={form.cost}
              onChange={e => setForm({...form, cost: e.target.value})}
              placeholder="Estimated Cost (₹)"
              className="w-full bg-black border border-[#00ff55]/20 rounded-xl p-4 text-[#eef2ee] placeholder:text-[#eef2ee]/30 focus:border-[#00ff55] outline-none font-dm transition-colors"
            />
            <input 
              type="date"
              value={form.targetDate}
              onChange={e => setForm({...form, targetDate: e.target.value})}
              className="w-full bg-black border border-[#00ff55]/20 rounded-xl p-4 text-[#eef2ee] focus:border-[#00ff55] outline-none font-dm transition-colors"
            />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-black border border-[#00ff55]/20 text-[#eef2ee]/60 hover:text-[#eef2ee] py-3 rounded-xl font-syne uppercase tracking-wider transition-colors">Cancel</button>
              <button onClick={handleAdd} className="flex-1 bg-[#00ff55] hover:bg-[#00cc44] text-[#06090d] py-3 rounded-xl font-bold font-syne uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,85,0.3)] transition-all">Save Goal</button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full bg-[#050505] hover:bg-[#00ff55]/5 border border-dashed border-[#00ff55]/30 text-[#00ff55] py-5 rounded-2xl flex items-center justify-center gap-2 transition-all group font-syne uppercase tracking-wider shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Add a Goal
        </button>
      )}

      <div className="space-y-4">
        {dreams.map(dream => {
          const saved = dream.saved || 0;
          const remaining = Math.max(0, dream.cost - saved);
          const progress = Math.min(100, (saved / dream.cost) * 100);

          return (
            <div key={dream.id} className="bg-[#050505] p-6 rounded-2xl border border-[#00ff55]/20 relative overflow-hidden group hover:border-[#00ff55]/40 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-[#eef2ee] font-syne">{dream.name}</h3>
                  <p className="text-xs text-[#00ff55]/60 font-mono mt-1">Target: {dream.targetDate ? new Date(dream.targetDate).toLocaleDateString() : 'Someday'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#00ff55] font-mono text-2xl font-bold tracking-tight">₹{(dream.cost || 0).toLocaleString()}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[#eef2ee]/40 font-syne mt-1">Goal Amount</p>
                </div>
              </div>

              <div className="mb-6 relative z-10">
                <div className="flex justify-between text-xs mb-2 font-mono">
                  <span className="text-[#00ff55]">Saved: ₹{(saved || 0).toLocaleString()}</span>
                  <span className="text-[#eef2ee]/40">Remaining: ₹{(remaining || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-black rounded-full h-3 border border-[#00ff55]/10">
                  <div className="bg-[#00ff55] h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,255,85,0.4)]" style={{width: `${progress}%`}}></div>
                </div>
              </div>

              {activeGoalId === dream.id ? (
                <div className="flex gap-3 relative z-10 animate-in fade-in slide-in-from-bottom-2">
                  <input 
                    type="number" 
                    value={savingsAmount}
                    onChange={e => setSavingsAmount(e.target.value)}
                    placeholder="Amount"
                    className="flex-1 bg-black border border-[#00ff55]/30 rounded-xl px-4 py-3 text-[#eef2ee] text-sm focus:border-[#00ff55] outline-none font-mono"
                    autoFocus
                  />
                  <button onClick={() => handleAddSavings(dream.id)} className="bg-[#00ff55] text-[#06090d] px-6 py-2 rounded-xl font-bold text-sm font-syne uppercase tracking-wider hover:bg-[#00cc44] transition-colors">Save</button>
                  <button onClick={() => setActiveGoalId(null)} className="bg-black border border-[#00ff55]/20 text-[#eef2ee]/60 px-4 py-2 rounded-xl text-sm hover:text-[#eef2ee] transition-colors">Cancel</button>
                </div>
              ) : (
                <button 
                  onClick={() => setActiveGoalId(dream.id)}
                  className="w-full bg-[#00ff55]/5 hover:bg-[#00ff55]/10 text-[#00ff55] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 border border-[#00ff55]/20 font-syne uppercase tracking-wider"
                >
                  <PiggyBank className="w-4 h-4" /> Add Savings
                </button>
              )}
            </div>
          );
        })}
        {dreams.length === 0 && !showForm && (
          <div className="text-center text-slate-500 py-10">
            <p>No goals added yet. What are you saving for?</p>
          </div>
        )}
      </div>
    </div>
  );
}
