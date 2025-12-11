import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function PaymentCard({ payment, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.amount}>₹{payment.amount.toLocaleString()}</Text>
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
      
      <View style={styles.detail}>
        <Ionicons name="calendar" size={16} color="#666" />
        <Text style={styles.detailText}>
          {format(payment.paymentDate, 'dd MMM yyyy, hh:mm a')}
        </Text>
      </View>
      
      <View style={styles.detail}>
        <Ionicons name="card-outline" size={16} color="#666" />
        <Text style={styles.detailText}>
          {payment.paymentMethod.replace('_', ' ').toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.detail}>
        <Ionicons name="receipt" size={16} color="#666" />
        <Text style={styles.detailText}>{payment.receiptNumber}</Text>
      </View>
      
      {payment.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {payment.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
}

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  notes: {
    marginTop: 8,
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});
