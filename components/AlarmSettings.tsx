import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Bell, Volume2, VolumeX, Smartphone } from 'lucide-react-native';

interface AlarmSettingsProps {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (enabled: boolean) => void;
  persistentNotifications: boolean;
  setPersistentNotifications: (enabled: boolean) => void;
}

export function AlarmSettings({
  soundEnabled,
  setSoundEnabled,
  vibrationEnabled,
  setVibrationEnabled,
  persistentNotifications,
  setPersistentNotifications,
}: AlarmSettingsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bell size={24} color="#dc2626" />
        <Text style={styles.title}>Critical Alarm Settings</Text>
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          {soundEnabled ? (
            <Volume2 size={20} color="#374151" />
          ) : (
            <VolumeX size={20} color="#6b7280" />
          )}
          <View style={styles.settingText}>
            <Text style={styles.settingLabel}>Alarm Sound</Text>
            <Text style={styles.settingDescription}>
              Play continuous alarm sound during critical states
            </Text>
          </View>
        </View>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          trackColor={{ false: '#d1d5db', true: '#dc2626' }}
          thumbColor={soundEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Smartphone size={20} color="#374151" />
          <View style={styles.settingText}>
            <Text style={styles.settingLabel}>Vibration</Text>
            <Text style={styles.settingDescription}>
              Vibrate device during critical alarms (mobile only)
            </Text>
          </View>
        </View>
        <Switch
          value={vibrationEnabled}
          onValueChange={setVibrationEnabled}
          trackColor={{ false: '#d1d5db', true: '#dc2626' }}
          thumbColor={vibrationEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Bell size={20} color="#374151" />
          <View style={styles.settingText}>
            <Text style={styles.settingLabel}>Persistent Notifications</Text>
            <Text style={styles.settingDescription}>
              Send repeated notifications every 30 seconds during alarms
            </Text>
          </View>
        </View>
        <Switch
          value={persistentNotifications}
          onValueChange={setPersistentNotifications}
          trackColor={{ false: '#d1d5db', true: '#dc2626' }}
          thumbColor={persistentNotifications ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How Critical Alarms Work:</Text>
        <Text style={styles.infoText}>
          • Triggered when any sensor exceeds critical thresholds{'\n'}
          • Continuous sound and vibration alerts{'\n'}
          • Repeated notifications every 30 seconds{'\n'}
          • Automatically stops when all sensors return to safe levels{'\n'}
          • Can be manually dismissed from the alarm banner{'\n'}
          • All settings are automatically saved to your device
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 16,
  },
});