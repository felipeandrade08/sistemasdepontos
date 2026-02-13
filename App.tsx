
import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { Employee, PointLog, AppState } from './types';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import ClockIn from './pages/ClockIn';
import Login from './components/Login';
import GenerativeLogo from './components/GenerativeLogo';
import { Users, LayoutDashboard, Clock, FileText, LogOut, ShieldCheck, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

type Page = 'dashboard' | 'employees' | 'reports' | 'clock';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AppState>({ user: null, isAuthenticated: false });
  const [activePage, setActivePage] = useState<Page>('clock');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('IDLE');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const storedUser = localStorage.getItem('chronos_session');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setAuthState({ user, isAuthenticated: true });
      setActivePage(user.isAdmin ? 'dashboard' : 'clock');
    }
    refreshData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Logic
  useEffect(() => {
    if (isOnline && storage.getUnsyncedLogs().length > 0) {
      performSync();
    }
  }, [isOnline]);

  const performSync = async () => {
    setIsSyncing(true);
    setSyncStatus('SYNCING');
    
    // Simulate network delay for syncing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const unsynced = storage.getUnsyncedLogs();
    const ids = unsynced.map(l => l.id);
    storage.markAsSynced(ids);
    
    setSyncStatus('SUCCESS');
    refreshData();
    
    setTimeout(() => {
      setSyncStatus('IDLE');
      setIsSyncing(false);
    }, 3000);
  };

  const refreshData = () => {
    setEmployees(storage.getEmployees());
    setLogs(storage.getLogs());
  };

  const handleLogin = (user: Employee) => {
    setAuthState({ user, isAuthenticated: true });
    localStorage.setItem('chronos_session', JSON.stringify(user));
    setActivePage(user.isAdmin ? 'dashboard' : 'clock');
  };

  const handleLogout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    localStorage.removeItem('chronos_session');
  };

  if (!authState.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return authState.user?.isAdmin ? <Dashboard employees={employees} logs={logs} onRefresh={refreshData} /> : <ClockIn user={authState.user!} employees={employees} onRefresh={refreshData} />;
      case 'employees':
        return authState.user?.isAdmin ? <Employees employees={employees} onRefresh={refreshData} /> : null;
      case 'reports':
        return authState.user?.isAdmin ? <Reports employees={employees} logs={logs} /> : null;
      case 'clock':
        return <ClockIn user={authState.user!} employees={employees} onRefresh={refreshData} />;
      default:
        return <ClockIn user={authState.user!} employees={employees} onRefresh={refreshData} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Connectivity Alert */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white px-4 py-2 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest animate-in slide-in-from-top-full duration-300">
          <WifiOff size={14} /> Você está offline. Os registros serão salvos localmente.
        </div>
      )}
      
      {syncStatus !== 'IDLE' && (
        <div className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-colors duration-500 ${syncStatus === 'SYNCING' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
          {syncStatus === 'SYNCING' ? (
            <><RefreshCw size={14} className="animate-spin" /> Sincronizando registros pendentes...</>
          ) : (
            <><CheckCircle2 size={14} /> Sincronização concluída!</>
          )}
        </div>
      )}

      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col sticky top-0 h-screen shadow-2xl transition-all">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GenerativeLogo size={40} />
            <h1 className="text-xl font-bold tracking-tight leading-tight">Sistema de Pontos</h1>
          </div>
          {authState.user?.isAdmin && <ShieldCheck size={16} className="text-indigo-400" title="Admin Mode" />}
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {authState.user?.isAdmin && (
            <>
              <button 
                onClick={() => setActivePage('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <LayoutDashboard size={20} />
                <span className="font-medium">Dashboard</span>
              </button>
              <button 
                onClick={() => setActivePage('employees')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === 'employees' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Users size={20} />
                <span className="font-medium">Funcionários</span>
              </button>
              <button 
                onClick={() => setActivePage('reports')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === 'reports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <FileText size={20} />
                <span className="font-medium">Relatórios</span>
              </button>
            </>
          )}

          <button 
            onClick={() => setActivePage('clock')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === 'clock' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Clock size={20} />
            <span className="font-medium">Registrar Ponto</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold uppercase">
              {authState.user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{authState.user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{authState.user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <GenerativeLogo size={32} />
          <span className="font-bold text-lg">Sistema de Pontos</span>
        </div>
        <button onClick={handleLogout} className="text-slate-400"><LogOut size={20}/></button>
      </div>

      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;
