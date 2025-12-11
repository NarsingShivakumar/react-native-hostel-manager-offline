import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Ionicons from '@react-native-vector-icons/ionicons';
import withObservables from '@nozbe/with-observables';
import { switchMap } from '@nozbe/watermelondb/utils/rx';

function PaymentHistoryScreen({ route, navigation }) {
  const { guestId } = route.params;
  const [payments, setPayments] = useState([]);
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, paid, pending
  
  useEffect(() => {
    loadData();
    
    const subscription = database.get('payments')
      .query(Q.where('guest_id', guestId))
      .observe()
      .subscribe(() => {
        loadData();
      });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const loadData = async () => {
    try {
      const guestRecord = await database.get('guests').find(guestId);
      const allPayments = await database.get('payments')
        .query(
          Q.where('guest_id', guestId),
          Q.sortBy('payment_date', Q.desc)
        )
        .fetch();
      
      setGuest(guestRecord);
      setPayments(allPayments);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getFilteredPayments = () => {
    if (filter === 'all') return payments;
    return payments.filter(p => p.status === filter);
  };
  
  const getTotalAmount = () => {
    return getFilteredPayments().reduce((sum, p) => sum + p.amount, 0);
  };
  
  const renderPayment = ({ item: payment }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => navigation.navigate('PaymentDetails', { paymentId: payment.id })}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentLeft}>
          <Text style={styles.paymentAmount}>₹{payment.amount.toLocaleString()}</Text>
          <Text style={styles.paymentDate}>
            {format(payment.paymentDate, 'dd MMM yyyy, hh:mm a')}
          </Text>
        </View>
        
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                payment.status === 'paid'
                  ? '#4caf50'
                  : payment.status === 'pending'
                  ? '#ff9800'
                  : '#f44336',
            },
          ]}
        >
          <Text style={styles.statusText}>{payment.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Method: {payment.paymentMethod.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="receipt" size={16} color="#666" />
          <Text style={styles.detailText}>Receipt: {payment.receiptNumber}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Period: {format(payment.periodStart, 'dd MMM')} -{' '}
            {format(payment.periodEnd, 'dd MMM yyyy')}
          </Text>
        </View>
        
        {payment.notes && (
          <View style={styles.notesRow}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.notesText}>{payment.notes}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }
  
  const filteredPayments = getFilteredPayments();
  
  return (
    <View style={styles.container}>
      {/* Summary Card */}
      {guest && (
        <View style={styles.summaryCard}>
          <Text style={styles.guestName}>{guest.fullName}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Payments</Text>
              <Text style={styles.summaryValue}>{filteredPayments.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>
                ₹{getTotalAmount().toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.filterText, filter === 'all' && styles.filterTextActive]}
          >
            All ({payments.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'paid' && styles.filterTabActive]}
          onPress={() => setFilter('paid')}
        >
          <Text
            style={[styles.filterText, filter === 'paid' && styles.filterTextActive]}
          >
            Paid ({payments.filter(p => p.status === 'paid').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'pending' && styles.filterTextActive,
            ]}
          >
            Pending ({payments.filter(p => p.status === 'pending').length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Payments List */}
      <FlatList
        data={filteredPayments}
        keyExtractor={item => item.id}
        renderItem={renderPayment}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No payment history found</Text>
          </View>
        }
      />
    </View>
  );
}
const enhance = withObservables(['route'], ({ route }) => ({
  guest: database.get('guests').findAndObserve(route.params.guestId),
  payments: database
    .get('guests')
    .findAndObserve(route.params.guestId)
    .pipe(
      switchMap(g =>
        g.payments.extend(Q.sortBy('payment_date', Q.desc)).observe()
      )
    ),
}));

export default enhance(PaymentHistoryScreen);
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#6200ee',
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  guestName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#6200ee',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  filterTextActive: {
    color: '#6200ee',
  },
  listContent: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLeft: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 6,
  },
  notesText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
});
