
import { Employee, PointLog, SystemAlert, SystemConfig } from '../types';

const EMPLOYEES_KEY = 'chronos_employees';
const LOGS_KEY = 'chronos_logs';
const ALERTS_KEY = 'chronos_alerts';
const CONFIG_KEY = 'chronos_config';

export const storage = {
  getSystemConfig: (): SystemConfig => {
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : { delayTolerance: 15 }; // Default 15 min
  },
  saveSystemConfig: (config: SystemConfig) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },
  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(EMPLOYEES_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveEmployees: (employees: Employee[]) => {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  },
  getLogs: (): PointLog[] => {
    const data = localStorage.getItem(LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveLogs: (logs: PointLog[]) => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  },
  getAlerts: (): SystemAlert[] => {
    const data = localStorage.getItem(ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveAlerts: (alerts: SystemAlert[]) => {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  },
  addAlert: (alert: SystemAlert) => {
    const alerts = storage.getAlerts();
    const exists = alerts.some(a => 
      a.employeeId === alert.employeeId && 
      a.date === alert.date && 
      a.type === alert.type
    );
    if (!exists) {
      alerts.unshift(alert);
      storage.saveAlerts(alerts);
    }
  },
  markAlertAsRead: (id: string) => {
    const alerts = storage.getAlerts();
    const index = alerts.findIndex(a => a.id === id);
    if (index !== -1) {
      alerts[index].isRead = true;
      storage.saveAlerts(alerts);
    }
  },
  addLog: (log: PointLog) => {
    const logs = storage.getLogs();
    logs.push({ ...log, synced: false });
    storage.saveLogs(logs);
  },
  getUnsyncedLogs: (): PointLog[] => {
    return storage.getLogs().filter(l => !l.synced);
  },
  markAsSynced: (ids: string[]) => {
    const logs = storage.getLogs();
    const updated = logs.map(l => ids.includes(l.id) ? { ...l, synced: true } : l);
    storage.saveLogs(updated);
  },
  addEmployee: (employee: Employee) => {
    const employees = storage.getEmployees();
    employees.push(employee);
    storage.saveEmployees(employees);
  },
  updateEmployee: (updated: Employee) => {
    const employees = storage.getEmployees();
    const index = employees.findIndex(e => e.id === updated.id);
    if (index !== -1) {
      employees[index] = updated;
      storage.saveEmployees(employees);
    }
  },
  deleteEmployee: (id: string) => {
    const employees = storage.getEmployees();
    storage.saveEmployees(employees.filter(e => e.id !== id));
    const logs = storage.getLogs();
    storage.saveLogs(logs.filter(l => l.employeeId !== id));
    const alerts = storage.getAlerts();
    storage.saveAlerts(alerts.filter(a => a.employeeId !== id));
  }
};
