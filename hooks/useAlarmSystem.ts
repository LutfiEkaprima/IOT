import { useState, useEffect, useRef } from 'react';
import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { SensorData } from '@/types/sensors';
import { useSettings } from '@/contexts/SettingsContext';

interface AlarmState {
  isActive: boolean;
  criticalSensors: string[];
  alarmStartTime: number | null;
  lastNotificationTime: number;
}

export function useAlarmSystem(sensorData: SensorData) {
  const { thresholds, notificationsEnabled, soundEnabled } = useSettings();
  const [alarmState, setAlarmState] = useState<AlarmState>({
    isActive: false,
    criticalSensors: [],
    alarmStartTime: null,
    lastNotificationTime: 0,
  });

  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Helper function to determine if sensor is in critical state
  const isCritical = (value: number, type: 'temperature' | 'humidity' | 'gas'): boolean => {
    const threshold = thresholds[type];
    
    if (type === 'humidity') {
      return value < threshold.critical;
    } else {
      return value >= threshold.critical;
    }
  };

  // Get all critical sensors
  const getCriticalSensors = (): string[] => {
    const critical: string[] = [];
    
    if (isCritical(sensorData.temperature, 'temperature')) {
      critical.push('temperature');
    }
    if (isCritical(sensorData.humidity, 'humidity')) {
      critical.push('humidity');
    }
    if (isCritical(sensorData.gas, 'gas')) {
      critical.push('gas');
    }
    
    return critical;
  };

  // Load and play alarm sound
  const playAlarmSound = async () => {
    if (!soundEnabled || Platform.OS === 'web') return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      
      soundRef.current = sound;
    } catch (error) {
      console.error('Failed to play alarm sound:', error);
    }
  };

  // Stop alarm sound
  const stopAlarmSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        console.error('Failed to stop alarm sound:', error);
      }
    }
  };

  // Trigger vibration (mobile only)
  const triggerVibration = () => {
    if (Platform.OS !== 'web') {
      // Vibrate in pattern: 1 second on, 0.5 second off, repeat
      Vibration.vibrate([1000, 500], true);
    }
  };

  // Stop vibration
  const stopVibration = () => {
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }
  };

  // Send critical alarm notification
  const sendCriticalAlarmNotification = async (criticalSensors: string[]) => {
    if (!notificationsEnabled) return;

    const sensorNames = criticalSensors.map(sensor => {
      switch (sensor) {
        case 'temperature': return `Temperature: ${sensorData.temperature.toFixed(1)}°C`;
        case 'humidity': return `Humidity: ${sensorData.humidity.toFixed(1)}%`;
        case 'gas': return `Gas: ${sensorData.gas.toFixed(1)} PPM`;
        default: return sensor;
      }
    }).join(', ');

    const title = '🚨 CRITICAL ALARM ACTIVE!';
    const body = `Critical levels detected: ${sensorNames}`;

    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/icon.png',
          tag: 'critical-alarm',
          requireInteraction: true,
          silent: false,
        });

        // Auto-close notification after 10 seconds if user doesn't interact
        setTimeout(() => {
          notification.close();
        }, 10000);
      }
    } else {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: soundEnabled ? 'default' : false,
            priority: Notifications.AndroidNotificationPriority.MAX,
            categoryIdentifier: 'critical-alarm',
            data: { type: 'critical-alarm', sensors: criticalSensors },
          },
          trigger: null,
        });
      } catch (error) {
        console.error('Failed to send critical alarm notification:', error);
      }
    }
  };

  // Start alarm system
  const startAlarm = (criticalSensors: string[]) => {
    if (alarmState.isActive) return;

    console.log('🚨 CRITICAL ALARM STARTED:', criticalSensors);

    setAlarmState({
      isActive: true,
      criticalSensors,
      alarmStartTime: Date.now(),
      lastNotificationTime: Date.now(),
    });

    // Play sound and vibration
    playAlarmSound();
    triggerVibration();

    // Send immediate notification
    sendCriticalAlarmNotification(criticalSensors);

    // Set up recurring alarm notifications every 30 seconds
    alarmIntervalRef.current = setInterval(() => {
      const currentCritical = getCriticalSensors();
      
      if (currentCritical.length > 0) {
        sendCriticalAlarmNotification(currentCritical);
        setAlarmState(prev => ({
          ...prev,
          criticalSensors: currentCritical,
          lastNotificationTime: Date.now(),
        }));
      } else {
        // No more critical sensors, stop alarm
        stopAlarm();
      }
    }, 30000); // Every 30 seconds
  };

  // Stop alarm system
  const stopAlarm = () => {
    if (!alarmState.isActive) return;

    console.log('✅ CRITICAL ALARM STOPPED');

    // Clear interval
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    // Stop sound and vibration
    stopAlarmSound();
    stopVibration();

    // Send recovery notification
    if (notificationsEnabled) {
      const title = '✅ Alarm Cleared';
      const body = 'All sensors have returned to safe levels';

      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/icon.png',
            tag: 'alarm-cleared',
          });
        }
      } else {
        Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: false,
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger: null,
        });
      }
    }

    setAlarmState({
      isActive: false,
      criticalSensors: [],
      alarmStartTime: null,
      lastNotificationTime: 0,
    });
  };

  // Main effect to monitor sensor data
  useEffect(() => {
    const criticalSensors = getCriticalSensors();
    
    if (criticalSensors.length > 0) {
      if (!alarmState.isActive) {
        startAlarm(criticalSensors);
      } else {
        // Update critical sensors list
        setAlarmState(prev => ({
          ...prev,
          criticalSensors,
        }));
      }
    } else if (alarmState.isActive) {
      stopAlarm();
    }

    // Cleanup on unmount
    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
      stopAlarmSound();
      stopVibration();
    };
  }, [sensorData, thresholds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
    };
  }, []);

  return {
    alarmState,
    stopAlarm: () => stopAlarm(),
    isAlarmActive: alarmState.isActive,
    criticalSensors: alarmState.criticalSensors,
    alarmDuration: alarmState.alarmStartTime 
      ? Math.floor((Date.now() - alarmState.alarmStartTime) / 1000)
      : 0,
  };
}