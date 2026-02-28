import React, { useEffect, useState } from 'react';
import { getInterventions, acknowledgeIntervention } from '../services/api';
import { MessageSquare, CheckCircle2, Clock, AlertTriangle, Gamepad2, ShoppingBag, TrendingDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function InterventionPanel({ userId, refreshKey, onRefresh }: any) {
  const [interventions, setInterventions] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    getInterventions(userId).then(setInterventions).catch(console.error);
  }, [userId, refreshKey]);

  const handleAcknowledge = async (id: number) => {
    try {
      await acknowledgeIntervention(id);
      toast.success('Acknowledged');
      onRefresh();
    } catch (e) {
      toast.error('Failed to acknowledge');
    }
  };

  const filtered = interventions.filter((inv: any) => {
    if (filter === 'UNREAD') return !inv.wasAcknowledged;
    if (filter === 'HIGH') return inv.severity === 'HIGH';
    return true;
  });

  const patternIcons: any = {
    GAMBLING_ALERT: <Gamepad2 className="w-6 h-6 text-red-500" />,
    LATE_NIGHT_IMPULSE: <Clock className="w-6 h-6 text-amber-500" />,
    BINGE_SPENDING: <ShoppingBag className="w-6 h-6 text-purple-500" />,
    BUDGET_BREACH: <AlertTriangle className="w-6 h-6 text-red-500" />,
    SAVING_DERAIL: <TrendingDown className="w-6 h-6 text-orange-500" />
  };

  const getTags = (inv: any) => {
    const tags = [];
    if (inv.severity === 'HIGH') tags.push({ label: 'High Risk', color: 'bg-red-500/20 text-red-400' });
    
    if (inv.category === 'GAMBLING_ALERT') tags.push({ label: 'Gambling', color: 'bg-purple-500/20 text-purple-400' });
    if (inv.category === 'LATE_NIGHT_IMPULSE') tags.push({ label: 'Impulsive', color: 'bg-orange-500/20 text-orange-400' });
    if (inv.category === 'BINGE_SPENDING') tags.push({ label: 'Habit Forming', color: 'bg-blue-500/20 text-blue-400' });
    
    return tags;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-amber-500" /> AI Interventions
        </h2>
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
          {['ALL', 'UNREAD', 'HIGH'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'UNREAD' ? 'Unread' : 'High Severity'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl p-12 border border-slate-700 shadow-lg flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">You're making great decisions! 🎉</h3>
            <p className="text-slate-400 max-w-md">
              No interventions found for this filter. Keep up the good work and stay focused on your financial goals.
            </p>
          </div>
        ) : (
          filtered.map((inv: any) => (
            <div
              key={inv.id}
              className={`bg-slate-800 rounded-2xl p-6 border shadow-lg transition-all ${
                !inv.wasAcknowledged ? 'border-l-4 border-l-blue-500 border-slate-700' : 'border-slate-700/50 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-slate-900 p-3 rounded-xl border border-slate-700">
                    {patternIcons[inv.category] || <AlertCircle className="w-6 h-6 text-slate-400" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getTags(inv).map((tag, i) => (
                        <span key={i} className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${tag.color}`}>
                          {tag.label}
                        </span>
                      ))}
                      <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto sm:ml-0">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(inv.triggeredAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-slate-200 text-lg leading-relaxed">{inv.message}</p>
                  </div>
                </div>
                {!inv.wasAcknowledged && (
                  <button
                    onClick={() => handleAcknowledge(inv.id)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
