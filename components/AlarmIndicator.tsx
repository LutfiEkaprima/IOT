import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { TriangleAlert as AlertTriangle, X, Clock } from 'lucide-react-native';

interface AlarmIndicatorProps {
  isActive: boolean;
  criticalSensors: string[];
  alarmDuration: number;
  onDismiss: () => void;
}

export function AlarmIndicator({ 
  isActive, 
  criticalSensors, 
  alarmDuration, 
  onDismiss 
}: AlarmIndicatorProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isActive, pulseAnim]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSensorDisplayName = (sensor: string) => {
    switch (sensor) {
      case 'temperature': return 'Temperature';
      case 'humidity': return 'Humidity';
      case 'gas': return 'Gas Level';
      default: return sensor;
    }
  };

  if (!isActive) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <AlertTriangle size={24} color="#fff" />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>CRITICAL ALARM</Text>
          <View style={styles.durationContainer}>
            <Clock size={14} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.duration}>{formatDuration(alarmDuration)}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={onDismiss}
        >
          <X size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.sensorsContainer}>
        <Text style={styles.sensorsLabel}>Critical Sensors:</Text>
        {criticalSensors.map((sensor, index) => (
          <View key={sensor} style={styles.sensorChip}>
            <Text style={styles.sensorText}>
              {getSensorDisplayName(sensor)}
            </Text>
          </View>
        ))}
      </View>
      
      <Text style={styles.instruction}>
        Take immediate action to address critical sensor readings
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#dc2626',
    margin: 12,
    borderRadius: 12,
    padding: 16,
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  dismissButton: {
    padding: 4,
  },
  sensorsContainer: {
    marginBottom: 12,
  },
  sensorsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '600',
  },
  sensorChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  sensorText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  instruction: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});