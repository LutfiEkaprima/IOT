import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { SensorData, ConnectionStatus } from '@/types/sensors';
import 'react-native-url-polyfill/auto';
// Gunakan default import untuk kompatibilitas yang lebih baik di React Native
import mqtt from 'mqtt';

// MQTT configuration
const MQTT_CONFIG = {
  // Ganti protokol ke WebSocket dan gunakan port 8000
  broker: 'wss://broker.hivemq.com:8884/mqtt', 
  topic: 'iot/project/lutfi/sensordata', // Ganti dengan topik Anda
};

export function useMQTT() {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 25,
    humidity: 100,
    gas: 0,
    timestamp: Date.now(),
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    uptime: 0,
    lastUpdate: Date.now(),
  });

  useEffect(() => {
    // Pastikan client diinisialisasi sebagai null
    let client: mqtt.MqttClient | null = null;
    let uptimeInterval: NodeJS.Timeout;

    const connectMQTT = () => {
      try {
        // Logika ini sekarang akan berjalan di semua platform (termasuk web)
        client = mqtt.connect(MQTT_CONFIG.broker, {
          keepalive: 60,
          reconnectPeriod: 1000,
        });

        client.on('connect', () => {
          console.log('Connected to MQTT broker via WebSocket');
          setConnectionStatus(prev => ({
            ...prev,
            connected: true,
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

            setConnectionStatus(prev => ({
              ...prev,
              lastUpdate: Date.now(),
            }));
          } catch (error) {
            console.error('Failed to parse MQTT message:', error);
          }
        });

        client.on('error', (err: any) => {
          console.error('MQTT error:', err);
          setConnectionStatus(prev => ({ ...prev, connected: false }));
        });

        client.on('close', () => {
          console.log('MQTT connection closed');
          setConnectionStatus(prev => ({ ...prev, connected: false }));
        });

        // Mulai penghitung waktu aktif
        uptimeInterval = setInterval(() => {
          setConnectionStatus(prev => ({
            ...prev,
            uptime: prev.connected ? prev.uptime + 1 : 0,
          }));
        }, 1000);

      } catch (error) {
        console.error('Failed to connect to MQTT:', error);
        setConnectionStatus(prev => ({ ...prev, connected: false }));
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
    };
  }, []);

  return { sensorData, connectionStatus };
}
