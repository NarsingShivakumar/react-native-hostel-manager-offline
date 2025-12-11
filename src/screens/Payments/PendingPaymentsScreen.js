import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import { format } from 'date-fns';
import PaymentCard from '../../components/PaymentCard';
import Ionicons from '@react-native-vector-icons/ionicons';
import withObservables from '@nozbe/with-observables';

function PendingPaymentsScreen({ navigation }) {
  const [overdueGuests, setOverdueGuests] = useState([]);
  const [upcomingGuests, setUpcomingGuests] = useState([]);
  const [filter, setFilter] = useState('overdue'); // overdue, upcoming
  
  useEffect(() => {
    loadPayments();
    
    const subscription = database.get('guests')
      .query(Q.where('is_active', true))
      .observe()
      .subscribe(() => {
        loadPayments();
      });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const loadPayments = async () => {
    try {
      const activeGuests = await database.get('guests')
        .query(Q.where('is_active', true))
        .fetch();
      
      const now = Date.now();
      const threeDaysLater = now + 3 * 24 * 60 * 60 * 1000;
      
      const overdue = activeGuests.filter(g => g.paymentDueDate < now);
      const upcoming = activeGuests.filter(
        g => g.paymentDueDate >= now && g.paymentDueDate <= threeDaysLater
      );
      
      setOverdueGuests(overdue);
      setUpcomingGuests(upcoming);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };
  
  const handleGuestPress = (guest) => {
    navigation.navigate('GuestDetails', {
      guestId: guest.id,
      guestName: guest.fullName,
    });
  };
  
  const handleAddPayment = (guest) => {
    navigation.navigate('AddPayment', { guestId: guest.id, guest });
  };
  
  const renderGuest = ({ item: guest }) => (
    <TouchableOpacity
      style={styles.guestCard}
      onPress={() => handleGuestPress(guest)}
    >
      <View style={styles.guestHeader}>
        <View style={styles.guestInfo}>
          <Text style={styles.guestName}>{guest.fullName}</Text>
          <Text style={styles.guestRoom}>Room: {guest.roomNumber}</Text>
          <Text style={styles.guestMobile}>{guest.mobileNumber}</Text>
        </View>
        
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentAmount}>
            ₹{guest.paymentAmount.toLocaleString()}
          </Text>
          <Text
            style={[
              styles.dueDate,
              guest.isPaymentOverdue && styles.overdueDateText,
            ]}
          >
            {guest.isPaymentOverdue
              ? `${guest.daysOverdue} days overdue`
              : `Due: ${format(guest.paymentDueDate, 'dd MMM')}`}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAddPayment(guest)}
        >
          <Ionicons name="cash-outline" size={20} color="#4caf50" />
          <Text style={styles.actionBtnText}>Add Payment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleGuestPress(guest)}
        >
          <Ionicons name="eye" size={20} color="#2196f3" />
          <Text style={styles.actionBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  
  const displayGuests = filter === 'overdue' ? overdueGuests : upcomingGuests;
  
  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'overdue' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('overdue')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'overdue' && styles.filterTextActive,
            ]}
          >
            Overdue ({overdueGuests.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'upcoming' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('upcoming')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'upcoming' && styles.filterTextActive,
            ]}
          >
            Upcoming ({upcomingGuests.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Guest List */}
      <FlatList
        data={displayGuests}
        keyExtractor={item => item.id}
        renderItem={renderGuest}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={filter === 'overdue' ? 'checkmark-circle-outline' : 'calendar-outline'}
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyText}>
              {filter === 'overdue'
                ? 'No overdue payments!'
                : 'No upcoming payments'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
const enhance = withObservables([], () => ({
  activeGuests: database
    .get('guests')
    .query(Q.where('is_active', true))
    .observe(),
}));

export default enhance(PendingPaymentsScreen);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#6200ee',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  filterTextActive: {
    color: '#6200ee',
  },
  listContent: {
    padding: 16,
  },
  guestCard: {
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
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  guestRoom: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  guestMobile: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  paymentInfo: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  dueDate: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 4,
  },
  overdueDateText: {
    color: '#f44336',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  actionBtnText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
