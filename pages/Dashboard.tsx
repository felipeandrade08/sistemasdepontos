
import React, { useMemo, useState, useEffect } from 'react';
import { Employee, PointLog, SystemAlert, SystemConfig } from '../types';
import { storage } from '../services/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserCheck, Clock, TrendingUp, Bell, AlertTriangle, CheckCircle, Flame, CalendarX, UserMinus, AlertCircle, MapPin, Timer } from 'lucide-react';
import { format, isToday, subDays, startOfDay, endOfDay, isWeekend, isSameDay, parse, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  employees: Employee[];
  logs: PointLog[];
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ employees, logs, onRefresh }) => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [config, setConfig] = useState<SystemConfig>({ delayTolerance: 15 });

  useEffect(() => {
    const systemConfig = storage.getSystemConfig();
    setConfig(systemConfig);
    checkInconsistencies(systemConfig);
    setAlerts(storage.getAlerts());
  }, [logs, employees]);

  const checkInconsistencies = (systemConfig: SystemConfig) => {
    const today = new Date();
    // Verificamos os últimos 7 dias
    for (let i = 1; i <= 7; i++) {
      const targetDate = subDays(today, i);
      if (isWeekend(targetDate)) continue;

      const dateStr = format(targetDate, 'dd/MM/yyyy');
      
      employees.forEach(emp => {
        if (!emp.active || emp.isAdmin) return;

        const dayLogs = logs.filter(l => 
          l.employeeId === emp.id && 
          isSameDay(new Date(l.timestamp), targetDate)
        ).sort((a, b) => a.timestamp - b.timestamp);

        // 1. Verificação de falta total ou ponto incompleto
        if (dayLogs.length === 0) {
          const alert: SystemAlert = {
            id: `missing-total-${emp.id}-${dateStr}`,
            type: 'MISSING_POINT',
            employeeId: emp.id,
            employeeName: emp.name,
            date: dateStr,
            message: `FALTA: Nenhum registro encontrado em dia útil.`,
            isRead: false,
            timestamp: Date.now(),
            details: { missingType: 'TOTAL' }
          };
          storage.addAlert(alert);
        } else if (dayLogs.length % 2 !== 0) {
          const alert: SystemAlert = {
            id: `missing-partial-${emp.id}-${dateStr}`,
            type: 'MISSING_POINT',
            employeeId: emp.id,
            employeeName: emp.name,
            date: dateStr,
            message: `INCONSISTÊNCIA: Ponto incompleto (batida sem par).`,
            isRead: false,
            timestamp: Date.now(),
            details: { missingType: 'PARTIAL' }
          };
          storage.addAlert(alert);
        }

        // 2. Verificação de atraso considerando a tolerância
        if (dayLogs.length > 0 && emp.expectedStartTime) {
          const firstPunch = dayLogs.find(l => l.type === 'IN');
          if (firstPunch) {
            const punchDate = new Date(firstPunch.timestamp);
            const expectedTimeStr = emp.expectedStartTime;
            const expectedDate = parse(expectedTimeStr, 'HH:mm', targetDate);
            
            const diff = differenceInMinutes(punchDate, expectedDate);
            
            if (diff > systemConfig.delayTolerance) {
              const alert: SystemAlert = {
                id: `delay-${emp.id}-${dateStr}`,
                type: 'DELAY',
                employeeId: emp.id,
                employeeName: emp.name,
                date: dateStr,
                message: `ATRASO: Entrada fora da tolerância de ${systemConfig.delayTolerance}min.`,
                isRead: false,
                timestamp: Date.now(),
                details: { 
                  delayMinutes: diff, 
                  expectedTime: expectedTimeStr, 
                  actualTime: format(punchDate, 'HH:mm') 
                }
              };
              storage.addAlert(alert);
            }
          }
        }
      });
    }
  };

  const stats = useMemo(() => {
    const today = new Date();
    const todayLogs = logs.filter(log => isToday(new Date(log.timestamp)));
    const activeToday = new Set(todayLogs.map(l => l.employeeId)).size;
    
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const dayStart = startOfDay(date).getTime();
      const dayEnd = endOfDay(date).getTime();
      const dayLogs = logs.filter(l => l.timestamp >= dayStart && l.timestamp <= dayEnd);
      const uniqueEmps = new Set(dayLogs.map(l => l.employeeId)).size;
      return {
        name: format(date, 'EEE', { locale: ptBR }),
        presentes: uniqueEmps
      };
    });

    const unreadAlerts = storage.getAlerts().filter(a => !a.isRead);
    const inconsistencies = unreadAlerts.filter(a => a.type === 'MISSING_POINT' || a.type === 'DELAY').length;

    return { activeToday, totalEmployees: employees.length, last7Days, inconsistencies };
  }, [employees, logs]);

  const handleClearAlert = (id: string) => {
    storage.markAlertAsRead(id);
    setAlerts(storage.getAlerts());
    onRefresh();
  };

  const unreadAlerts = alerts.filter(a => !a.isRead);

  return (
    <div className="space-y-6 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Controle</h2>
          <p className="text-slate-500 font-medium">Gestão centralizada e monitoramento de tolerância ({config.delayTolerance}m).</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className={`p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm transition-all group-hover:border-indigo-100 ${unreadAlerts.length > 0 ? 'animate-bounce' : ''}`}>
              <Bell size={24} className={unreadAlerts.length > 0 ? 'text-indigo-600' : 'text-slate-400'} />
            </div>
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 border-4 border-white rounded-full flex items-center justify-center text-[10px] text-white font-black">
                {unreadAlerts.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-lg transition-all">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
            <UserCheck size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativos Hoje</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stats.activeToday}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-lg transition-all">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Equipe</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stats.totalEmployees}</h3>
          </div>
        </div>

        <div className={`p-6 rounded-[2rem] shadow-sm border flex items-center gap-4 group hover:shadow-lg transition-all ${stats.inconsistencies > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
          <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${stats.inconsistencies > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
            <AlertCircle size={28} />
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${stats.inconsistencies > 0 ? 'text-red-700' : 'text-slate-400'}`}>Inconsistências</p>
            <h3 className={`text-3xl font-black tracking-tighter ${stats.inconsistencies > 0 ? 'text-red-600' : 'text-slate-800'}`}>{stats.inconsistencies}</h3>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-4 group hover:scale-[1.02] transition-all">
          <div className="p-4 bg-indigo-600 rounded-2xl">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Registros Mês</p>
            <h3 className="text-3xl font-black tracking-tighter">{logs.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification Center */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Fila de Revisão Administrativa</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Últimos Alertas</span>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {unreadAlerts.length > 0 ? unreadAlerts.map(alert => {
              const isMissing = alert.type === 'MISSING_POINT';
              const isOvertime = alert.type === 'OVERTIME';
              const isDelay = alert.type === 'DELAY';
              
              return (
                <div key={alert.id} className={`bg-white p-6 rounded-[2rem] shadow-sm border-2 flex items-center justify-between group transition-all hover:scale-[1.01] ${isMissing ? 'border-red-50 hover:border-red-200' : isOvertime ? 'border-amber-50 hover:border-amber-200' : isDelay ? 'border-indigo-50 hover:border-indigo-200' : 'border-slate-50'}`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-4 ${isMissing ? 'bg-red-50 text-red-600 border-red-100' : isOvertime ? 'bg-amber-50 text-amber-600 border-amber-100' : isDelay ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {isMissing ? <CalendarX size={28} /> : isOvertime ? <Flame size={28} /> : isDelay ? <Timer size={28} /> : <AlertTriangle size={28} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-black text-slate-900 tracking-tight">{alert.employeeName}</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${isMissing ? 'bg-red-100 text-red-700' : isOvertime ? 'bg-amber-100 text-amber-700' : isDelay ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                          {isMissing ? 'FALTA' : isOvertime ? 'HORA EXTRA' : isDelay ? 'ATRASO' : 'ALERTA'}
                        </span>
                      </div>
                      <p className={`text-sm font-bold mt-0.5 leading-tight ${isMissing ? 'text-red-700/80' : isOvertime ? 'text-amber-700/80' : 'text-indigo-700/80'}`}>
                        {alert.message}
                      </p>
                      {isDelay && alert.details && (
                        <p className="text-[10px] font-black text-indigo-400 mt-1 uppercase">
                          Esperado: {alert.details.expectedTime} | Real: {alert.details.actualTime} (+{alert.details.delayMinutes}min)
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Data: {alert.date}</span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{format(alert.timestamp, "HH:mm 'de' dd/MM")}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleClearAlert(alert.id)}
                    className="p-4 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all shadow-sm active:scale-90"
                    title="Resolver Pendência"
                  >
                    <CheckCircle size={28} />
                  </button>
                </div>
              );
            }) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm mb-6">
                  <CheckCircle size={40} />
                </div>
                <h4 className="text-xl font-black text-slate-800">Tudo em dia!</h4>
                <p className="text-slate-500 max-w-xs mt-2 font-medium">Não há inconsistências ou atrasos pendentes de revisão.</p>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Widgets */}
        <aside className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" /> Presença Semanal
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.last7Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="presentes" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <MapPin size={120} />
            </div>
            <h3 className="text-lg font-black mb-6 flex items-center gap-2 relative z-10">
              <MapPin size={20} className="text-indigo-400" /> Monitor GPS
            </h3>
            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar-dark relative z-10">
              {logs.slice(-6).reverse().map(log => {
                const emp = employees.find(e => e.id === log.employeeId);
                return (
                  <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${log.location?.isAuthorized ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-400'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate">{emp?.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{log.location?.isAuthorized ? 'Na Sede' : 'Externo'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black font-mono">{format(log.timestamp, 'HH:mm')}</span>
                      <p className="text-[8px] text-indigo-400 font-black uppercase">{log.type === 'IN' ? 'Entrada' : 'Saída'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
