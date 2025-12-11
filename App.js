import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator'
// import { database } from './database';
import {database} from './src/database/index'
import NotificationService from './src/services/NotificationService';
import PaymentReminderService from './src/services/PaymentReminderService';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore specific warnings

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize notifications
       await database.write(async () => {
          console.log('Database write test successful');
        });
      await NotificationService.initialize();
      
      // Schedule payment reminders
      await PaymentReminderService.scheduleAllReminders();
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#6200ee" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
