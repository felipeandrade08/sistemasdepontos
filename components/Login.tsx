
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Employee } from '../types';
import { KeyRound, AlertCircle } from 'lucide-react';
import GenerativeLogo from './GenerativeLogo';

interface LoginProps {
  onLogin: (user: Employee) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    // Initial setup if no employees exist (Admin default)
    const emps = storage.getEmployees();
    if (emps.length === 0) {
      const defaultAdmin: Employee = {
        id: 'admin',
        name: 'Administrador Principal',
        email: 'admin@ponto.pro',
        role: 'Diretoria',
        contractHoursPerDay: 8,
        hourlyRate: 0,
        active: true,
        createdAt: Date.now(),
        pin: '1234',
        isAdmin: true
      };
      storage.addEmployee(defaultAdmin);
      setEmployees([defaultAdmin]);
    } else {
      setEmployees(emps);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = employees.find(emp => emp.pin === pin);
    if (user) {
      onLogin(user);
    } else {
      setError('PIN inválido. Tente novamente.');
      setPin('');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <GenerativeLogo size={80} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sistema de Pontos Pro</h1>
          <p className="text-slate-500 mt-2 font-medium">Insira seu código de acesso para continuar</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">PIN de Acesso</label>
              <div className="relative group">
                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={24} />
                <input 
                  type="password" 
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full pl-16 pr-4 py-5 bg-slate-50 border-4 border-slate-50 rounded-[2rem] text-center text-4xl font-mono tracking-[0.8em] focus:border-indigo-100 focus:bg-white outline-none transition-all placeholder:text-slate-100"
                  placeholder="••••"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-4 text-center font-bold uppercase tracking-widest italic">Acesso padrão Admin: 1234</p>
            </div>

            <button 
              type="submit"
              disabled={pin.length < 4}
              className={`w-full py-5 rounded-[2rem] font-black text-xl transition-all shadow-xl ${
                pin.length === 4 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 active:scale-95' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              Acessar Painel
            </button>
          </form>
        </div>

        <div className="mt-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          Sistema de Pontos Pro © 2025
        </div>
      </div>
    </div>
  );
};

export default Login;
