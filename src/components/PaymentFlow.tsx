import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { addTransaction, getTransactions, getDashboard } from '../services/api';
import { calculateRiskScore, RiskAnalysisResult } from '../utils/riskEngine';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function PaymentFlow({ userId, paymentState, setPaymentState, onClose, onSuccess, balance, setBalance }: any) {
  const [step, setStep] = useState(paymentState?.step || 'INITIATE');
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    recipient: paymentState?.contact?.name || '',
    upiId: paymentState?.contact?.upiId || '',
    amount: '',
    category: 'FOOD',
    note: '',
  });
  const [memoryData, setMemoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [completedTx, setCompletedTx] = useState<any>(null);
  const [riskData, setRiskData] = useState<RiskAnalysisResult | null>(null);
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    axios.get(`/api/categories/${userId}`).then(res => {
      if (res.data.length > 0) {
        setCategories(res.data);
        setForm(f => ({ ...f, category: res.data[0].name }));
      }
    }).catch(console.error);
    
    getTransactions(userId).then(setTxHistory).catch(console.error);
    getDashboard(userId).then(setDashboard).catch(console.error);
  }, [userId]);

  const handleNext = async () => {
    if (!form.recipient || !form.amount) return;
    
    if (Number(form.amount) > balance) {
      toast.error('Insufficient Balance');
      return;
    }

    setLoading(true);
    try {
      const merchantTxs = txHistory.filter((t: any) => 
        t.merchant.toLowerCase() === form.recipient.toLowerCase() || 
        t.recipient?.toLowerCase() === form.recipient.toLowerCase()
      ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      if (merchantTxs.length > 0) {
        // Not the first time
        const lastTx = merchantTxs[0];
        let message = lastTx.note;

        // If no note from user, generate AI guilt quote
        if (!message) {
           const res = await axios.post('/api/gemini/pre-payment', {
            category: form.category,
            amount: form.amount,
            merchant: form.recipient,
            previousTxs: merchantTxs
          });
          message = res.data.message;
        }
        
        setMemoryData({
          message: message || "Think about if you really need this.",
          count: merchantTxs.length,
          total: merchantTxs.reduce((s: number, t: any) => s + t.amount, 0),
          lastDate: new Date(lastTx.timestamp).toLocaleDateString(),
          isAiGenerated: !lastTx.note
        });
        setStep('MEMORY');
      } else {
        // First time -> Skip Memory, go to Confirm
        setStep('CONFIRM');
      }
    } catch (e) {
      setStep('CONFIRM');
    } finally {
      setLoading(false);
    }
  };

  const calculateRisk = () => {
    if (!dashboard) return;
    const result = calculateRiskScore(
      Number(form.amount),
      form.category,
      txHistory,
      dashboard.monthlyIncome || 50000,
      balance
    );
    setRiskData(result);
    setRiskModalOpen(true);
  };

  const handlePay = async (action: string) => {
    // If risk modal hasn't been shown/accepted yet, show it
    if (!riskModalOpen && !completedTx) {
      calculateRisk();
      return;
    }

    setLoading(true);
    try {
      const newTx = await addTransaction({
        userId,
        amount: Number(form.amount),
        category: form.category,
        merchant: form.recipient,
        recipient: form.recipient,
        upiId: form.upiId || `${form.recipient.toLowerCase().replace(/\s/g, '')}@upi`,
        note: form.note,
        mood: '😐', // Default mood since feature is removed
        isImpulsive: riskData?.riskLevel === 'High',
        prePaymentMemoryShown: step === 'MEMORY',
        prePaymentAction: action
      });
      setCompletedTx(newTx);
      if (setBalance) {
        setBalance((prev: number) => prev - Number(form.amount));
      }
      setRiskModalOpen(false);
      setStep('SUCCESS');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'SUCCESS') {
    return (
      <div className="fixed inset-0 bg-[#000000] z-50 flex flex-col items-center justify-center text-[#eef2ee] animate-in fade-in duration-500">
        <div className="w-40 h-40 bg-[#00ff55]/10 rounded-full flex items-center justify-center mb-10 animate-bounce border border-[#00ff55]/30 shadow-[0_0_50px_rgba(0,255,85,0.2)]">
          <CheckCircle className="w-20 h-20 text-[#00ff55]" />
        </div>
        <h2 className="text-7xl font-bold mb-6 tracking-tighter font-syne text-white">₹{Number(form.amount).toLocaleString()}</h2>
        <p className="text-[#eef2ee]/60 text-2xl mb-16 font-dm">Paid successfully to <span className="text-[#00ff55] font-bold">{form.recipient}</span></p>
        
        <button 
          onClick={() => onSuccess(completedTx)}
          className="bg-[#00ff55] hover:bg-[#00cc44] text-[#06090d] px-12 py-5 rounded-full font-bold text-xl shadow-[0_0_30px_rgba(0,255,85,0.4)] hover:scale-105 transition-transform font-syne uppercase tracking-wider"
        >
          View Insights
        </button>
      </div>
    );
  }

  if (riskModalOpen && riskData) {
    const riskColor = riskData.riskLevel === 'High' ? 'bg-red-500' : riskData.riskLevel === 'Caution' ? 'bg-yellow-500' : 'bg-emerald-500';
    const textColor = riskData.riskLevel === 'High' ? 'text-red-400' : riskData.riskLevel === 'Caution' ? 'text-yellow-400' : 'text-emerald-400';

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col p-6 animate-in slide-in-from-bottom-10 overflow-y-auto">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white font-syne">Risk Analysis</h2>
            <button onClick={() => setRiskModalOpen(false)} className="text-[#eef2ee]/60 hover:text-white">Close</button>
          </div>

          <div className="bg-[#050505] rounded-2xl p-6 border border-[#00ff55]/20 mb-6 shadow-[0_0_20px_rgba(0,255,85,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#eef2ee]/60 font-dm">Risk Level</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white font-syne tracking-wide ${riskColor}`}>
                {riskData.riskLevel.toUpperCase()}
              </span>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#eef2ee]/60 font-dm">Impulse Index</span>
                <span className={`font-bold font-mono ${textColor}`}>{riskData.impulseIndex}/100</span>
              </div>
              <div className="w-full bg-black rounded-full h-3 border border-[#00ff55]/10">
                <div className={`h-3 rounded-full ${riskColor}`} style={{width: `${riskData.impulseIndex}%`}}></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-[#eef2ee]/60 border-b border-[#00ff55]/10 pb-2 font-syne uppercase tracking-wide">Why was this flagged?</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#eef2ee]/60 font-dm">Behavioral Deviation</span>
                  <div className="w-24 bg-black rounded-full h-1.5 border border-[#00ff55]/10">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${(riskData.explanationBreakdown.behavioralDeviation.score/30)*100}%`}}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#eef2ee]/60 font-dm">Temporal Vulnerability</span>
                  <div className="w-24 bg-black rounded-full h-1.5 border border-[#00ff55]/10">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${(riskData.explanationBreakdown.temporalVulnerability.score/20)*100}%`}}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#eef2ee]/60 font-dm">Financial Pressure</span>
                  <div className="w-24 bg-black rounded-full h-1.5 border border-[#00ff55]/10">
                    <div className="bg-orange-500 h-1.5 rounded-full" style={{width: `${(riskData.explanationBreakdown.financialPressure.score/25)*100}%`}}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#eef2ee]/60 font-dm">Habit Escalation</span>
                  <div className="w-24 bg-black rounded-full h-1.5 border border-[#00ff55]/10">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{width: `${(riskData.explanationBreakdown.habitEscalation.score/25)*100}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-xl mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-sm text-blue-200 font-dm">
                {riskData.riskLevel === 'High' 
                  ? "This transaction shows signs of high impulsivity. Consider waiting 24 hours." 
                  : riskData.riskLevel === 'Caution'
                  ? "This is slightly outside your normal pattern. Proceed with awareness."
                  : "This looks like a safe, planned transaction."}
              </p>
            </div>
          </div>

          <button 
            onClick={() => handlePay('COMPLETED')}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mb-3 font-syne uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-colors"
          >
            Proceed Anyway
          </button>
          <button 
            onClick={() => setRiskModalOpen(false)}
            className="w-full bg-black text-[#eef2ee]/60 font-bold py-4 rounded-xl border border-[#00ff55]/20 hover:text-white hover:border-[#00ff55] transition-colors font-syne uppercase tracking-wider"
          >
            Cancel & Review
          </button>
        </div>
      </div>
    );
  }

  if (step === 'CONFIRM') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setStep('INITIATE')}><ArrowLeft className="w-6 h-6 text-[#00ff55]" /></button>
          <h2 className="text-xl font-bold font-syne text-white">Confirm Payment</h2>
        </div>
        
        <div className="bg-[#050505] rounded-2xl p-6 text-center border border-[#00ff55]/20 shadow-[0_0_30px_rgba(0,255,85,0.05)]">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 font-syne text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            {form.recipient.charAt(0)}
          </div>
          <p className="text-[#eef2ee]/60 text-sm font-dm uppercase tracking-wide">Paying</p>
          <p className="text-xl font-bold text-white mb-6 font-syne">{form.recipient}</p>
          <h1 className="text-5xl font-mono text-white mb-6 tracking-tighter">₹{form.amount}</h1>
          
          <div className="bg-black rounded-xl p-4 text-left mb-6 border border-[#00ff55]/10">
            <p className="text-sm text-[#eef2ee]/60 mb-1 font-dm">Category: <span className="text-[#00ff55] font-syne uppercase tracking-wide">{form.category}</span></p>
            {form.note && <p className="text-sm text-[#eef2ee]/60 font-dm">Guilt Note: <span className="text-white italic">"{form.note}"</span></p>}
          </div>

          <div className="mb-6">
            <p className="text-sm text-[#eef2ee]/60 mb-4 font-dm uppercase tracking-wide">Enter 4-digit PIN</p>
            <div className="flex justify-center gap-4">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border border-[#00ff55]/30 ${pin.length > i ? 'bg-[#00ff55] shadow-[0_0_10px_rgba(0,255,85,0.5)]' : 'bg-black'}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-[200px] mx-auto">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => setPin(p => p.length < 4 ? p + n : p)} className="text-2xl font-medium py-2 text-white hover:text-[#00ff55] transition-colors font-mono">{n}</button>
              ))}
              <div />
              <button onClick={() => setPin(p => p.length < 4 ? p + '0' : p)} className="text-2xl font-medium py-2 text-white hover:text-[#00ff55] transition-colors font-mono">0</button>
              <button onClick={() => setPin(p => p.slice(0,-1))} className="text-lg font-medium py-2 text-[#eef2ee]/40 hover:text-[#ff4455] transition-colors">⌫</button>
            </div>
          </div>

          <button 
            onClick={() => calculateRisk()}
            disabled={pin.length < 4 || loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 hover:bg-blue-500 transition-colors font-syne uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'MEMORY') {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col p-6 animate-in slide-in-from-bottom-10">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold text-white mb-6 text-center font-syne">A moment before you pay... 🧠</h2>
          
          <div className="bg-[#050505] border-l-4 border-[#F59E0B] rounded-r-2xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.1)] mb-6 border-y border-r border-[#F59E0B]/20">
            <h3 className="text-sm text-[#eef2ee]/60 mb-3 font-medium uppercase tracking-wider font-syne">
              {memoryData?.isAiGenerated ? "Something to consider..." : `Last time you paid ${form.recipient}...`}
            </h3>
            <p className="text-lg text-[#eef2ee] leading-relaxed italic font-dm">"{memoryData?.message}"</p>
            {!memoryData?.isAiGenerated && <p className="text-xs text-[#eef2ee]/40 mt-2 text-right font-mono">- You, on {memoryData?.lastDate}</p>}
          </div>

          <div className="bg-[#050505] rounded-2xl p-4 mb-8 border border-[#00ff55]/20 shadow-[0_0_15px_rgba(0,255,85,0.05)]">
            <p className="text-sm text-[#eef2ee]/80 mb-2 font-dm">
              You've spent <strong className="text-[#00ff55] font-mono">₹{memoryData?.total?.toLocaleString()}</strong> on {form.recipient} so far ({memoryData?.count} times).
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <button 
              onClick={() => {
                onClose();
              }}
              className="w-full bg-black hover:bg-[#050505] text-white font-bold py-4 rounded-xl border border-[#00ff55]/20 font-syne uppercase tracking-wider transition-colors"
            >
              Think About It ✋
            </button>
            <button 
              onClick={() => setStep('CONFIRM')}
              className="w-full bg-blue-600/10 text-blue-400 font-bold py-4 rounded-xl hover:bg-blue-600/20 transition-colors font-syne uppercase tracking-wider border border-blue-500/20"
            >
              Skip, Pay Now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onClose}><ArrowLeft className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold">Send Money</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[#eef2ee]/60 mb-1 font-syne uppercase tracking-wider">To</label>
          <input 
            type="text" 
            value={form.recipient}
            onChange={e => setForm({...form, recipient: e.target.value})}
            placeholder="Name or UPI ID"
            className="w-full bg-black border-b-2 border-[#00ff55]/20 px-0 py-3 text-xl text-white focus:border-[#00ff55] outline-none placeholder:text-[#eef2ee]/20 font-syne transition-colors"
          />
        </div>

        <div className="pt-4">
          <input 
            type="number" 
            value={form.amount}
            onChange={e => setForm({...form, amount: e.target.value})}
            placeholder="₹ 0"
            className="w-full bg-transparent text-center text-5xl font-mono text-white outline-none placeholder:text-[#eef2ee]/20"
            autoFocus
          />
        </div>

        <div className="pt-6">
          <label className="block text-sm text-[#00ff55]/70 mb-3 font-syne uppercase tracking-wider">Category</label>
          <div className="flex flex-wrap gap-3 pb-2">
            {categories.map(c => (
              <button 
                key={c.id}
                onClick={() => setForm({...form, category: c.name})}
                className={`px-4 py-3 rounded-xl border flex flex-col items-center gap-2 transition-all min-w-[80px] flex-1 ${form.category === c.name ? 'bg-[#00ff55] border-[#00ff55] text-black shadow-[0_0_15px_rgba(0,255,85,0.4)] scale-105' : 'bg-[#050505] border-[#00ff55]/20 text-[#eef2ee]/60 hover:bg-[#00ff55]/10 hover:text-[#00ff55]'}`}
              >
                <span className="text-2xl">{c.icon}</span> 
                <span className="text-xs font-bold truncate w-full text-center font-syne uppercase tracking-wider">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#00ff55]/70 mb-1 font-syne uppercase tracking-wider">Guilt Note (Optional)</label>
          <input 
            type="text" 
            value={form.note}
            onChange={e => setForm({...form, note: e.target.value})}
            placeholder="Why do you feel guilty about this?"
            className="w-full bg-[#050505] border border-[#00ff55]/20 rounded-xl px-4 py-3 text-[#eef2ee] focus:border-[#00ff55] outline-none font-dm placeholder:text-[#eef2ee]/20"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-[#00ff55]/10 md:max-w-2xl md:mx-auto">
        <button 
          onClick={handleNext}
          disabled={!form.recipient || !form.amount || loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 hover:bg-blue-500 transition-colors font-syne uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          {loading ? 'Processing...' : 'Proceed to Pay'}
        </button>
      </div>
    </div>
  );
}
