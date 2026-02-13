
import React, { useState, useEffect } from 'react';
import { Employee, SystemConfig } from '../types';
import { storage } from '../services/storage';
import { Plus, UserPlus, Trash2, Edit2, X, ShieldCheck, Settings, Timer, CheckCircle2 } from 'lucide-react';

interface EmployeesProps {
  employees: Employee[];
  onRefresh: () => void;
}

const Employees: React.FC<EmployeesProps> = ({ employees, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [config, setConfig] = useState<SystemConfig>({ delayTolerance: 15 });
  const [showConfigSaved, setShowConfigSaved] = useState(false);

  useEffect(() => {
    setConfig(storage.getSystemConfig());
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    contractHoursPerDay: 8,
    hourlyRate: 0,
    pin: '',
    isAdmin: false,
    expectedStartTime: '08:00'
  });

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({ 
      name: '', 
      email: '', 
      role: '', 
      contractHoursPerDay: 8, 
      hourlyRate: 0, 
      pin: '', 
      isAdmin: false,
      expectedStartTime: '08:00'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      role: emp.role,
      contractHoursPerDay: emp.contractHoursPerDay,
      hourlyRate: emp.hourlyRate,
      pin: emp.pin,
      isAdmin: emp.isAdmin || false,
      expectedStartTime: emp.expectedStartTime || '08:00'
    });
    setShowModal(true);
  };

  const handleSaveConfig = () => {
    storage.saveSystemConfig(config);
    setShowConfigSaved(true);
    setTimeout(() => setShowConfigSaved(false), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza? Isso apagará todos os registros deste funcionário.')) {
      storage.deleteEmployee(id);
      onRefresh();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      storage.updateEmployee({ ...editingEmployee, ...formData });
    } else {
      storage.addEmployee({
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        active: true,
        createdAt: Date.now()
      });
    }
    setShowModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Equipe & Acessos</h2>
          <p className="text-slate-500 font-medium">Configure colaboradores, PINs e regras de tolerância.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[1.5rem] flex items-center gap-2 transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          <UserPlus size={20} />
          <span className="font-black text-xs uppercase tracking-widest">Cadastrar Colaborador</span>
        </button>
      </div>

      {/* System Settings Section */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Settings size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Configurações Gerais</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Regras de negócio aplicadas a todos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-tight">
              <Timer size={16} className="text-indigo-500" />
              Tolerância de Atraso (Minutos)
            </label>
            <div className="flex gap-4">
              <input 
                type="number" 
                value={config.delayTolerance}
                onChange={e => setConfig({...config, delayTolerance: Number(e.target.value)})}
                className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-lg"
                placeholder="Ex: 15"
              />
              <button 
                onClick={handleSaveConfig}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                Salvar Regras
              </button>
            </div>
            {showConfigSaved && (
              <p className="text-emerald-600 text-[10px] font-black uppercase flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                <CheckCircle2 size={12} /> Configurações atualizadas com sucesso!
              </p>
            )}
          </div>
          <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
            <p className="text-xs text-indigo-900 font-medium leading-relaxed">
              <strong>Impacto:</strong> A tolerância será considerada nos alertas do dashboard. Registros de entrada realizados após o horário esperado + este período serão sinalizados como atraso.
            </p>
          </div>
        </div>
      </section>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Colaborador</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">PIN</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Entrada Prevista</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Carga Horária</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Acesso</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-all group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-black shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 tracking-tight">{emp.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-mono font-black tracking-widest text-slate-600">
                    {emp.pin}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                    {emp.expectedStartTime || '08:00'}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm font-bold text-slate-600">{emp.contractHoursPerDay}h/dia</td>
                <td className="px-6 py-5">
                  {emp.isAdmin ? (
                    <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-lg flex items-center gap-1 w-fit tracking-widest">
                      <ShieldCheck size={10} /> Admin
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-lg w-fit block tracking-widest">
                      Comum
                    </span>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenEdit(emp)} className="p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all shadow-sm">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 hover:border-red-100 transition-all shadow-sm">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingEmployee ? 'Editar Perfil' : 'Novo Colaborador'}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Insira os dados cadastrais básicos</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-slate-600 shadow-sm transition-all">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-500 outline-none transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-500 outline-none transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cargo / Função</label>
                  <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-500 outline-none transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PIN Acesso (4 dígitos)</label>
                  <input required type="text" maxLength={4} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-500 outline-none transition-all font-mono text-center text-xl font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Carga Diária (Horas)</label>
                  <input required type="number" value={formData.contractHoursPerDay} onChange={e => setFormData({...formData, contractHoursPerDay: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-500 outline-none transition-all font-bold" />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Horário de Entrada Previsto</label>
                  <input 
                    required 
                    type="time" 
                    value={formData.expectedStartTime} 
                    onChange={e => setFormData({...formData, expectedStartTime: e.target.value})} 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-500 outline-none transition-all font-bold" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 bg-slate-900 rounded-[1.5rem] shadow-xl">
                <input 
                  type="checkbox" 
                  id="isAdmin" 
                  checked={formData.isAdmin} 
                  onChange={e => setFormData({...formData, isAdmin: e.target.checked})}
                  className="w-6 h-6 accent-indigo-500 rounded-lg"
                />
                <label htmlFor="isAdmin" className="text-sm font-black text-white uppercase tracking-widest cursor-pointer select-none">
                  Acesso de Administrador
                </label>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 px-8 py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">Salvar Colaborador</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
