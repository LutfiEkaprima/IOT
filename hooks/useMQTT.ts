import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
// Pastikan untuk mengimpor tipe baru
import { SensorData, ConnectionStatus, ConnectionStateType } from '@/types/sensors'; 
import 'react-native-url-polyfill/auto';
import mqtt from 'mqtt';

const MQTT_CONFIG = {
  broker: 'wss://broker.hivemq.com:8884/mqtt',
  topic: 'iot/project/lutfi/sensordata',
};

// --- AWAL PERUBAHAN ---

export function useMQTT() {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 25,
    humidity: 100,
    gas: 0,
    timestamp: Date.now(),
  });

  // Inisialisasi status awal sebagai 'disconnected'
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    state: 'disconnected',
    uptime: 0,
    lastUpdate: Date.now(),
  });
  
  // Gunakan useRef untuk menyimpan ID timer
  const connectingTimer = useRef<NodeJS.Timeout | null>(null);
  const disconnectedTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let client: mqtt.MqttClient | null = null;
    let uptimeInterval: NodeJS.Timeout;

    const connectMQTT = () => {
      try {
        client = mqtt.connect(MQTT_CONFIG.broker, {
          keepalive: 60,
          reconnectPeriod: 1000,
        });

        client.on('connect', () => {
          console.log('Connected to MQTT broker');
          // Saat terhubung, set status ke 'connected'
          setConnectionStatus(prev => ({
            ...prev,
            state: 'connected',
            lastUpdate: Date.now(),
          }));

          client?.subscribe(MQTT_CONFIG.topic, (err) => {
            if (err) {
              console.error('Failed to subscribe:', err);
            } else {
              console.log('Subscribed to topic:', MQTT_CONFIG.topic);
            }
          });
        });

        client.on('message', (topic: string, message: Buffer) => {
          try {
            const data = JSON.parse(message.toString());
            setSensorData({
              temperature: data.temperature || 0,
              humidity: data.humidity || 0,
              gas: data.gasLevel || 0,
              timestamp: Date.now(),
            });

            // Setiap kali pesan diterima, set status ke 'connected' dan perbarui lastUpdate
            setConnectionStatus(prev => ({
              ...prev,
              state: 'connected', 
              lastUpdate: Date.now(),
            }));
          } catch (error) {
            console.error('Failed to parse MQTT message:', error);
          }
        });

        const handleDisconnect = () => {
          console.log('MQTT connection closed or error');
           // Saat koneksi terputus, set status ke 'disconnected'
          setConnectionStatus(prev => ({ ...prev, state: 'disconnected' }));
          if (uptimeInterval) clearInterval(uptimeInterval);
        };

        client.on('error', handleDisconnect);
        client.on('close', handleDisconnect);

        // Mulai penghitung waktu aktif
        uptimeInterval = setInterval(() => {
          setConnectionStatus(prev => ({
            ...prev,
            uptime: prev.state === 'connected' ? prev.uptime + 1 : 0,
          }));
        }, 1000);

      } catch (error) {
        console.error('Failed to connect to MQTT:', error);
        setConnectionStatus(prev => ({ ...prev, state: 'disconnected' }));
      }
    };

    connectMQTT();

    return () => {
      if (client) {
        client.end();
      }
      if (uptimeInterval) {
        clearInterval(uptimeInterval);
      }
       // Pastikan untuk membersihkan timer saat komponen di-unmount
      if (connectingTimer.current) clearTimeout(connectingTimer.current);
      if (disconnectedTimer.current) clearTimeout(disconnectedTimer.current);
    };
  }, []);

  // Hook untuk memantau waktu idle koneksi
  useEffect(() => {
    // Bersihkan timer sebelumnya setiap kali ada pembaruan
    if (connectingTimer.current) clearTimeout(connectingTimer.current);
    if (disconnectedTimer.current) clearTimeout(disconnectedTimer.current);

    // Hanya atur timer jika status saat ini 'connected'
    if (connectionStatus.state === 'connected') {
      // Atur timer untuk mengubah status ke 'connecting' setelah 5 detik
      connectingTimer.current = setTimeout(() => {
        setConnectionStatus(prev => ({ ...prev, state: 'connecting' }));
      }, 5000); // 5 detik

      // Atur timer untuk mengubah status ke 'disconnected' setelah 30 detik
      disconnectedTimer.current = setTimeout(() => {
        setConnectionStatus(prev => ({ ...prev, state: 'disconnected' }));
      }, 30000); // 30 detik
    }

    // Fungsi cleanup untuk membersihkan timer jika hook ini berjalan lagi atau unmount
    return () => {
      if (connectingTimer.current) clearTimeout(connectingTimer.current);
      if (disconnectedTimer.current) clearTimeout(disconnectedTimer.current);
    };
  }, [connectionStatus.lastUpdate, connectionStatus.state]); // Dijalankan ulang saat lastUpdate atau state berubah

  return { sensorData, connectionStatus };
}
// --- AKHIR PERUBAHAN ---