import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SensorThresholds } from '@/types/sensors';

interface SettingsContextType {
  // Notification settings
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Alarm settings
  vibrationEnabled: boolean;
  setVibrationEnabled: (enabled: boolean) => void;
  
  persistentNotifications: boolean;
  setPersistentNotifications: (enabled: boolean) => void;
  
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
  
  // Loading state
  isLoading: boolean;
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

const defaultSettings = {
  notificationsEnabled: true,
  autoRefresh: true,
  soundEnabled: true,
  vibrationEnabled: true,
  persistentNotifications: true,
  thresholds: defaultThresholds,
  mqttConfig: defaultMqttConfig,
};

// Storage keys
const STORAGE_KEYS = {
  NOTIFICATIONS_ENABLED: '@iot_settings_notifications_enabled',
  AUTO_REFRESH: '@iot_settings_auto_refresh',
  SOUND_ENABLED: '@iot_settings_sound_enabled',
  VIBRATION_ENABLED: '@iot_settings_vibration_enabled',
  PERSISTENT_NOTIFICATIONS: '@iot_settings_persistent_notifications',
  THRESHOLDS: '@iot_settings_thresholds',
  MQTT_CONFIG: '@iot_settings_mqtt_config',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(defaultSettings.notificationsEnabled);
  const [autoRefresh, setAutoRefreshState] = useState(defaultSettings.autoRefresh);
  const [soundEnabled, setSoundEnabledState] = useState(defaultSettings.soundEnabled);
  const [vibrationEnabled, setVibrationEnabledState] = useState(defaultSettings.vibrationEnabled);
  const [persistentNotifications, setPersistentNotificationsState] = useState(defaultSettings.persistentNotifications);
  const [thresholds, setThresholdsState] = useState<SensorThresholds>(defaultSettings.thresholds);
  const [mqttConfig, setMqttConfigState] = useState(defaultSettings.mqttConfig);

  // Load settings from AsyncStorage on app start
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load all settings in parallel
      const [
        storedNotificationsEnabled,
        storedAutoRefresh,
        storedSoundEnabled,
        storedVibrationEnabled,
        storedPersistentNotifications,
        storedThresholds,
        storedMqttConfig,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.AUTO_REFRESH),
        AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.VIBRATION_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.PERSISTENT_NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.THRESHOLDS),
        AsyncStorage.getItem(STORAGE_KEYS.MQTT_CONFIG),
      ]);

      // Apply loaded settings or use defaults
      if (storedNotificationsEnabled !== null) {
        setNotificationsEnabledState(JSON.parse(storedNotificationsEnabled));
      }
      
      if (storedAutoRefresh !== null) {
        setAutoRefreshState(JSON.parse(storedAutoRefresh));
      }
      
      if (storedSoundEnabled !== null) {
        setSoundEnabledState(JSON.parse(storedSoundEnabled));
      }
      
      if (storedVibrationEnabled !== null) {
        setVibrationEnabledState(JSON.parse(storedVibrationEnabled));
      }
      
      if (storedPersistentNotifications !== null) {
        setPersistentNotificationsState(JSON.parse(storedPersistentNotifications));
      }
      
      if (storedThresholds !== null) {
        setThresholdsState(JSON.parse(storedThresholds));
      }
      
      if (storedMqttConfig !== null) {
        setMqttConfigState(JSON.parse(storedMqttConfig));
      }

      console.log('✅ Settings loaded from storage');
    } catch (error) {
      console.error('❌ Failed to load settings from storage:', error);
      // If loading fails, keep default values
    } finally {
      setIsLoading(false);
    }
  };

  // Save individual setting to AsyncStorage
  const saveSetting = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      console.log(`💾 Saved ${key} to storage:`, value);
    } catch (error) {
      console.error(`❌ Failed to save ${key} to storage:`, error);
    }
  };

  // Wrapper functions that save to storage when called
  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    saveSetting(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled);
  };

  const setAutoRefresh = (enabled: boolean) => {
    setAutoRefreshState(enabled);
    saveSetting(STORAGE_KEYS.AUTO_REFRESH, enabled);
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    saveSetting(STORAGE_KEYS.SOUND_ENABLED, enabled);
  };

  const setVibrationEnabled = (enabled: boolean) => {
    setVibrationEnabledState(enabled);
    saveSetting(STORAGE_KEYS.VIBRATION_ENABLED, enabled);
  };

  const setPersistentNotifications = (enabled: boolean) => {
    setPersistentNotificationsState(enabled);
    saveSetting(STORAGE_KEYS.PERSISTENT_NOTIFICATIONS, enabled);
  };

  const setThresholds = (newThresholds: SensorThresholds) => {
    setThresholdsState(newThresholds);
    saveSetting(STORAGE_KEYS.THRESHOLDS, newThresholds);
  };

  const updateThreshold = (type: 'temperature' | 'humidity' | 'gas', warning: number, critical: number) => {
    const newThresholds = {
      ...thresholds,
      [type]: { warning, critical }
    };
    setThresholds(newThresholds);
  };

  const setMqttConfig = (config: { broker: string; topic: string }) => {
    setMqttConfigState(config);
    saveSetting(STORAGE_KEYS.MQTT_CONFIG, config);
  };

  const resetToDefaults = async () => {
    try {
      // Clear all stored settings
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED),
        AsyncStorage.removeItem(STORAGE_KEYS.AUTO_REFRESH),
        AsyncStorage.removeItem(STORAGE_KEYS.SOUND_ENABLED),
        AsyncStorage.removeItem(STORAGE_KEYS.VIBRATION_ENABLED),
        AsyncStorage.removeItem(STORAGE_KEYS.PERSISTENT_NOTIFICATIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.THRESHOLDS),
        AsyncStorage.removeItem(STORAGE_KEYS.MQTT_CONFIG),
      ]);

      // Reset to default values
      setNotificationsEnabledState(defaultSettings.notificationsEnabled);
      setAutoRefreshState(defaultSettings.autoRefresh);
      setSoundEnabledState(defaultSettings.soundEnabled);
      setVibrationEnabledState(defaultSettings.vibrationEnabled);
      setPersistentNotificationsState(defaultSettings.persistentNotifications);
      setThresholdsState(defaultSettings.thresholds);
      setMqttConfigState(defaultSettings.mqttConfig);

      console.log('🔄 Settings reset to defaults');
    } catch (error) {
      console.error('❌ Failed to reset settings:', error);
    }
  };

  const value: SettingsContextType = {
    notificationsEnabled,
    setNotificationsEnabled,
    autoRefresh,
    setAutoRefresh,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    persistentNotifications,
    setPersistentNotifications,
    thresholds,
    setThresholds,
    updateThreshold,
    mqttConfig,
    setMqttConfig,
    resetToDefaults,
    isLoading,
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