import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationRef } from './navigationRef';
import MainTabNavigator from './MainTabNavigator';
import AddGuestScreen from '../screens/Guests/AddGuestScreen';
import GuestDetailsScreen from '../screens/Guests/GuestDetailsScreen';
import EditGuestScreen from '../screens/Guests/EditGuestScreen';
import AddPaymentScreen from '../screens/Payments/AddPaymentScreen';
import PaymentHistoryScreen from '../screens/Payments/PaymentHistoryScreen';
import PaymentDetailsScreen from '../screens/Payments/PaymentDetailsScreen';
import ExportImportScreen from '../screens/Reports/ExportImportScreen';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['pgmanager://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Dashboard: 'dashboard',
          Guests: 'guests',
          Payments: 'payments',
          Reports: 'reports',
          Settings: 'settings',
        },
      },
      GuestDetails: {
        path: 'guest/:guestId',
        parse: {
          guestId: (id) => `${id}`,
        },
      },
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#6200ee' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen
            name="AddGuest"
            component={AddGuestScreen}
            options={{ title: 'Add New Guest' }}
          />
          <Stack.Screen
            name="AddPayment"
            component={AddPaymentScreen}
            options={{ title: 'Record Payment' }}
          />
          <Stack.Screen
            name="ExportImport"
            component={ExportImportScreen}
            options={{ title: 'Export / Import Data' }}
          />
        </Stack.Group>
        
        <Stack.Screen
          name="GuestDetails"
          component={GuestDetailsScreen}
          options={({ route }) => ({
            title: route.params?.guestName || 'Guest Details',
          })}
        />
        <Stack.Screen
          name="EditGuest"
          component={EditGuestScreen}
          options={{ title: 'Edit Guest' }}
        />
        <Stack.Screen
          name="PaymentHistory"
          component={PaymentHistoryScreen}
          options={{ title: 'Payment History' }}
        />
        <Stack.Screen
          name="PaymentDetails"
          component={PaymentDetailsScreen}
          options={{ title: 'Payment Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
