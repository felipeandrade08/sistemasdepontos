
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  contractHoursPerDay: number;
  hourlyRate: number;
  active: boolean;
  createdAt: number;
  pin: string;
  isAdmin?: boolean;
  expectedStartTime?: string; // Formato HH:mm
}

export type PointType = 'IN' | 'OUT' | 'BREAK_START' | 'BREAK_END';

export interface PointLog {
  id: string;
  employeeId: string;
  timestamp: number;
  type: PointType;
  synced?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    isAuthorized: boolean;
  };
}

export type AlertType = 'OVERTIME' | 'MISSING_POINT' | 'DELAY';

export interface SystemAlert {
  id: string;
  type: AlertType;
  employeeId: string;
  employeeName: string;
  date: string;
  message: string;
  isRead: boolean;
  timestamp: number;
  details?: {
    hoursWorked?: number;
    contractHours?: number;
    missingType?: 'TOTAL' | 'PARTIAL';
    delayMinutes?: number;
    expectedTime?: string;
    actualTime?: string;
  };
}

export interface SystemConfig {
  delayTolerance: number; // em minutos
}

export interface AppState {
  user: Employee | null;
  isAuthenticated: boolean;
}
