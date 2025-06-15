import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SensorCard } from '@/components/SensorCard';
import { ConnectionStatusComponent } from '@/components/ConnectionStatus';
import { AlarmIndicator } from '@/components/AlarmIndicator';
import { useMQTT } from '@/hooks/useMQTT';
import { useAlarmSystem } from '@/hooks/useAlarmSystem';
import { useSettings } from '@/contexts/SettingsContext';
import { SensorStatus } from '@/types/sensors';

export default function Dashboard() {
  const { sensorData, connectionStatus } = useMQTT();
  const { thresholds } = useSettings();
  const { 
    alarmState, 
    stopAlarm, 
    isAlarmActive, 
    criticalSensors, 
    alarmDuration 
  } = useAlarmSystem(sensorData);
  
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getSensorStatus = (
    value: number,
    type: 'temperature' | 'humidity' | 'gas'
  ): SensorStatus => {
    const threshold = thresholds[type];

    if (type === 'humidity') {
      // Logika terbalik untuk kelembapan: nilai lebih rendah lebih buruk
      if (value < threshold.critical) return 'critical';
      if (value < threshold.warning) return 'warning';
      return 'normal';
    } else {
      // Logika standar untuk suhu dan gas: nilai lebih tinggi lebih buruk
      if (value >= threshold.critical) return 'critical';
      if (value >= threshold.warning) return 'warning';
      return 'normal';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#3b82f6', '#60a5fa']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>IoT Dashboard</Text>
            <Text style={styles.subtitle}>ESP32 Sensor Monitor</Text>
          </View>
          <ConnectionStatusComponent status={connectionStatus} />
        </View>

        {/* Critical Alarm Indicator */}
        {isAlarmActive && (
          <AlarmIndicator
            isActive={isAlarmActive}
            criticalSensors={criticalSensors}
            alarmDuration={alarmDuration}
            onDismiss={stopAlarm}
          />
        )}

        {/* Body */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
        >
          <View style={styles.sensorsGrid}>
            <SensorCard
              type="temperature"
              title="Temperature"
              value={sensorData.temperature}
              unit="°C"
              status={getSensorStatus(sensorData.temperature, 'temperature')}
            />
            
            <SensorCard
              type="humidity"
              title="Humidity"
              value={sensorData.humidity}
              unit="%"
              status={getSensorStatus(sensorData.humidity, 'humidity')}
            />
            
            <SensorCard
              type="gas"
              title="Gas Level"
              value={sensorData.gas}
              unit="PPM"
              status={getSensorStatus(sensorData.gas, 'gas')}
            />
          </View>

          {/* Alarm Status Info */}
          {isAlarmActive && (
            <View style={styles.alarmStatusCard}>
              <Text style={styles.alarmStatusTitle}>🚨 Critical Alarm Active</Text>
              <Text style={styles.alarmStatusText}>
                Duration: {Math.floor(alarmDuration / 60)}:{(alarmDuration % 60).toString().padStart(2, '0')}
              </Text>
              <Text style={styles.alarmStatusText}>
                Critical Sensors: {criticalSensors.join(', ')}
              </Text>
              <Text style={styles.alarmStatusSubtext}>
                The alarm will automatically stop when all sensors return to safe levels.
              </Text>
            </View>
          )}

        </ScrollView>

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sensorsGrid: {
    marginBottom: 20,
  },
  alarmStatusCard: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    marginBottom: 20,
  },
  alarmStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  alarmStatusText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
    fontWeight: '500',
  },
  alarmStatusSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    fontStyle: 'italic',
  },
});