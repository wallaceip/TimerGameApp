import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { initActiveProfile } from '@/utils/storage';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initActiveProfile().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={Colors.neonCyan} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="stopwatch"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="beep"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="profiles"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
