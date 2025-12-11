import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { database } from '../../database';
import withObservables from '@nozbe/with-observables';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
} from 'date-fns';
import Ionicons from '@react-native-vector-icons/ionicons';

function ReportsScreen({ navigation, guests, payments }) {
  const [stats, setStats] = useState({
    todayCollection: 0,
    weeklyCollection: 0,
    monthlyCollection: 0,
    totalPending: 0,
    totalGuests: 0,
    activeGuests: 0,
    overdueGuests: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [guests, payments]);

  const calculateStats = () => {
    const activeGuests = guests.filter(g => g.isActive);
    const overdueGuests = activeGuests.filter(g => g.isPaymentOverdue);

    const todayStart = startOfDay(new Date()).getTime();
    const todayEnd = endOfDay(new Date()).getTime();
    const weekStart = startOfWeek(new Date()).getTime();
    const weekEnd = endOfWeek(new Date()).getTime();
    const monthStart = startOfMonth(new Date()).getTime();
    const monthEnd = endOfMonth(new Date()).getTime();

    const todayPayments = payments.filter(
      p => p.status === 'paid' && p.paymentDate >= todayStart && p.paymentDate <= todayEnd
    );

    const weeklyPayments = payments.filter(
      p => p.status === 'paid' && p.paymentDate >= weekStart && p.paymentDate <= weekEnd
    );

    const monthlyPayments = payments.filter(
      p => p.status === 'paid' && p.paymentDate >= monthStart && p.paymentDate <= monthEnd
    );

    const todayCollection = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const weeklyCollection = weeklyPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthlyCollection = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = overdueGuests.reduce((sum, g) => sum + g.paymentAmount, 0);

    setStats({
      todayCollection,
      weeklyCollection,
      monthlyCollection,
      totalPending,
      totalGuests: guests.length,
      activeGuests: activeGuests.length,
      overdueGuests: overdueGuests.length,
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Collection Report */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collection Report</Text>

        <ReportCard
          icon="calendar-outline"
          label="Today's Collection"
          value={`₹${stats.todayCollection.toLocaleString('en-IN')}`}
          color="#4caf50"
        />

        <ReportCard
          icon="calendar"
          label="This Week"
          value={`₹${stats.weeklyCollection.toLocaleString('en-IN')}`}
          color="#2196f3"
        />

        <ReportCard
          icon="calendar-sharp"
          label="This Month"
          value={`₹${stats.monthlyCollection.toLocaleString('en-IN')}`}
          color="#9c27b0"
        />

        <ReportCard
          icon="alert-circle"
          label="Total Pending"
          value={`₹${stats.totalPending.toLocaleString('en-IN')}`}
          color="#f44336"
        />
      </View>

      {/* Guest Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guest Statistics</Text>

        <View style={styles.statsGrid}>
          <StatBox
            icon="people"
            label="Total Guests"
            value={stats.totalGuests}
            color="#2196f3"
          />

          <StatBox
            icon="checkmark-circle"
            label="Active Guests"
            value={stats.activeGuests}
            color="#4caf50"
          />

          <StatBox
            icon="alert-circle"
            label="Overdue Payments"
            value={stats.overdueGuests}
            color="#f44336"
          />

          <StatBox
            icon="receipt"
            label="Total Payments"
            value={payments.length}
            color="#ff9800"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export & Backup</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ExportImport')}>
          <View style={styles.actionLeft}>
            <View style={[styles.reportIcon, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="download" size={28} color="#2196f3" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Export Data</Text>
              <Text style={styles.actionSubtitle}>Export all data to CSV or JSON</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ExportImport')}>
          <View style={styles.actionLeft}>
            <View style={[styles.reportIcon, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="cloud-upload" size={28} color="#ff9800" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Import Data</Text>
              <Text style={styles.actionSubtitle}>Restore data from backup file</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const ReportCard = ({ icon, label, value, color }) => (
  <View style={styles.reportCard}>
    <View style={[styles.reportIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <View style={styles.reportContent}>
      <Text style={styles.reportLabel}>{label}</Text>
      <Text style={styles.reportValue}>{value}</Text>
    </View>
  </View>
);

const StatBox = ({ icon, label, value, color }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={32} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ✅ Make it fully reactive with withObservables
const enhance = withObservables([], () => ({
  guests: database.get('guests').query().observe(),
  payments: database.get('payments').query().observe(),
}));

export default enhance(ReportsScreen);

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportContent: {
    marginLeft: 16,
    flex: 1,
  },
  reportLabel: {
    fontSize: 14,
    color: '#666',
  },
  reportValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionContent: {
    marginLeft: 16,
    flex: 1,
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
