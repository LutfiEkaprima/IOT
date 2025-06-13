import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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

export function useNotifications(sensorData: SensorData) {
  const { thresholds, notificationsEnabled, soundEnabled } = useSettings();

  useEffect(() => {
    if (!notificationsEnabled) return;

    if (Platform.OS === 'web') {
      // For web, we can't send push notifications, but we can use browser notifications
      checkAndNotifyWeb(sensorData);
    } else {
      // For native platforms, use Expo notifications
      checkAndNotifyNative(sensorData);
    }
  }, [sensorData, thresholds, notificationsEnabled, soundEnabled]);

  const checkAndNotifyWeb = async (data: SensorData) => {
    // Request permission for browser notifications
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Check critical conditions
    if (data.gas > thresholds.gas.critical) {
      if (Notification.permission === 'granted') {
        new Notification('🚨 Critical Gas Level!', {
          body: `Gas level: ${data.gas.toFixed(1)} PPM (Critical: >${thresholds.gas.critical})`,
          icon: '/icon.png',
        });
      }
    }

    if (data.temperature > thresholds.temperature.critical) {
      if (Notification.permission === 'granted') {
        new Notification('🌡️ Critical Temperature!', {
          body: `Temperature: ${data.temperature.toFixed(1)}°C (Critical: >${thresholds.temperature.critical})`,
          icon: '/icon.png',
        });
      }
    }

    if (data.humidity > thresholds.humidity.critical) {
      if (Notification.permission === 'granted') {
        new Notification('💧 Critical Humidity!', {
          body: `Humidity: ${data.humidity.toFixed(1)}% (Critical: >${thresholds.humidity.critical})`,
          icon: '/icon.png',
        });
      }
    }
  };

  const checkAndNotifyNative = async (data: SensorData) => {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      // Check critical conditions and send notifications
      if (data.gas > thresholds.gas.critical) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🚨 Critical Gas Level!',
            body: `Gas level: ${data.gas.toFixed(1)} PPM (Critical: >${thresholds.gas.critical})`,
            sound: soundEnabled ? 'default' : false,
          },
          trigger: null,
        });
      }

      if (data.temperature > thresholds.temperature.critical) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🌡️ Critical Temperature!',
            body: `Temperature: ${data.temperature.toFixed(1)}°C (Critical: >${thresholds.temperature.critical})`,
            sound: soundEnabled ? 'default' : false,
          },
          trigger: null,
        });
      }

      if (data.humidity > thresholds.humidity.critical) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Critical Humidity!',
            body: `Humidity: ${data.humidity.toFixed(1)}% (Critical: >${thresholds.humidity.critical})`,
            sound: soundEnabled ? 'default' : false,
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };
}