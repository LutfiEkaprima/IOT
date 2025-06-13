import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SensorThresholds } from '@/types/sensors';

interface SettingsContextType {
  // Notification settings
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Threshold settings
  thresholds: SensorThresholds;
  setThresholds: (thresholds: SensorThresholds) => void;
  updateThreshold: (type: 'temperature' | 'humidity' | 'gas', warning: number, critical: number) => void;
  
  // MQTT settings
  mqttConfig: {
    broker: string;
    topic: string;
  };
  setMqttConfig: (config: { broker: string; topic: string }) => void;
  
  // Reset function
  resetToDefaults: () => void;
}

const defaultThresholds: SensorThresholds = {
  temperature: { warning: 35, critical: 50 },
  humidity: { warning: 60, critical: 30 },
  gas: { warning: 500, critical: 1000 },
};

const defaultMqttConfig = {
  broker: 'ws://broker.hivemq.com:8000/mqtt',
  topic: 'iot/project/lutfi/sensordata',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [thresholds, setThresholds] = useState<SensorThresholds>(defaultThresholds);
  const [mqttConfig, setMqttConfig] = useState(defaultMqttConfig);

  const updateThreshold = (type: 'temperature' | 'humidity' | 'gas', warning: number, critical: number) => {
    setThresholds(prev => ({
      ...prev,
      [type]: { warning, critical }
    }));
  };

  const resetToDefaults = () => {
    setNotificationsEnabled(true);
    setAutoRefresh(true);
    setSoundEnabled(true);
    setThresholds(defaultThresholds);
    setMqttConfig(defaultMqttConfig);
  };

  const value: SettingsContextType = {
    notificationsEnabled,
    setNotificationsEnabled,
    autoRefresh,
    setAutoRefresh,
    soundEnabled,
    setSoundEnabled,
    thresholds,
    setThresholds,
    updateThreshold,
    mqttConfig,
    setMqttConfig,
    resetToDefaults,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}