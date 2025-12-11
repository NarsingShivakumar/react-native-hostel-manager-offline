import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalGuests: 0,
    activeGuests: 0,
    overduePayments: 0,
    todayCollection: 0,
    monthlyCollection: 0,
    totalPending: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Load stats on mount and subscribe to changes
  useEffect(() => {
    loadStats();

    // Subscribe to both guests AND payments changes
    const guestsSubscription = database
      .get('guests')
      .query()
      .observe()
      .subscribe(() => {
        loadStats();
      });

    const paymentsSubscription = database
      .get('payments')
      .query()
      .observe()
      .subscribe(() => {
        loadStats();
      });

    return () => {
      guestsSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
    };
  }, []);

  // Reload stats when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const loadStats = async () => {
    try {
      const guests = await database.get('guests').query().fetch();
      const payments = await database.get('payments').query().fetch();

      const activeGuests = guests.filter(g => g.isActive);
      const overdueGuests = activeGuests.filter(g => g.isPaymentOverdue);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayPayments = payments.filter(
        p => p.status === 'paid' && p.paymentDate >= today.getTime()
      );

      const monthStart = startOfMonth(new Date()).getTime();
      const monthEnd = endOfMonth(new Date()).getTime();

      const monthlyPayments = payments.filter(
        p =>
          p.status === 'paid' &&
          p.paymentDate >= monthStart &&
          p.paymentDate <= monthEnd
      );

      const todayCollection = todayPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthlyCollection = monthlyPayments.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      const totalPending = overdueGuests.reduce(
        (sum, g) => sum + g.paymentAmount,
        0
      );

      setStats({
        totalGuests: guests.length,
        activeGuests: activeGuests.length,
        overduePayments: overdueGuests.length,
        todayCollection,
        monthlyCollection,
        totalPending,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Stats Cards Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="people"
          title="Total Guests"
          value={stats.totalGuests}
          color="#2196f3"
          onPress={() => navigation.navigate('Guests')}
        />
        <StatCard
          icon="checkmark-circle"
          title="Active Guests"
          value={stats.activeGuests}
          color="#4caf50"
          onPress={() => navigation.navigate('Guests')}
        />
        <StatCard
          icon="alert-circle"
          title="Overdue Payments"
          value={stats.overduePayments}
          color="#f44336"
          onPress={() => navigation.navigate('Payments')}
        />
        <StatCard
          icon="hourglass"
          title="Total Pending"
          value={`₹${stats.totalPending.toLocaleString('en-IN')}`}
          color="#ff9800"
          onPress={() => navigation.navigate('Payments')}
        />
      </View>

      {/* Collection Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collections</Text>
        <View style={styles.collectionCards}>
          <View style={[styles.collectionCard, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="calendar-outline" size={32} color="#2196f3" />
            <Text style={styles.collectionValue}>
              ₹{stats.todayCollection.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.collectionLabel}>Today</Text>
          </View>

          <View style={[styles.collectionCard, { backgroundColor: '#f3e5f5' }]}>
            <Ionicons name="calendar" size={32} color="#9c27b0" />
            <Text style={styles.collectionValue}>
              ₹{stats.monthlyCollection.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.collectionLabel}>This Month</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <QuickActionButton
          icon="person-add"
          title="Add New Guest"
          subtitle="Register a new guest"
          onPress={() => navigation.navigate('AddGuest')}
        />

        <QuickActionButton
          icon="cash"
          title="Add Payment"
          subtitle="Record a payment"
          onPress={() => navigation.navigate('AddPayment')}
        />

        <QuickActionButton
          icon="people"
          title="View All Guests"
          subtitle="Manage your guests"
          onPress={() => navigation.navigate('Guests')}
        />

        <QuickActionButton
          icon="download"
          title="Export/Import Data"
          subtitle="Backup or restore data"
          onPress={() => navigation.navigate('ExportImport')}
        />
      </View>
    </ScrollView>
  );
}

const StatCard = ({ icon, title, value, color, onPress }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderLeftColor: color }]}
    onPress={onPress}>
    <Ionicons name={icon} size={28} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const QuickActionButton = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={styles.actionIconContainer}>
      <Ionicons name={icon} size={24} color="#6200ee" />
    </View>
    <View style={styles.actionContent}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    margin: '1%',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  collectionCards: {
    flexDirection: 'row',
    gap: 12,
  },
  collectionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  collectionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  collectionLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3e5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
});
