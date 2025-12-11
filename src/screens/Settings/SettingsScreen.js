import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { database } from '../../database';
import NotificationService from '../../services/NotificationService';
import PaymentReminderService from '../../services/PaymentReminderService';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function SettingsScreen({ navigation }) {
  const handleResyncNotifications = async () => {
    Alert.alert(
      'Resync Notifications',
      'This will reschedule all payment reminders. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resync',
          onPress: async () => {
            try {
              await PaymentReminderService.scheduleAllReminders();
              Alert.alert('Success', 'Notifications resynced successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to resync notifications');
            }
          },
        },
      ]
    );
  };
  
  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all guests, payments, and other data. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                const guests = await database.get('guests').query().fetch();
                const payments = await database.get('payments').query().fetch();
                const guardians = await database.get('guardians').query().fetch();
                const logs = await database.get('notification_logs').query().fetch();
                
                for (const item of [...guests, ...payments, ...guardians, ...logs]) {
                  await item.markAsDeleted();
                }
              });
              
              await NotificationService.cancelAllNotifications();
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };
  
  const handleRateApp = () => {
    const storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/idYOUR_APP_ID'
      : 'https://play.google.com/store/apps/details?id=com.pgmanager';
    Linking.openURL(storeUrl);
  };
  
  const handleShareApp = () => {
    Share.open({
      message: 'Check out PG Manager app for managing hostel and PG payments!',
      url: 'https://your-app-url.com',
    });
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* App Info */}
      <View style={styles.section}>
        <View style={styles.appInfo}>
          <Ionicons name="home-outline" size={64} color="#6200ee" />
          <Text style={styles.appName}>PG Manager</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </View>
      
      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <SettingItem
          icon="notifications-outline"
          title="Resync Notifications"
          subtitle="Reschedule all payment reminders"
          onPress={handleResyncNotifications}
        />
        
        <SettingItem
          icon="notifications-off-outline"
          title="Test Notification"
          subtitle="Send a test notification"
          onPress={() => {
            NotificationService.sendNotification(
              { id: 'test', fullName: 'Test User' },
              'Test Notification',
              'This is a test notification from PG Manager'
            );
          }}
        />
      </View>
      
      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <SettingItem
          icon="cloud-upload-outline"
          title="Export Data"
          subtitle="Backup your data"
          onPress={() => navigation.navigate('ExportImport')}
        />
        
        <SettingItem
          icon="cloud-download-outline"
          title="Import Data"
          subtitle="Restore from backup"
          onPress={() => navigation.navigate('ExportImport')}
        />
        
        <SettingItem
          icon="trash-bin-outline"
          title="Clear All Data"
          subtitle="Delete all guests and payments"
          onPress={handleClearData}
          danger
        />
      </View>
      
      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <SettingItem
          icon="star"
          title="Rate App"
          subtitle="Rate us on the app store"
          onPress={handleRateApp}
        />
        
        <SettingItem
          icon="share"
          title="Share App"
          subtitle="Share with friends"
          onPress={handleShareApp}
        />
        
        <SettingItem
          icon="information"
          title="Version"
          subtitle="1.0.0"
        />
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const SettingItem = ({ icon, title, subtitle, onPress, danger }) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[styles.iconContainer, danger && { backgroundColor: '#ffebee' }]}>
      <Ionicons name={icon} size={24} color={danger ? '#f44336' : '#6200ee'} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && { color: '#f44336' }]}>
        {title}
      </Text>
      <Text style={styles.settingSubtitle}>{subtitle}</Text>
    </View>
    {onPress && <Ionicons name="chevron-forward" size={24} color="#999" />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  appVersion: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3e5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
});
