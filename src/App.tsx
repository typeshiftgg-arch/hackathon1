import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import PaymentHome from './components/PaymentHome';
import PaymentFlow from './components/PaymentFlow';
import PostPaymentInsights from './components/PostPaymentInsights';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import InterventionPanel from './components/InterventionPanel';
import HistoryPanel from './components/HistoryPanel';
import GoalsPanel from './components/DreamsPanel';
import CategoryManager from './components/CategoryManager';
import Login from './components/Login';
import axios from 'axios';
import { Menu } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [userId] = useState('demo_user');
  const [refreshKey, setRefreshKey] = useState(0);
  const [paymentState, setPaymentState] = useState<any>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showInterventions, setShowInterventions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balance, setBalance] = useState(12450.00);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Ensure demo user exists
    axios.post('/api/users', {
      userId: 'demo_user',
      monthlyIncome: 50000,
      savingsGoal: 10000
    }).catch(console.error);
  }, []);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const navigateToPay = (contact?: any) => {
    setPaymentState({ step: 'INITIATE', contact });
    setCurrentTab('pay');
  };

  const closePayment = () => {
    setPaymentState(null);
    setCurrentTab('home');
    triggerRefresh();
  };

  const handlePaymentSuccess = (tx: any) => {
    setPaymentState(null);
    setCurrentTab('home');
    setSelectedTx(tx);
    triggerRefresh();
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setSelectedTx(null);
    setShowInterventions(false);
    setPaymentState(null);
    setIsSidebarOpen(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={(name: string) => { setUserName(name); setIsLoggedIn(true); }} />;
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans flex">
      <Toaster position="top-center" toastOptions={{ style: { background: '#050505', color: '#F8FAFC', border: '1px solid #00ff55' } }} />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out h-full border-r border-[#00ff55]/10 bg-black`}>
        <Sidebar currentTab={currentTab} setCurrentTab={handleTabChange} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-black">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-[#00ff55]/10 bg-black">
          <button onClick={() => setIsSidebarOpen(true)} className="mr-4 text-[#00ff55]">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold font-syne text-white">PaisaPulse <span className="text-[#00ff55]">💸</span></h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TopBar userId={userId} refreshKey={refreshKey} onBellClick={() => setShowInterventions(true)} userName={userName} />
          
          <main className="max-w-md mx-auto md:max-w-4xl px-4 pt-6 pb-20 animate-in fade-in duration-500 slide-in-from-bottom-4">
            {showInterventions ? (
              <div>
                <button onClick={() => setShowInterventions(false)} className="mb-4 text-blue-400">← Back</button>
                <InterventionPanel userId={userId} refreshKey={refreshKey} onRefresh={triggerRefresh} />
              </div>
            ) : selectedTx ? (
              <PostPaymentInsights tx={selectedTx} onClose={() => setSelectedTx(null)} userId={userId} />
            ) : currentTab === 'home' ? (
              <PaymentHome userId={userId} refreshKey={refreshKey} onPay={navigateToPay} onSelectTx={setSelectedTx} onRefresh={triggerRefresh} balance={balance} setBalance={setBalance} />
            ) : currentTab === 'dashboard' ? (
              <Dashboard userId={userId} refreshKey={refreshKey} />
            ) : currentTab === 'pay' ? (
              <PaymentFlow userId={userId} paymentState={paymentState} setPaymentState={setPaymentState} onClose={closePayment} onSuccess={handlePaymentSuccess} balance={balance} setBalance={setBalance} />
            ) : currentTab === 'history' ? (
              <HistoryPanel userId={userId} onSelectTx={setSelectedTx} />
            ) : currentTab === 'goals' ? (
              <GoalsPanel userId={userId} balance={balance} setBalance={setBalance} />
            ) : currentTab === 'categories' ? (
              <CategoryManager userId={userId} onClose={() => handleTabChange('home')} />
            ) : currentTab === 'profile' ? (
              <UserProfile userId={userId} refreshKey={refreshKey} onRefresh={triggerRefresh} />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
