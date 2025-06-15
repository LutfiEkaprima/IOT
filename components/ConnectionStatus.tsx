import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wifi, WifiOff, Clock } from 'lucide-react-native';
// Impor tipe baru
import { ConnectionStatus } from '@/types/sensors';

interface ConnectionStatusProps {
  status: ConnectionStatus;
}

export function ConnectionStatusComponent({ status }: ConnectionStatusProps) {
  // ... (fungsi formatUptime dan getLastUpdateText tidak perlu diubah)
  const formatUptime = (seconds: number) => {
    // ... implementasi yang ada
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getLastUpdateText = () => {
    const timeDiff = Math.floor((Date.now() - status.lastUpdate) / 1000);
    if (timeDiff < 5) return 'Just now';
    if (timeDiff < 60) return `${timeDiff}s ago`;
    const minutes = Math.floor(timeDiff / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };


  // --- AWAL PERUBAHAN ---
  const getStatusDetails = () => {
    switch (status.state) {
      case 'connected':
        return {
          icon: <Wifi size={18} color="#22c55e" />,
          text: 'Connected',
          color: '#22c55e',
        };
      case 'connecting':
        return {
          // Menggunakan ikon Wifi berwarna kuning
          icon: <Wifi size={18} color="#f59e0b" />, 
          text: 'Connecting...',
          color: '#f59e0b', // Kuning
        };
      case 'disconnected':
      default:
        return {
          icon: <WifiOff size={18} color="#ef4444" />,
          text: 'Disconnected',
          color: '#ef4444',
        };
    }
  };

  const { icon, text, color } = getStatusDetails();
  // --- AKHIR PERUBAHAN ---

  return (
    <View style={styles.container}>
      <View style={styles.connectionRow}>
        {icon}
        <Text style={[styles.connectionText, { color }]}>
          {text}
        </Text>
      </View>
      
      {/* Tampilkan uptime hanya jika terhubung */}
      {status.state === 'connected' && (
        <View style={styles.uptimeRow}>
          <Clock size={16} color="#6b7280" />
          <Text style={styles.uptimeText}>
            {formatUptime(status.uptime)}
          </Text>
        </View>
      )}
      
      {/* Tampilkan waktu pembaruan terakhir jika tidak disconnected */}
      {status.state !== 'disconnected' && (
        <Text style={styles.lastUpdate}>
          Updated: {getLastUpdateText()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  uptimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  uptimeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  lastUpdate: {
    fontSize: 10,
    color: '#9ca3af',
  },
});