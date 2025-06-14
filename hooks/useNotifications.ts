import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { SensorData } from '@/types/sensors';
import { useSettings } from '@/contexts/SettingsContext';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationState {
  temperature: {
    lastWarningNotification: number;
    lastCriticalNotification: number;
    currentStatus: 'normal' | 'warning' | 'critical';
  };
  humidity: {
    lastWarningNotification: number;
    lastCriticalNotification: number;
    currentStatus: 'normal' | 'warning' | 'critical';
  };
  gas: {
    lastWarningNotification: number;
    lastCriticalNotification: number;
    currentStatus: 'normal' | 'warning' | 'critical';
  };
}

// Custom sound configuration
const NOTIFICATION_SOUNDS = {
  warning: {
    native: 'notification_warning.wav', // Place in assets/sounds/
    web: '/sounds/warning.mp3', // Place in public/sounds/
  },
  critical: {
    native: 'alarm_critical.wav', // Place in assets/sounds/
    web: '/sounds/critical-alarm.mp3', // Place in public/sounds/
  },
  recovery: {
    native: 'notification_success.wav', // Place in assets/sounds/
    web: '/sounds/success.mp3', // Place in public/sounds/
  },
};

export function useNotifications(sensorData: SensorData) {
  const { thresholds, notificationsEnabled, soundEnabled } = useSettings();
  const notificationStateRef = useRef<NotificationState>({
    temperature: {
      lastWarningNotification: 0,
      lastCriticalNotification: 0,
      currentStatus: 'normal',
    },
    humidity: {
      lastWarningNotification: 0,
      lastCriticalNotification: 0,
      currentStatus: 'normal',
    },
    gas: {
      lastWarningNotification: 0,
      lastCriticalNotification: 0,
      currentStatus: 'normal',
    },
  });

  const criticalAlarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);

  // Initialize audio system
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    }
  }, []);

  // Helper function to play custom sound
  const playCustomSound = async (soundType: 'warning' | 'critical' | 'recovery') => {
    if (!soundEnabled) return;

    try {
      if (Platform.OS === 'web') {
        // Web: Use HTML5 Audio API
        const audio = new window.Audio(NOTIFICATION_SOUNDS[soundType].web);
        audio.volume = soundType === 'critical' ? 1.0 : 0.7;
        
        if (soundType === 'critical') {
          audio.loop = false; // Don't loop individual plays, we handle repetition
        }
        
        await audio.play();
      } else {
        // Native: Use Expo Audio
        if (audioRef.current) {
          await audioRef.current.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: NOTIFICATION_SOUNDS[soundType].native },
          {
            shouldPlay: true,
            volume: soundType === 'critical' ? 1.0 : 0.7,
            isLooping: false,
          }
        );
        
        audioRef.current = sound;
        await sound.playAsync();
      }
    } catch (error) {
      console.error(`Failed to play ${soundType} sound:`, error);
      // Fallback to system sound
      if (Platform.OS !== 'web') {
        // Use system notification sound as fallback
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Sound Test',
            body: 'Fallback sound',
            sound: 'default',
          },
          trigger: null,
        });
      }
    }
  };

  // Helper function to determine sensor status
  const getSensorStatus = (
    value: number,
    type: 'temperature' | 'humidity' | 'gas'
  ): 'normal' | 'warning' | 'critical' => {
    const threshold = thresholds[type];

    if (type === 'humidity') {
      // Reverse logic for humidity: lower values are worse
      if (value < threshold.critical) return 'critical';
      if (value < threshold.warning) return 'warning';
      return 'normal';
    } else {
      // Standard logic for temperature and gas: higher values are worse
      if (value >= threshold.critical) return 'critical';
      if (value >= threshold.warning) return 'warning';
      return 'normal';
    }
  };

  // Clear critical alarm when all sensors are normal
  const clearCriticalAlarm = () => {
    if (criticalAlarmIntervalRef.current) {
      clearInterval(criticalAlarmIntervalRef.current);
      criticalAlarmIntervalRef.current = null;
    }
  };

  // Start critical alarm (every 10 seconds)
  const startCriticalAlarm = () => {
    if (criticalAlarmIntervalRef.current) return; // Already running

    criticalAlarmIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const state = notificationStateRef.current;

      // Check if any sensor is still in critical state
      const tempStatus = getSensorStatus(sensorData.temperature, 'temperature');
      const humidityStatus = getSensorStatus(sensorData.humidity, 'humidity');
      const gasStatus = getSensorStatus(sensorData.gas, 'gas');

      let hasCritical = false;

      if (tempStatus === 'critical') {
        hasCritical = true;
        sendCriticalNotification('temperature', sensorData.temperature);
      }

      if (humidityStatus === 'critical') {
        hasCritical = true;
        sendCriticalNotification('humidity', sensorData.humidity);
      }

      if (gasStatus === 'critical') {
        hasCritical = true;
        sendCriticalNotification('gas', sensorData.gas);
      }

      // If no critical sensors, stop the alarm
      if (!hasCritical) {
        clearCriticalAlarm();
      }
    }, 10000); // Every 10 seconds for critical alarm
  };

  const sendCriticalNotification = async (
    type: 'temperature' | 'humidity' | 'gas',
    value: number
  ) => {
    if (!notificationsEnabled) return;

    const threshold = thresholds[type];
    let title = '';
    let body = '';
    let emoji = '';

    switch (type) {
      case 'temperature':
        emoji = '🌡️';
        title = '🚨 CRITICAL TEMPERATURE ALARM!';
        body = `Temperature: ${value.toFixed(1)}°C (Critical: >${threshold.critical}°C)`;
        break;
      case 'humidity':
        emoji = '💧';
        title = '🚨 CRITICAL HUMIDITY ALARM!';
        body = `Humidity: ${value.toFixed(1)}% (Critical: <${threshold.critical}%)`;
        break;
      case 'gas':
        emoji = '☠️';
        title = '🚨 CRITICAL GAS ALARM!';
        body = `Gas level: ${value.toFixed(1)} PPM (Critical: >${threshold.critical} PPM)`;
        break;
    }

    // Play custom critical alarm sound
    await playCustomSound('critical');

    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icon.png',
          tag: `critical-${type}`, // This replaces previous notifications of the same type
          requireInteraction: true, // Keep notification visible until user interacts
          silent: true, // We handle sound manually
        });
      }
    } else {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: false, // We handle sound manually
            priority: Notifications.AndroidNotificationPriority.MAX,
            categoryIdentifier: 'critical-alarm',
          },
          trigger: null,
        });
      } catch (error) {
        console.error('Failed to send critical notification:', error);
      }
    }
  };

  const sendWarningNotification = async (
    type: 'temperature' | 'humidity' | 'gas',
    value: number
  ) => {
    if (!notificationsEnabled) return;

    const threshold = thresholds[type];
    let title = '';
    let body = '';

    switch (type) {
      case 'temperature':
        title = '⚠️ Temperature Warning';
        body = `Temperature: ${value.toFixed(1)}°C (Warning: >${threshold.warning}°C)`;
        break;
      case 'humidity':
        title = '⚠️ Humidity Warning';
        body = `Humidity: ${value.toFixed(1)}% (Warning: <${threshold.warning}%)`;
        break;
      case 'gas':
        title = '⚠️ Gas Level Warning';
        body = `Gas level: ${value.toFixed(1)} PPM (Warning: >${threshold.warning} PPM)`;
        break;
    }

    // Play custom warning sound
    await playCustomSound('warning');

    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icon.png',
          tag: `warning-${type}`,
          silent: true, // We handle sound manually
        });
      }
    } else {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: false, // We handle sound manually
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null,
        });
      } catch (error) {
        console.error('Failed to send warning notification:', error);
      }
    }
  };

  const sendRecoveryNotification = async (type: 'temperature' | 'humidity' | 'gas') => {
    if (!notificationsEnabled) return;

    let title = '';
    let body = '';

    switch (type) {
      case 'temperature':
        title = '✅ Temperature Normal';
        body = 'Temperature has returned to normal levels';
        break;
      case 'humidity':
        title = '✅ Humidity Normal';
        body = 'Humidity has returned to normal levels';
        break;
      case 'gas':
        title = '✅ Gas Level Normal';
        body = 'Gas level has returned to normal levels';
        break;
    }

    // Play custom recovery sound
    await playCustomSound('recovery');

    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icon.png',
          tag: `recovery-${type}`,
          silent: true, // We handle sound manually
        });
      }
    } else {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: false, // We handle sound manually
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger: null,
        });
      } catch (error) {
        console.error('Failed to send recovery notification:', error);
      }
    }
  };

  useEffect(() => {
    if (!notificationsEnabled) return;

    // Request permissions for web
    if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Request permissions for native
    if (Platform.OS !== 'web') {
      Notifications.requestPermissionsAsync();
    }

    const now = Date.now();
    const state = notificationStateRef.current;
    const WARNING_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Check each sensor
    const sensors: Array<{
      type: 'temperature' | 'humidity' | 'gas';
      value: number;
    }> = [
      { type: 'temperature', value: sensorData.temperature },
      { type: 'humidity', value: sensorData.humidity },
      { type: 'gas', value: sensorData.gas },
    ];

    let hasCritical = false;

    sensors.forEach(({ type, value }) => {
      const currentStatus = getSensorStatus(value, type);
      const previousStatus = state[type].currentStatus;
      const sensorState = state[type];

      // Update current status
      state[type].currentStatus = currentStatus;

      if (currentStatus === 'critical') {
        hasCritical = true;
        
        // Send immediate notification if transitioning to critical or if it's been a while
        if (previousStatus !== 'critical' || now - sensorState.lastCriticalNotification > 10000) {
          sendCriticalNotification(type, value);
          sensorState.lastCriticalNotification = now;
        }
      } else if (currentStatus === 'warning') {
        // Send warning notification every 30 minutes
        if (now - sensorState.lastWarningNotification > WARNING_INTERVAL) {
          sendWarningNotification(type, value);
          sensorState.lastWarningNotification = now;
        }
      } else if (currentStatus === 'normal' && previousStatus !== 'normal') {
        // Send recovery notification when returning to normal
        sendRecoveryNotification(type);
        // Reset notification timers
        sensorState.lastWarningNotification = 0;
        sensorState.lastCriticalNotification = 0;
      }
    });

    // Manage critical alarm
    if (hasCritical) {
      startCriticalAlarm();
    } else {
      clearCriticalAlarm();
    }

    // Cleanup function
    return () => {
      clearCriticalAlarm();
    };
  }, [sensorData, thresholds, notificationsEnabled, soundEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCriticalAlarm();
      if (audioRef.current) {
        audioRef.current.unloadAsync();
      }
    };
  }, []);
}