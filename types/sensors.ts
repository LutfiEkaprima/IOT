export interface SensorData {
  temperature: number;
  humidity: number;
  gas: number;
  timestamp: number;
}

// Ubah tipe ConnectionStatus
export type ConnectionStateType = 'connected' | 'connecting' | 'disconnected';

export interface ConnectionStatus {
  // Ganti 'connected: boolean' dengan 'state: ConnectionStateType'
  state: ConnectionStateType;
  uptime: number;
  lastUpdate: number;
}

export interface SensorThresholds {
  temperature: {
    warning: number;
    critical: number;
  };
  humidity: {
    warning: number;
    critical: number;
  };
  gas: {
    warning: number;
    critical: number;
  };
}

export type SensorStatus = 'normal' | 'warning' | 'critical';