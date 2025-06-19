import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  Wifi, 
  Thermometer, 
  Settings as SettingsIcon,
  Info,
  X,
  Save,
  Database
} from 'lucide-react-native';
import { useSettings } from '@/contexts/SettingsContext';
import { AlarmSettings } from '@/components/AlarmSettings';

interface ThresholdModalProps {
  visible: boolean;
  title: string;
  type: 'temperature' | 'humidity' | 'gas';
  currentWarning: number;
  currentCritical: number;
  unit: string;
  onClose: () => void;
  onSave: (warning: number, critical: number) => void;
}

function ThresholdModal({ visible, title, type, currentWarning, currentCritical, unit, onClose, onSave }: ThresholdModalProps) {
  const [warning, setWarning] = React.useState(currentWarning.toString());
  const [critical, setCritical] = React.useState(currentCritical.toString());

  React.useEffect(() => {
    setWarning(currentWarning.toString());
    setCritical(currentCritical.toString());
  }, [currentWarning, currentCritical]);

  const handleSave = () => {
    const warningNum = parseFloat(warning);
    const criticalNum = parseFloat(critical);
    
    if (isNaN(warningNum) || isNaN(criticalNum)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }
    
    if (type === 'humidity') {
      if (warningNum <= criticalNum) {
        Alert.alert('Error', 'For humidity, the warning value must be greater than the critical value.');
        return;
      }
    } else {
      if (warningNum >= criticalNum) {
        Alert.alert('Error', 'Warning threshold must be less than critical threshold');
        return;
      }
    }
    
    onSave(warningNum, criticalNum);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title} Thresholds</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Warning Threshold ({unit})</Text>
            <TextInput
              style={styles.input}
              value={warning}
              onChangeText={setWarning}
              keyboardType="numeric"
              placeholder={`Enter warning value`}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Critical Threshold ({unit})</Text>
            <TextInput
              style={styles.input}
              value={critical}
              onChangeText={setCritical}
              keyboardType="numeric"
              placeholder={`Enter critical value`}
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={16} color="#fff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface MQTTModalProps {
  visible: boolean;
  currentBroker: string;
  currentTopic: string;
  onClose: () => void;
  onSave: (broker: string, topic: string) => void;
}

function MQTTModal({ visible, currentBroker, currentTopic, onClose, onSave }: MQTTModalProps) {
  const [broker, setBroker] = React.useState(currentBroker);
  const [topic, setTopic] = React.useState(currentTopic);

  React.useEffect(() => {
    setBroker(currentBroker);
    setTopic(currentTopic);
  }, [currentBroker, currentTopic]);

  const handleSave = () => {
    if (!broker.trim() || !topic.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    onSave(broker.trim(), topic.trim());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>MQTT Configuration</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MQTT Broker URL</Text>
            <TextInput
              style={styles.input}
              value={broker}
              onChangeText={setBroker}
              placeholder="ws://broker.hivemq.com:8000/mqtt"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Topic</Text>
            <TextInput
              style={styles.input}
              value={topic}
              onChangeText={setTopic}
              placeholder="iot/project/lutfi/sensordata"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={16} color="#fff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function Settings() {
  const {
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
    updateThreshold,
    mqttConfig,
    setMqttConfig,
    resetToDefaults,
  } = useSettings();
  
  // Modal states
  const [mqttModalVisible, setMqttModalVisible] = React.useState(false);
  const [temperatureModalVisible, setTemperatureModalVisible] = React.useState(false);
  const [humidityModalVisible, setHumidityModalVisible] = React.useState(false);
  const [gasModalVisible, setGasModalVisible] = React.useState(false);

  const handleNotificationToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      Alert.alert('Notifications Enabled', 'You will receive alerts for critical sensor readings. Settings saved to device.');
    } else {
      Alert.alert('Notifications Disabled', 'You will not receive sensor alerts. Settings saved to device.');
    }
  };

  const handleAutoRefreshToggle = (value: boolean) => {
    setAutoRefresh(value);
    Alert.alert(
      value ? 'Auto Refresh Enabled' : 'Auto Refresh Disabled',
      value ? 'Sensor data will update automatically. Settings saved to device.' : 'You will need to manually refresh sensor data. Settings saved to device.'
    );
  };

  const handleMQTTSave = (broker: string, topic: string) => {
    setMqttConfig({ broker, topic });
    Alert.alert('MQTT Configuration Saved', `Broker: ${broker}\nTopic: ${topic}\n\nSettings saved to device. Changes will take effect on next app restart.`);
  };

  const handleThresholdSave = (type: 'temperature' | 'humidity' | 'gas', warning: number, critical: number) => {
    updateThreshold(type, warning, critical);
    Alert.alert('Thresholds Updated', `${type} thresholds have been saved to device and are now active in the dashboard!`);
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values? This will clear all saved settings from your device and immediately affect the dashboard.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            Alert.alert('Settings Reset', 'All settings have been reset to default values, cleared from device storage, and are now active!');
          }
        }
      ]
    );
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
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Configure your dashboard</Text>
          </View>
          <SettingsIcon size={32} color="#fff" />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Storage Info */}
          <View style={styles.settingsCard}>
            <View style={styles.cardHeader}>
              <Database size={24} color="#10b981" />
              <Text style={styles.cardTitle}>Local Storage</Text>
            </View>
            <Text style={styles.storageInfo}>
              ✅ All your settings are automatically saved to your device and will persist when you close or restart the app.
            </Text>
          </View>

          {/* Critical Alarm Settings */}
          <AlarmSettings
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            vibrationEnabled={vibrationEnabled}
            setVibrationEnabled={setVibrationEnabled}
            persistentNotifications={persistentNotifications}
            setPersistentNotifications={setPersistentNotifications}
          />

          {/* Notifications Settings */}
          <View style={styles.settingsCard}>
            <View style={styles.cardHeader}>
              <Bell size={24} color="#3b82f6" />
              <Text style={styles.cardTitle}>Notifications</Text>
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Connection Settings */}
          <View style={styles.settingsCard}>
            <View style={styles.cardHeader}>
              <Wifi size={24} color="#3b82f6" />
              <Text style={styles.cardTitle}>Connection</Text>
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Auto Refresh</Text>
              <Switch
                value={autoRefresh}
                onValueChange={handleAutoRefreshToggle}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={autoRefresh ? '#fff' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => setMqttModalVisible(true)}
            >
              <Text style={styles.settingButtonText}>Configure MQTT Broker</Text>
              <Text style={styles.settingSubtext}>Current: {mqttConfig.broker}</Text>
            </TouchableOpacity>
          </View>

          {/* Sensor Thresholds */}
          <View style={styles.settingsCard}>
            <View style={styles.cardHeader}>
              <Thermometer size={24} color="#3b82f6" />
              <Text style={styles.cardTitle}>Sensor Thresholds</Text>
            </View>
            <Text style={styles.cardSubtitle}>Changes are saved to device and apply immediately to dashboard and alarms</Text>
            
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => setTemperatureModalVisible(true)}
            >
              <Text style={styles.settingButtonText}>Temperature Limits</Text>
              <Text style={styles.settingSubtext}>
                Warning: {'>'}{thresholds.temperature.warning}°C | Critical: {'>'}{thresholds.temperature.critical}°C
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => setHumidityModalVisible(true)}
            >
              <Text style={styles.settingButtonText}>Humidity Limits</Text>
              <Text style={styles.settingSubtext}>
                Warning: {'<'}{thresholds.humidity.warning}% | Critical: {'<'}{thresholds.humidity.critical}%
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => setGasModalVisible(true)}
            >
              <Text style={styles.settingButtonText}>Gas Limits</Text>
              <Text style={styles.settingSubtext}>
                Warning: {'>'}{thresholds.gas.warning} PPM | Critical: {'>'}{thresholds.gas.critical} PPM
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reset Settings */}
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={[styles.settingButton, styles.resetButton]}
              onPress={handleResetToDefaults}
            >
              <Text style={styles.resetButtonText}>Reset to Default Settings</Text>
              <Text style={styles.resetSubtext}>This will clear all saved settings from your device</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modals */}
        <MQTTModal
          visible={mqttModalVisible}
          currentBroker={mqttConfig.broker}
          currentTopic={mqttConfig.topic}
          onClose={() => setMqttModalVisible(false)}
          onSave={handleMQTTSave}
        />

        <ThresholdModal
          visible={temperatureModalVisible}
          title="Temperature"
          type="temperature"
          currentWarning={thresholds.temperature.warning}
          currentCritical={thresholds.temperature.critical}
          unit="°C"
          onClose={() => setTemperatureModalVisible(false)}
          onSave={(warning, critical) => handleThresholdSave('temperature', warning, critical)}
        />

        <ThresholdModal
          visible={humidityModalVisible}
          title="Humidity"
          type="humidity"
          currentWarning={thresholds.humidity.warning}
          currentCritical={thresholds.humidity.critical}
          unit="%"
          onClose={() => setHumidityModalVisible(false)}
          onSave={(warning, critical) => handleThresholdSave('humidity', warning, critical)}
        />

        <ThresholdModal
          visible={gasModalVisible}
          title="Gas"
          type="gas"
          currentWarning={thresholds.gas.warning}
          currentCritical={thresholds.gas.critical}
          unit="PPM"
          onClose={() => setGasModalVisible(false)}
          onSave={(warning, critical) => handleThresholdSave('gas', warning, critical)}
        />
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
    alignItems: 'center',
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
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  storageInfo: {
    fontSize: 14,
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  settingButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  resetButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
    textAlign: 'center',
  },
  resetSubtext: {
    fontSize: 12,
    color: '#991b1b',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});