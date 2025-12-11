import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import { format } from 'date-fns';
import Ionicons from '@react-native-vector-icons/ionicons';
import withObservables from '@nozbe/with-observables';
// import { withObservables } from '@nozbe/watermelondb/react'

// import {withObservables} from '@nozbe/watermelondb/react'

 function GuestCard({ guest, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        {guest.photoUri ? (
          <Image source={{ uri: guest.photoUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
        )}
        
        <View style={styles.info}>
          <Text style={styles.name}>{guest.fullName}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="home" size={14} color="#666" />
            <Text style={styles.detailText}>Room: {guest.roomNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call" size={14} color="#666" />
            <Text style={styles.detailText}>{guest.mobileNumber}</Text>
          </View>
        </View>
        
        <View style={styles.right}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: guest.isActive ? '#4caf50' : '#999' },
            ]}
          >
            <Text style={styles.statusText}>
              {guest.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          
          <Text style={styles.amount}>₹{guest.paymentAmount.toLocaleString()}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.footerText}>
            Due: {format(guest.paymentDueDate, 'dd MMM yyyy')}
          </Text>
        </View>
        
        {guest.isPaymentOverdue && (
          <View style={styles.overdueTag}>
            <Ionicons name="alert" size={14} color="#f44336" />
            <Text style={styles.overdueText}>{guest.daysOverdue} days overdue</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
const enhance = withObservables(['guest'], ({guest}) => ({
  guest: guest.observe(),
}));
export default enhance(GuestCard);


const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#666',
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#666',
  },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  overdueText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
  },
});
