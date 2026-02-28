import React, { useEffect, useState } from 'react';
import { Send, QrCode, Dices, Edit2, Check } from 'lucide-react';
import { getTransactions, getDashboard, simulateTransactions } from '../services/api';
import toast from 'react-hot-toast';

const CONTACTS = [
  {name: "Rahul", upiId: "rahul@paytm", avatar: "R", color: "bg-blue-500"},
  {name: "Priya", upiId: "priya@gpay", avatar: "P", color: "bg-pink-500"},
  {name: "Mom", upiId: "mom@upi", avatar: "M", color: "bg-emerald-500"},
  {name: "Zomato", upiId: "zomato@upi", avatar: "Z", color: "bg-red-500"},
  {name: "Netflix", upiId: "netflix@upi", avatar: "N", color: "bg-red-600"}
];

export default function PaymentHome({ userId, refreshKey, onPay, onSelectTx, onRefresh, balance, setBalance }: any) {
  const [txs, setTxs] = useState([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState('');

  useEffect(() => {
    getTransactions(userId).then(setTxs).catch(console.error);
    getDashboard(userId).then(data => {
      setDashboard(data);
    }).catch(console.error);
  }, [userId, refreshKey]);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      await simulateTransactions(userId);
      toast.success('Simulated 20 transactions');
      onRefresh();
    } catch (err) {
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = () => {
    // Fake QR Scan
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        toast.loading('Scanning QR...');
        setTimeout(() => {
          toast.dismiss();
          toast.success('QR Scanned!');
          onPay({ name: 'Sarthak Deep', upiId: 'sarthak@upi' });
        }, 1500);
      }
    };
    input.click();
  };

  const saveBalance = () => {
    const val = parseFloat(tempBalance);
    if (!isNaN(val)) {
      setBalance(val);
      setIsEditingBalance(false);
      toast.success('Balance updated');
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Balance Card */}
      <div className="bg-[#050505] rounded-3xl p-8 border border-[#00ff55]/20 text-center relative overflow-hidden shadow-[0_0_30px_rgba(0,255,85,0.05)] group hover:border-[#00ff55]/40 transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-50">
          {dashboard && <div className="text-[10px] font-bold bg-[#00ff55]/10 px-2 py-1 rounded text-[#00ff55] border border-[#00ff55]/20 font-mono">HEALTH: {Math.round(100 - dashboard.riskScore)}</div>}
        </div>
        <p className="text-[#eef2ee]/60 text-xs uppercase tracking-widest font-syne mb-2">Available Balance</p>
        
        <div className="flex items-center justify-center gap-2 mb-4 relative z-10">
          {isEditingBalance ? (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-4xl font-bold text-[#00ff55] font-mono">₹</span>
              <input 
                type="number" 
                value={tempBalance}
                onChange={e => setTempBalance(e.target.value)}
                className="bg-black text-[#00ff55] text-3xl font-bold w-40 rounded-xl px-2 py-1 outline-none border border-[#00ff55] font-mono text-center shadow-[0_0_15px_rgba(0,255,85,0.2)]"
                autoFocus
                onBlur={saveBalance}
                onKeyDown={(e) => e.key === 'Enter' && saveBalance()}
              />
              <button onClick={saveBalance} className="bg-[#00ff55] p-2 rounded-full text-black hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,255,85,0.4)]"><Check className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setTempBalance((balance || 0).toString()); setIsEditingBalance(true); }}>
              <h1 className="text-5xl font-bold text-[#eef2ee] tracking-tighter font-syne group-hover:text-[#00ff55] transition-colors">₹{(balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</h1>
              <Edit2 className="w-4 h-4 text-[#00ff55]/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff55]/50 to-transparent opacity-20"></div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <ActionBtn icon={Send} label="Send Money" onClick={() => onPay()} color="text-[#00ff55]" bg="bg-[#00ff55]/10" border="border-[#00ff55]/20" />
        <ActionBtn icon={QrCode} label="Scan QR" onClick={handleScan} color="text-[#eef2ee]" bg="bg-[#eef2ee]/10" border="border-[#eef2ee]/20" />
      </div>

      {/* Contacts */}
      <div>
        <h3 className="text-xs font-bold text-[#00ff55]/70 mb-4 font-syne uppercase tracking-wider">Recent Contacts</h3>
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
          {CONTACTS.map((c, i) => (
            <button key={i} onClick={() => onPay(c)} className="flex flex-col items-center gap-3 min-w-[70px] group">
              <div className={`w-16 h-16 rounded-full bg-[#050505] border border-[#00ff55]/20 flex items-center justify-center text-[#eef2ee] text-xl font-bold shadow-lg group-hover:border-[#00ff55] group-hover:shadow-[0_0_15px_rgba(0,255,85,0.3)] transition-all relative overflow-hidden`}>
                <span className="relative z-10 font-syne">{c.avatar}</span>
                <div className="absolute inset-0 bg-[#00ff55]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-[10px] font-bold text-[#eef2ee]/60 font-syne uppercase tracking-wider group-hover:text-[#00ff55] transition-colors">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-[#00ff55]/70 font-syne uppercase tracking-wider">Recent Transactions</h3>
          <button onClick={handleSimulate} disabled={loading} className="text-[10px] text-[#eef2ee]/60 flex items-center gap-1 bg-[#050505] border border-[#eef2ee]/10 px-3 py-1.5 rounded-full hover:border-[#00ff55]/50 hover:text-[#00ff55] transition-colors font-mono uppercase">
            <Dices className="w-3 h-3" /> Simulate
          </button>
        </div>
        <div className="space-y-3">
          {txs.slice(0, 5).map((tx: any) => (
            <div key={tx.id} onClick={() => onSelectTx(tx)} className="bg-[#050505] rounded-2xl p-5 flex items-center justify-between border border-[#00ff55]/10 hover:border-[#00ff55]/40 active:scale-[0.98] transition-all cursor-pointer group shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black border border-[#00ff55]/20 flex items-center justify-center text-lg font-bold text-[#00ff55] font-syne group-hover:shadow-[0_0_10px_rgba(0,255,85,0.2)] transition-shadow">
                  {tx.merchant.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#eef2ee] font-syne group-hover:text-[#00ff55] transition-colors">{tx.merchant}</p>
                  <p className="text-xs text-[#eef2ee]/40 font-mono mt-0.5">{new Date(tx.timestamp).toLocaleDateString([], {month:'short', day:'numeric'})} • {tx.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#eef2ee] font-mono text-lg">-₹{(tx.amount || 0).toLocaleString()}</p>
                {tx.mood && <p className="text-[10px] mt-1 opacity-60">{tx.mood}</p>}
              </div>
            </div>
          ))}
          {txs.length === 0 && <p className="text-center text-[#eef2ee]/30 py-8 text-sm font-dm italic">No recent transactions. Start spending (wisely)!</p>}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, color, bg, border }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-3 w-full bg-[#050505] p-6 rounded-3xl border ${border || 'border-[#00ff55]/10'} hover:bg-[#00ff55]/5 hover:border-[#00ff55]/30 transition-all group active:scale-95 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
      <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_10px_rgba(0,255,85,0.1)]`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <span className="text-xs font-bold text-[#eef2ee]/80 font-syne uppercase tracking-wider group-hover:text-[#eef2ee] transition-colors">{label}</span>
    </button>
  );
}
