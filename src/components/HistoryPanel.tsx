import React, { useState, useEffect } from 'react';
import { Clock, Search, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function HistoryPanel({ userId, onSelectTx }: any) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`/api/transactions/${userId}`).then(res => {
      setTransactions(res.data);
    }).catch(console.error);
  }, [userId]);

  const filteredTxs = transactions.filter(tx => 
    tx.merchant.toLowerCase().includes(search.toLowerCase()) || 
    tx.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <Clock className="w-6 h-6 text-blue-400" /> History
      </h2>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
        <input 
          type="text" 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="w-full bg-slate-800 border-none rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3">
        {filteredTxs.map(tx => (
          <div 
            key={tx.id} 
            onClick={() => onSelectTx(tx)}
            className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg">
                {tx.category === 'FOOD' ? '🍔' : 
                 tx.category === 'SHOPPING' ? '🛍️' : 
                 tx.category === 'ENTERTAINMENT' ? '🎬' : 
                 tx.category === 'TRANSPORT' ? '🚕' : '💸'}
              </div>
              <div>
                <p className="font-bold text-white">{tx.merchant}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                  {(tx.amount > 1000 && ['SHOPPING', 'ENTERTAINMENT', 'GAMBLING'].includes(tx.category)) && (
                    <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">IMPULSE</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-white">₹{tx.amount.toLocaleString()}</p>
              <p className="text-xs text-blue-400 flex items-center justify-end gap-1">
                Insights <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
