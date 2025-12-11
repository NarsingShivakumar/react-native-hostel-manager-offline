import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { database } from '../database';
import { Q } from '@nozbe/watermelondb';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import GuestListScreen from '../screens/Guests/GuestListScreen';
import PendingPaymentsScreen from '../screens/Payments/PendingPaymentsScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import Ionicons from '@react-native-vector-icons/ionicons';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    loadPendingCount();
    
    const subscription = database.get('guests')
      .query(Q.where('is_active', true))
      .observe()
      .subscribe(() => {
        loadPendingCount();
      });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const loadPendingCount = async () => {
    const guests = await database.get('guests')
      .query(Q.where('is_active', true))
      .fetch();
    
    const overdue = guests.filter(g => g.isPaymentOverdue);
    setPendingCount(overdue.length);
  };
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            Guests: focused ? 'people' : 'people-outline',
            Payments: focused ? 'cash' : 'cash-outline',
            Reports: focused ? 'stats-chart' : 'stats-chart-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: '#6200ee' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen 
        name="Guests" 
        component={GuestListScreen}
        options={{ title: 'All Guests' }}
      />
      <Tab.Screen 
        name="Payments" 
        component={PendingPaymentsScreen}
        options={{
          title: 'Pending Payments',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#f44336',
            color: '#fff',
          },
        }}
      />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
