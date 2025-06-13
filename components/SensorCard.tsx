import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Thermometer, Droplets, Wind } from 'lucide-react-native';
import { SensorStatus } from '@/types/sensors';

interface SensorCardProps {
  type: 'temperature' | 'humidity' | 'gas';
  value: number;
  unit: string;
  status: SensorStatus;
  title: string;
}

export function SensorCard({ type, value, unit, status, title }: SensorCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'temperature':
        return <Thermometer size={32} color="#fff" />;
      case 'humidity':
        return <Droplets size={32} color="#fff" />;
      case 'gas':
        return <Wind size={32} color="#fff" />;
      default:
        return <Thermometer size={32} color="#fff" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'normal':
        return '#22c55e'; // Green
      case 'warning':
        return '#f59e0b'; // Yellow
      case 'critical':
        return '#ef4444'; // Red
      default:
        return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'normal':
        return 'Normal';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: getStatusColor() }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.value}>
          {value.toFixed(1)}
          <Text style={styles.unit}> {unit}</Text>
        </Text>
        <Text style={styles.status}>{getStatusText()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    margin: 8,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  unit: {
    fontSize: 16,
    fontWeight: '400',
  },
  status: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});