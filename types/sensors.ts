export interface SensorData {
  temperature: number;
  humidity: number;
  gas: number;
  timestamp: number;
}

export interface ConnectionStatus {
  connected: boolean;
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