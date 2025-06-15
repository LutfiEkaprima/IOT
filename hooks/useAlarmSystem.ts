import { useState, useEffect, useRef } from 'react';
import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { SensorData } from '@/types/sensors';
import { useSettings } from '@/contexts/SettingsContext';

const alarmSoundAsset = require('../assets/sounds/alarm.wav');

interface AlarmState {
  isActive: boolean;
  criticalSensors: string[];
  alarmStartTime: number | null;
  lastNotificationTime: number;
}

export function useAlarmSystem(sensorData: SensorData) {
  const {
    thresholds,
    notificationsEnabled,
    soundEnabled,
    vibrationEnabled,
    persistentNotifications,
  } = useSettings();

  const [alarmState, setAlarmState] = useState<AlarmState>({
    isActive: false,
    criticalSensors: [],
    alarmStartTime: null,
    lastNotificationTime: 0,
  });

  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Helper function to determine if sensor is in critical state
  const isCritical = (
    value: number,
    type: 'temperature' | 'humidity' | 'gas'
  ): boolean => {
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

  // --- AWAL PERUBAHAN ---
  // Muat dan putar suara alarm dari aset lokal
  const playAlarmSound = async () => {
    if (!soundEnabled || Platform.OS === 'web') return;

    try {
      // Hentikan dan hapus suara yang mungkin sedang berjalan
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: 1, // DoNotMix
        shouldDuckAndroid: false,
        interruptionModeAndroid: 1, // DoNotMix
        playThroughEarpieceAndroid: false,
      });

      // Buat objek suara baru
      const { sound } = await Audio.Sound.createAsync(alarmSoundAsset);
      soundRef.current = sound;

      // Atur listener untuk memutar ulang audio secara manual saat selesai
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          soundRef.current?.replayAsync();
        }
      });

      // Mulai putar audio
      await sound.playAsync();
    } catch (error) {
      console.error('Gagal memutar suara alarm:', error);
    }
  };
  // --- AKHIR PERUBAHAN ---

  // Stop alarm sound
  const stopAlarmSound = async () => {
    if (soundRef.current) {
      try {
        // Hapus listener agar audio tidak berputar lagi
        soundRef.current.setOnPlaybackStatusUpdate(null);
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
    if (Platform.OS !== 'web' && vibrationEnabled) {
      // Pola getaran: 1 detik nyala, 0.5 detik mati, berulang
      Vibration.vibrate([1000, 500, 1000, 500], true);
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

    const sensorNames = criticalSensors
      .map((sensor) => {
        switch (sensor) {
          case 'temperature':
            return `Suhu: ${sensorData.temperature.toFixed(1)}°C`;
          case 'humidity':
            return `Kelembapan: ${sensorData.humidity.toFixed(1)}%`;
          case 'gas':
            return `Gas: ${sensorData.gas.toFixed(1)} PPM`;
          default:
            return sensor;
        }
      })
      .join(', ');

    const title = '🚨 ALARM KRITIS AKTIF!';
    const body = `Level kritis terdeteksi: ${sensorNames}`;

    if (Platform.OS !== 'web') {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true, // Pastikan notifikasi mengeluarkan suara
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 250, 250, 250], // Tambahkan pola getar pada notifikasi
            data: { type: 'critical-alarm', sensors: criticalSensors },
          },
          trigger: null,
        });
      } catch (error) {
        console.error('Gagal mengirim notifikasi alarm kritis:', error);
      }
    }
  };

  // Start alarm system
  const startAlarm = (criticalSensors: string[]) => {
    if (alarmState.isActive) return;

    console.log('🚨 ALARM KRITIS DIMULAI:', criticalSensors);

    setAlarmState({
      isActive: true,
      criticalSensors,
      alarmStartTime: Date.now(),
      lastNotificationTime: Date.now(),
    });

    playAlarmSound();
    triggerVibration();
    sendCriticalAlarmNotification(criticalSensors);

    // Hapus interval yang sudah ada jika ada
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
    }

    // Kirim notifikasi berulang jika diaktifkan
    if (persistentNotifications) {
      alarmIntervalRef.current = setInterval(() => {
        const currentCritical = getCriticalSensors();
        if (currentCritical.length > 0) {
          sendCriticalAlarmNotification(currentCritical);
        }
      }, 30000); // Setiap 30 detik
    }
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
        setAlarmState((prev) => ({
          ...prev,
          criticalSensors,
        }));
      }
    } else if (alarmState.isActive) {
      stopAlarm();
    }

    // Cleanup on unmount
    // return () => {
    //   if (alarmIntervalRef.current) {
    //     clearInterval(alarmIntervalRef.current);
    //   }
    //   stopAlarmSound();
    //   stopVibration();
    // };
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
