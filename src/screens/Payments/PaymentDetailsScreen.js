import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { database } from '../../database';
import { format } from 'date-fns';
import Share from 'react-native-share';
import Ionicons from '@react-native-vector-icons/ionicons';
import withObservables from '@nozbe/with-observables';

function PaymentDetailsScreen({ route, navigation }) {
  const { paymentId } = route.params;
  const [payment, setPayment] = useState(null);
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadPayment();
  }, []);
  
  const loadPayment = async () => {
    try {
      const paymentRecord = await database.get('payments').find(paymentId);
      const guestRecord = await paymentRecord.guest.fetch();
      
      setPayment(paymentRecord);
      setGuest(guestRecord);
    } catch (error) {
      console.error('Error loading payment:', error);
      Alert.alert('Error', 'Failed to load payment details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const handleShareReceipt = async () => {
    if (!payment || !guest) return;
    
    const receiptText = `
Payment Receipt
================

Guest: ${guest.fullName}
Room: ${guest.roomNumber}

Amount: ₹${payment.amount.toLocaleString()}
Payment Method: ${payment.paymentMethod.replace('_', ' ').toUpperCase()}
Receipt No: ${payment.receiptNumber}
Date: ${format(payment.paymentDate, 'dd MMM yyyy, hh:mm a')}

Period: ${format(payment.periodStart, 'dd MMM yyyy')} - ${format(payment.periodEnd, 'dd MMM yyyy')}

Status: ${payment.status.toUpperCase()}

${payment.notes ? `Notes: ${payment.notes}` : ''}

Thank you!
    `.trim();
    
    try {
      await Share.open({
        title: 'Payment Receipt',
        message: receiptText,
      });
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing receipt:', error);
      }
    }
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await payment.markAsDeleted();
              });
              Alert.alert('Success', 'Payment deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting payment:', error);
              Alert.alert('Error', 'Failed to delete payment');
            }
          },
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }
  
  if (!payment || !guest) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Payment not found</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Status Card */}
      <View
        style={[
          styles.statusCard,
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
        <Ionicons
          name={
            payment.status === 'paid'
              ? 'checkmark-circle'
              : payment.status === 'pending'
              ? 'time-outline'
              : 'alert-circle'
          }
          size={48}
          color="#fff"
        />
        <Text style={styles.statusTitle}>{payment.status.toUpperCase()}</Text>
        <Text style={styles.amountText}>₹{payment.amount.toLocaleString()}</Text>
      </View>
      
      {/* Guest Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guest Details</Text>
        <DetailRow icon="person-outline" label="Name" value={guest.fullName} />
        <DetailRow icon="home" label="Room" value={guest.roomNumber} />
        <DetailRow icon="call" label="Mobile" value={guest.mobileNumber} />
      </View>
      
      {/* Payment Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <DetailRow icon="receipt" label="Receipt Number" value={payment.receiptNumber} />
        <DetailRow
          icon="calendar"
          label="Payment Date"
          value={format(payment.paymentDate, 'dd MMM yyyy, hh:mm a')}
        />
        <DetailRow
          icon="card-outline"
          label="Payment Method"
          value={payment.paymentMethod.replace('_', ' ').toUpperCase()}
        />
        <DetailRow
          icon="calendar-outline"
          label="Period"
          value={`${format(payment.periodStart, 'dd MMM yyyy')} - ${format(
            payment.periodEnd,
            'dd MMM yyyy'
          )}`}
        />
        <DetailRow
          icon="repeat-outline"
          label="Payment Type"
          value={payment.paymentType.toUpperCase()}
        />
      </View>
      
      {/* Notes */}
      {payment.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesBox}>
            <Ionicons name="document-text-outline" size={20} color="#666" />
            <Text style={styles.notesText}>{payment.notes}</Text>
          </View>
        </View>
      )}
      
      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShareReceipt}>
          <Ionicons name="share-outline" size={24} color="#2196f3" />
          <Text style={styles.actionButtonText}>Share Receipt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={24} color="#f44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            Delete Payment
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={20} color="#666" />
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);
const enhance = withObservables(['route'], ({ route }) => ({
  payment: database.get('payments').findAndObserve(route.params.paymentId),
  guest: database
    .get('payments')
    .findAndObserve(route.params.paymentId)
    .pipe(switchMap(p => p.guest.observe())),
}));

export default enhance(PaymentDetailsScreen);



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
  statusCard: {
    alignItems: 'center',
    padding: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  amountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  notesBox: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
    marginBottom: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
  },
});
