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
import { useMQTT } from '@/hooks/useMQTT';
import { useNotifications } from '@/hooks/useNotifications';
import { useSettings } from '@/contexts/SettingsContext';
import { SensorStatus } from '@/types/sensors';

export default function Dashboard() {
  const { sensorData, connectionStatus } = useMQTT();
  const { thresholds } = useSettings();
  useNotifications(sensorData);
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
  thresholdsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    marginBottom: 20,
  },
  thresholdsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  thresholdRow: {
    marginBottom: 8,
  },
  thresholdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  thresholdValue: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusIndicators: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});