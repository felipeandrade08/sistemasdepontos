
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Employee, PointLog, SystemAlert, PointType } from '../types';
import { storage } from '../services/storage';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, LogIn, LogOut, CheckCircle2, MapPin, AlertCircle, ShieldOff, History, KeyRound, Eraser, MapPinOff, LocateFixed, Navigation, HelpCircle, RefreshCcw, Wifi, WifiOff, CloudUpload, Coffee, Info } from 'lucide-react';

interface ClockInProps {
  user: Employee;
  employees: Employee[];
  onRefresh: () => void;
}

const OFFICE_LOCATION = {
  lat: -23.5505, // Exemplo: São Paulo Centro
  lng: -46.6333,
  radius: 1000 // 1km de raio para teste
};

const ClockIn: React.FC<ClockInProps> = ({ user, onRefresh }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'OK' | 'DENIED' | 'LOADING' | 'SKIPPED'>('LOADING');
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const watchId = useRef<number | null>(null);

  const startTracking = () => {
    setLocationStatus('LOADING');
    setLocationError('');

    if (!("geolocation" in navigator)) {
      setLocationStatus('SKIPPED');
      setLocationError('Geolocalização não suportada pelo seu navegador.');
      return;
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        
        const distance = calculateDistance(latitude, longitude, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng);
        if (distance <= OFFICE_LOCATION.radius) {
          setLocationStatus('OK');
          setLocationError('');
        } else {
          setLocationStatus('DENIED');
          setLocationError(`Fora do perímetro autorizado (${Math.round(distance)}m da sede).`);
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        setLocationStatus('SKIPPED');
        if (err.code === 1) {
          setLocationError('Permissão de GPS negada pelo usuário.');
        } else {
          setLocationError('Não foi possível obter sua localização exata.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    startTracking();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const pendingLogsCount = useMemo(() => {
    return storage.getUnsyncedLogs().filter(l => l.employeeId === user.id).length;
  }, [successMsg]);

  const todayLogs = useMemo(() => {
    const allLogs = storage.getLogs();
    return allLogs
      .filter(l => l.employeeId === user.id && isSameDay(new Date(l.timestamp), new Date()))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [user.id, successMsg]);

  const isOnLunch = useMemo(() => {
    const lastPunch = todayLogs[0];
    return lastPunch?.type === 'BREAK_START';
  }, [todayLogs]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleLog = async (type: PointType) => {
    setPinError('');
    
    if (confirmPin.length < 4) {
      setPinError('Insira o PIN completo de 4 dígitos.');
      return;
    }

    if (confirmPin !== user.pin) {
      setPinError('PIN incorreto. Verifique e tente novamente.');
      setConfirmPin('');
      return;
    }

    setIsProcessing(true);
    
    const newLog: PointLog = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: user.id,
      timestamp: Date.now(),
      type: type,
      synced: false,
      location: currentCoords ? { 
        latitude: currentCoords.lat, 
        longitude: currentCoords.lng, 
        isAuthorized: locationStatus === 'OK' 
      } : undefined
    };

    storage.addLog(newLog);
    
    if (type === 'OUT') {
      checkOvertimeAlert(user);
    }

    const typeLabels: Record<PointType, string> = {
      IN: 'ENTRADA',
      OUT: 'SAÍDA',
      BREAK_START: 'INÍCIO DE REFEIÇÃO',
      BREAK_END: 'RETORNO DE REFEIÇÃO'
    };

    setSuccessMsg(
      !isOnline 
        ? `Ponto de ${typeLabels[type]} salvo localmente! Ele será sincronizado assim que você estiver online.`
        : `Ponto de ${typeLabels[type]} registrado com sucesso!`
    );
    
    setIsProcessing(false);
    setConfirmPin('');
    onRefresh();

    setTimeout(() => {
      setSuccessMsg('');
    }, 6000);
  };

  const checkOvertimeAlert = (emp: Employee) => {
    const logs = storage.getLogs();
    const todayLogsAll = logs.filter(l => l.employeeId === emp.id && isSameDay(new Date(l.timestamp), new Date()))
                         .sort((a, b) => a.timestamp - b.timestamp);
    
    let totalMinutes = 0;
    for (let i = 0; i < todayLogsAll.length - 1; i += 2) {
      const start = todayLogsAll[i];
      const end = todayLogsAll[i+1];
      if ((start.type === 'IN' || start.type === 'BREAK_END') && (end.type === 'OUT' || end.type === 'BREAK_START')) {
        totalMinutes += (end.timestamp - start.timestamp) / 60000;
      }
    }

    const totalHours = totalMinutes / 60;
    if (totalHours > emp.contractHoursPerDay) {
      const dateStr = format(new Date(), 'dd/MM/yyyy');
      const alert: SystemAlert = {
        id: `overtime-${emp.id}-${dateStr}`,
        type: 'OVERTIME',
        employeeId: emp.id,
        employeeName: emp.name,
        date: dateStr,
        message: `Trabalhou ${totalHours.toFixed(1)}h (Contrato: ${emp.contractHoursPerDay}h)`,
        isRead: false,
        timestamp: Date.now(),
        details: { hoursWorked: totalHours, contractHours: emp.contractHoursPerDay }
      };
      storage.addAlert(alert);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-4 pb-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Registro de Ponto</h2>
        <div className="inline-flex flex-col items-center bg-white px-12 py-10 rounded-[3rem] shadow-2xl border border-white ring-8 ring-slate-100">
          <span className="text-7xl font-mono font-bold text-indigo-600 tracking-tighter">
            {format(currentTime, 'HH:mm:ss')}
          </span>
          <span className="text-slate-500 font-semibold mt-4 text-lg capitalize">
            {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-1 flex">
               <div className={`flex-1 transition-colors duration-1000 ${isOnline ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-2 transition-colors ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-orange-50 border-orange-200 text-orange-600 shadow-lg shadow-orange-100'}`}>
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                {isOnline ? 'Conectado - Sincronização em Tempo Real' : 'Modo Offline - Armazenamento Local Ativo'}
              </div>

              {pendingLogsCount > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-indigo-50 border-2 border-indigo-100 text-indigo-600 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-bounce">
                  <CloudUpload size={14} />
                  {pendingLogsCount} {pendingLogsCount === 1 ? 'Ponto Pendente' : 'Pontos Pendentes'}
                </div>
              )}
            </div>

            {!isOnline && (
              <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-left-4">
                <div className="p-2 bg-orange-500 text-white rounded-lg">
                  <Info size={16} />
                </div>
                <p className="text-xs font-bold text-orange-800">
                  Os botões abaixo continuam ativos. Seus registros serão guardados no dispositivo e enviados automaticamente quando a internet voltar.
                </p>
              </div>
            )}
            
            <div className={`p-1 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${
              locationStatus === 'OK' ? 'border-emerald-100 bg-emerald-50/50' : 
              locationStatus === 'LOADING' ? 'border-indigo-100 bg-indigo-50/50' : 
              locationStatus === 'SKIPPED' ? 'border-slate-100 bg-slate-50/50' : 'border-red-100 bg-red-50/50'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm shrink-0 ${
                    locationStatus === 'OK' ? 'bg-emerald-500 text-white animate-pulse' : 
                    locationStatus === 'LOADING' ? 'bg-indigo-500 text-white animate-spin duration-1000' : 
                    locationStatus === 'SKIPPED' ? 'bg-slate-400 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {locationStatus === 'OK' ? <MapPin size={24} /> : 
                     locationStatus === 'LOADING' ? <LocateFixed size={24} /> : 
                     locationStatus === 'SKIPPED' ? <HelpCircle size={24} /> : <MapPinOff size={24} />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase tracking-widest ${
                      locationStatus === 'OK' ? 'text-emerald-700' : 
                      locationStatus === 'LOADING' ? 'text-indigo-700' : 
                      locationStatus === 'SKIPPED' ? 'text-slate-600' : 'text-red-700'
                    }`}>Localização em Tempo Real</h4>
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {locationStatus === 'OK' ? 'Sede Identificada' : 
                       locationStatus === 'LOADING' ? 'Solicitando acesso ao GPS...' : 
                       locationStatus === 'SKIPPED' ? (locationError || 'GPS Opcional') : (locationError || 'Bloqueado')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {locationStatus !== 'OK' && locationStatus !== 'LOADING' && (
                    <button 
                      onClick={startTracking}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                      <RefreshCcw size={14} /> Ativar GPS
                    </button>
                  )}
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 flex items-center gap-2 flex-1 sm:flex-none justify-center ${
                    locationStatus === 'OK' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 
                    locationStatus === 'LOADING' ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 
                    locationStatus === 'SKIPPED' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-red-100 border-red-200 text-red-700'
                  }`}>
                    <Navigation size={12} className={locationStatus === 'LOADING' ? 'animate-bounce' : ''} />
                    {locationStatus === 'OK' ? 'Verificado' : locationStatus === 'LOADING' ? 'Sincronizando' : locationStatus === 'SKIPPED' ? 'Opcional' : 'Atenção'}
                  </div>
                </div>
              </div>
            </div>

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-5 rounded-2xl flex items-center gap-4 animate-in zoom-in duration-300">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <span className="font-bold text-sm leading-snug">{successMsg}</span>
              </div>
            )}

            {pinError && (
              <div className="bg-red-50 border border-red-100 text-red-800 p-5 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase tracking-wider">Erro de Autenticação</span>
                  <span className="text-sm font-medium">{pinError}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">PIN de Segurança</label>
                {confirmPin.length > 0 && (
                  <button onClick={() => { setConfirmPin(''); setPinError(''); }} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-[10px] font-bold uppercase transition-colors">
                    <Eraser size={12} /> Limpar
                  </button>
                )}
              </div>
              <div className="relative group">
                <KeyRound className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${pinError ? 'text-red-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`} size={24} />
                <input 
                  type="password" 
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setConfirmPin(val);
                    if (pinError) setPinError('');
                  }}
                  className={`w-full pl-16 pr-6 py-5 rounded-3xl border-4 outline-none transition-all text-4xl font-mono tracking-[0.5em] shadow-inner ${
                    pinError ? 'border-red-100 bg-red-50/30' : 
                    confirmPin.length === 4 ? 'border-indigo-100 bg-indigo-50/20' : 'border-slate-50 bg-slate-50 focus:border-indigo-500/30 focus:bg-white'
                  }`}
                  placeholder="••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                disabled={isProcessing || isOnLunch}
                onClick={() => handleLog('IN')}
                className={`group relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] transition-all shadow-xl active:scale-95 ${
                  isProcessing || isOnLunch
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale shadow-none' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100/30'
                }`}
              >
                {!isOnline && (
                  <div className="absolute top-4 right-4 text-orange-300">
                    <WifiOff size={16} />
                  </div>
                )}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${isOnLunch ? 'bg-slate-300' : 'bg-emerald-500'}`}>
                  <LogIn size={32} />
                </div>
                <div className="text-center">
                  <span className="text-lg font-black tracking-tight block">ENTRADA</span>
                  {!isOnline && <span className="text-[9px] font-black uppercase opacity-60">Via Local Storage</span>}
                </div>
              </button>

              <button 
                disabled={isProcessing}
                onClick={() => handleLog(isOnLunch ? 'BREAK_END' : 'BREAK_START')}
                className={`group relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] transition-all shadow-xl active:scale-95 ${
                  isProcessing 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale shadow-none' 
                    : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100/30'
                }`}
              >
                {!isOnline && (
                  <div className="absolute top-4 right-4 text-orange-200">
                    <WifiOff size={16} />
                  </div>
                )}
                <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Coffee size={32} />
                </div>
                <div className="text-center">
                  <span className="text-lg font-black tracking-tight text-center leading-tight block">
                    {isOnLunch ? 'RETORNAR' : 'REFEIÇÃO'}
                  </span>
                  {!isOnline && <span className="text-[9px] font-black uppercase opacity-60">Via Local Storage</span>}
                  {isOnline && <span className="text-[10px] opacity-80 block">(1H PADRÃO)</span>}
                </div>
              </button>

              <button 
                disabled={isProcessing || isOnLunch}
                onClick={() => handleLog('OUT')}
                className={`group relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] transition-all shadow-xl active:scale-95 ${
                  isProcessing || isOnLunch
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale shadow-none' 
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100/30'
                }`}
              >
                {!isOnline && (
                  <div className="absolute top-4 right-4 text-orange-200">
                    <WifiOff size={16} />
                  </div>
                )}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${isOnLunch ? 'bg-slate-300' : 'bg-red-500'}`}>
                  <LogOut size={32} />
                </div>
                <div className="text-center">
                  <span className="text-lg font-black tracking-tight block">SAÍDA</span>
                  {!isOnline && <span className="text-[9px] font-black uppercase opacity-60">Via Local Storage</span>}
                </div>
              </button>
            </div>

            {isProcessing && (
              <div className="text-center text-indigo-600 animate-pulse font-bold flex items-center justify-center gap-3 py-2">
                <ShieldOff size={24} className="animate-spin" />
                <span className="text-lg">Processando registro...</span>
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-white p-10 rounded-[3rem] flex items-center justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
               <Clock size={200} />
            </div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mb-1">Logado como</p>
                <p className="text-3xl font-black tracking-tight">{user.name}</p>
                <p className="text-indigo-300/60 font-bold text-sm mt-1 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <div className="text-right relative z-10 hidden sm:block">
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mb-1">Jornada Diária</p>
              <p className="text-4xl font-black tracking-tighter">{user.contractHoursPerDay}<span className="text-xl font-medium ml-1">H/DIA</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none">Registros</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recentes (Hoje)</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {todayLogs.length > 0 ? todayLogs.map((log, idx) => (
              <div key={log.id} className={`flex items-center justify-between p-5 rounded-3xl transition-all hover:scale-[1.02] border animate-in slide-in-from-right duration-300 delay-${idx * 100} ${
                log.type === 'IN' || log.type === 'BREAK_END' ? 'bg-emerald-50/50 border-emerald-100' : 
                log.type === 'BREAK_START' ? 'bg-amber-50/50 border-amber-100' : 'bg-red-50/50 border-red-100'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl shadow-sm bg-white ${
                    log.type === 'IN' || log.type === 'BREAK_END' ? 'text-emerald-600' : 
                    log.type === 'BREAK_START' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {log.type === 'IN' ? <LogIn size={20} /> : 
                     log.type === 'OUT' ? <LogOut size={20} /> : <Coffee size={20} />}
                  </div>
                  <div>
                    <p className={`text-sm font-black uppercase tracking-wider ${
                      log.type === 'IN' || log.type === 'BREAK_END' ? 'text-emerald-700' : 
                      log.type === 'BREAK_START' ? 'text-amber-700' : 'text-red-700'
                    }`}>
                      {log.type === 'IN' ? 'Entrada' : 
                       log.type === 'OUT' ? 'Saída' : 
                       log.type === 'BREAK_START' ? 'Início Refeição' : 'Retorno Refeição'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      {format(log.timestamp, "dd 'de' MMM", { locale: ptBR })}
                      {!log.synced && <span className="ml-2 text-indigo-500 font-black uppercase tracking-tighter">(Pendente Sinc.)</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-xl font-black text-slate-800 font-mono tracking-tighter">
                    {format(log.timestamp, 'HH:mm')}
                  </span>
                  {log.location?.isAuthorized && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <MapPin size={10} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Validado</span>
                    </div>
                  )}
                  {!log.synced && <CloudUpload size={14} className="text-indigo-400 mt-1" />}
                </div>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm">
                  <Clock size={32} />
                </div>
                <div>
                  <p className="text-slate-500 font-bold">Sem registros hoje</p>
                  <p className="text-xs text-slate-400 mt-1">Utilize os botões ao lado para registrar seu ponto.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockIn;
