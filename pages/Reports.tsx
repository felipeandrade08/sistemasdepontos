
import React, { useMemo, useState } from 'react';
import { Employee, PointLog } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// Fix: Added missing CheckCircle import from lucide-react
import { Filter, Search, Download, DollarSign, AlertCircle, TrendingUp, BarChart3, AlertTriangle, Heart, CalendarX, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ReportsProps {
  employees: Employee[];
  logs: PointLog[];
}

const Reports: React.FC<ReportsProps> = ({ employees, logs }) => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');

  const reportData = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const businessDaysCount = daysInMonth.filter(d => !isWeekend(d)).length;

    return employees.map(emp => {
      const empLogs = logs.filter(l => 
        l.employeeId === emp.id && 
        l.timestamp >= monthStart.getTime() && 
        l.timestamp <= monthEnd.getTime()
      ).sort((a, b) => a.timestamp - b.timestamp);

      let totalMinutes = 0;
      let missingDays: string[] = [];
      let incompleteDays: string[] = [];

      daysInMonth.forEach(day => {
        const dayLogs = empLogs.filter(l => isSameDay(new Date(l.timestamp), day));
        
        if (!isWeekend(day)) {
           if (dayLogs.length === 0) {
             missingDays.push(format(day, 'dd/MM'));
           } else if (dayLogs.length % 2 !== 0) {
             incompleteDays.push(format(day, 'dd/MM'));
           }
        }

        for (let i = 0; i < dayLogs.length - 1; i += 2) {
          const start = dayLogs[i];
          const end = dayLogs[i+1];
          if ((start.type === 'IN' || start.type === 'BREAK_END') && (end.type === 'OUT' || end.type === 'BREAK_START')) {
            totalMinutes += (end.timestamp - start.timestamp) / 60000;
          }
        }
      });

      const totalHours = totalMinutes / 60;
      const expectedHours = businessDaysCount * emp.contractHoursPerDay;
      const balanceHours = totalHours - expectedHours;
      const totalPayment = totalHours * emp.hourlyRate;
      const performanceRatio = expectedHours > 0 ? (totalHours / expectedHours) : 1;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        totalHours,
        expectedHours,
        hourlyRate: emp.hourlyRate,
        totalPayment,
        balanceHours,
        performanceRatio,
        missingDays,
        incompleteDays
      };
    }).filter(data => data.employeeName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [employees, logs, selectedMonth, searchTerm]);

  const lowPerformanceEmployees = useMemo(() => {
    return reportData.filter(d => d.performanceRatio < 0.5 && d.expectedHours > 0);
  }, [reportData]);

  const inconsistencies = useMemo(() => {
    return reportData.filter(d => d.missingDays.length > 0 || d.incompleteDays.length > 0);
  }, [reportData]);

  const chartData = useMemo(() => {
    return reportData
      .map(d => ({
        name: d.employeeName.split(' ')[0],
        total: parseFloat(d.totalPayment.toFixed(2)),
        fullName: d.employeeName
      }))
      .sort((a, b) => b.total - a.total);
  }, [reportData]);

  const handleDownload = () => {
    if (reportData.length === 0) return;

    const headers = ['Funcionário', 'Cargo', 'Horas Trabalhadas', 'Horas Esperadas', 'Balanço', 'Valor/Hora', 'Total a Pagar', 'Faltas', 'Incompletos'];
    const rows = reportData.map(row => [
      row.employeeName,
      row.role,
      row.totalHours.toFixed(1),
      row.expectedHours,
      row.balanceHours.toFixed(1),
      row.hourlyRate.toFixed(2),
      row.totalPayment.toFixed(2),
      row.missingDays.join('|'),
      row.incompleteDays.join('|')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_pagamentos_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Relatório de Pagamentos</h2>
          <p className="text-slate-500 font-medium">Análise detalhada e fechamento mensal da folha.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-slate-700 outline-none focus:border-indigo-500 transition-all font-bold"
            />
          </div>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Download size={20} />
            <span className="font-black text-xs uppercase tracking-widest hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Critical Inconsistencies Section */}
      {inconsistencies.length > 0 && (
        <section className="bg-red-50 border-2 border-red-100 rounded-[2rem] p-6 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-4 text-red-700">
            <CalendarX size={24} className="animate-pulse" />
            <h3 className="text-lg font-black uppercase tracking-tight">Destaque: Absenteísmo e Inconsistências</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inconsistencies.slice(0, 6).map(emp => (
              <div key={emp.employeeId} className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
                <p className="font-black text-slate-900">{emp.employeeName}</p>
                <div className="mt-2 space-y-1">
                  {emp.missingDays.length > 0 && (
                    <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">
                      Faltas ({emp.missingDays.length}): {emp.missingDays.slice(0, 3).join(', ')}{emp.missingDays.length > 3 ? '...' : ''}
                    </p>
                  )}
                  {emp.incompleteDays.length > 0 && (
                    <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">
                      Incompletos ({emp.incompleteDays.length}): {emp.incompleteDays.slice(0, 3).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-red-800 font-bold uppercase tracking-widest italic">
            * Dias úteis sem nenhum registro ou com batidas ímpares detectados no mês.
          </p>
        </section>
      )}

      {/* Visualizations and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Distribuição de Pagamentos</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valores totais por funcionário</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-indigo-600">
              <TrendingUp size={16} />
              <span className="text-xs font-black uppercase tracking-tighter">Monitor de Custos</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  formatter={(value) => [`R$ ${value}`, 'Total']}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 opacity-5 transition-transform group-hover:scale-110 duration-700">
            <DollarSign size={200} />
          </div>
          <div className="relative z-10 space-y-6">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Busca Rápida</h3>
              <p className="text-slate-400 text-sm font-medium">Localize funcionários na folha do mês.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Ex: João Silva..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border-2 border-white/10 rounded-2xl outline-none focus:border-indigo-500 transition-all text-white placeholder:text-slate-500 font-bold"
              />
            </div>
            <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
               <div className="flex items-center gap-3 text-indigo-400 mb-1">
                 <DollarSign size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Total da Folha</span>
               </div>
               <p className="text-3xl font-black tracking-tighter">
                 R$ {reportData.reduce((acc, curr) => acc + curr.totalPayment, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Funcionário</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Horas Reais</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status Balanço</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Inconsistências</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Vlr/Hora</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Pagamento Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportData.length > 0 ? reportData.map(row => (
                <tr key={row.employeeId} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-md group-hover:bg-indigo-600 transition-colors">
                        {row.employeeName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight">{row.employeeName}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-slate-700 font-mono">{row.totalHours.toFixed(1)}h</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      row.balanceHours >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {row.balanceHours >= 0 ? '+' : ''}{row.balanceHours.toFixed(1)}h
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {(row.missingDays.length > 0 || row.incompleteDays.length > 0) ? (
                      <div className="flex items-center justify-center gap-2 group/tip relative">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-help">
                          <AlertTriangle size={16} />
                        </div>
                        <div className="absolute bottom-full mb-2 hidden group-hover/tip:block bg-slate-900 text-white p-3 rounded-xl text-[10px] font-bold w-48 shadow-xl z-50">
                          <p className="border-b border-white/10 pb-1 mb-1 uppercase tracking-widest text-indigo-400">Pendências Detectadas</p>
                          {row.missingDays.length > 0 && <p>Faltas: {row.missingDays.length} dias</p>}
                          {row.incompleteDays.length > 0 && <p>Incompletos: {row.incompleteDays.length} dias</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <CheckCircle size={16} className="text-emerald-500" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 font-mono text-sm font-bold text-slate-600">
                    R$ {row.hourlyRate.toFixed(2)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-lg font-black text-indigo-600 tracking-tighter">
                      R$ {row.totalPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-slate-400 italic font-medium">
                    Nenhum registro encontrado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
        <div className="bg-amber-50 border-2 border-amber-100 p-5 rounded-3xl flex gap-3 max-w-xl">
          <AlertCircle className="text-amber-600 shrink-0" size={24} />
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            <strong>Nota do Sistema:</strong> Inconsistências (Alertas Vermelhos) indicam dias úteis onde o funcionário não registrou nenhuma batida ou o número de batidas é ímpar, sugerindo que esqueceu de registrar a entrada ou saída.
          </p>
        </div>

        <div className="text-center sm:text-right space-y-1">
          <div className="flex items-center justify-center sm:justify-end gap-2 text-slate-900 font-black text-sm tracking-tight">
            <span>Desenvolvido com</span>
            <Heart size={16} className="text-red-500 fill-red-500 animate-pulse" />
            <span>por Felipe Andrade</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sistema de Pontos Pro © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
