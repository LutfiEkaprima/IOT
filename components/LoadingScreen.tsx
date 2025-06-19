import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings } from 'lucide-react-native';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#3b82f6', '#60a5fa']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Settings size={64} color="#fff" />
          <Text style={styles.title}>IoT Dashboard</Text>
          <Text style={styles.subtitle}>Loading your settings...</Text>
          <ActivityIndicator 
            size="large" 
            color="#fff" 
            style={styles.spinner}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 10,
  },
});