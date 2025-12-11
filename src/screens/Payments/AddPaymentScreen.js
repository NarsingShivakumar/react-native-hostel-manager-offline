import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { database } from '../../database';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import NotificationService from '../../services/NotificationService';
import Ionicons from '@react-native-vector-icons/ionicons';
import withObservables from '@nozbe/with-observables';

function AddPaymentScreen({ route, navigation }) {
  const { guestId, guest: passedGuest } = route.params || {};
  
  const [guest, setGuest] = useState(passedGuest || null);
  const [loading, setLoading] = useState(!passedGuest);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    receiptNumber: '',
    notes: '',
    status: 'paid',
  });
  
  useEffect(() => {
    if (guestId && !passedGuest) {
      loadGuest();
    }
  }, []);
  
  const loadGuest = async () => {
    try {
      const guestRecord = await database.get('guests').find(guestId);
      setGuest(guestRecord);
      setFormData(prev => ({
        ...prev,
        amount: guestRecord.paymentAmount.toString(),
      }));
    } catch (error) {
      console.error('Error loading guest:', error);
      Alert.alert('Error', 'Failed to load guest details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const generateReceiptNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RCP${timestamp}${random}`;
  };
  
  const calculateNextDueDate = () => {
    const now = new Date();
    switch (guest.paymentType) {
      case 'daily':
        return addDays(now, 1);
      case 'weekly':
        return addWeeks(now, 1);
      case 'monthly':
      default:
        return addMonths(now, 1);
    }
  };
  
  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter valid payment amount');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const receiptNumber = formData.receiptNumber || generateReceiptNumber();
      const paymentDate = new Date();
      const nextDueDate = calculateNextDueDate();
      
      await database.write(async () => {
        // Create payment record
        await database.get('payments').create(payment => {
          payment.guestId = guest.id;
          payment.amount = parseFloat(formData.amount);
          payment.paymentDate = paymentDate;
          payment.paymentType = guest.paymentType;
          payment.paymentMethod = formData.paymentMethod;
          payment.receiptNumber = receiptNumber;
          payment.notes = formData.notes.trim();
          payment.periodStart = paymentDate;
          payment.periodEnd = nextDueDate;
          payment.status = formData.status;
        });
        
        // Update guest's next due date
        await guest.update(g => {
          g.paymentDueDate = nextDueDate;
        });
      });
      
      // Cancel old notifications and schedule new ones
      await NotificationService.cancelGuestNotifications(guest.id);
      await NotificationService.schedulePaymentReminder(guest, 3);
      await NotificationService.scheduleOverdueNotification(guest);
      
      // Send immediate notification
      await NotificationService.sendNotification(
        guest,
        'Payment Received',
        `Payment of ₹${formData.amount} received from ${guest.fullName}`
      );
      
      Alert.alert('Success', 'Payment recorded successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }
  
  if (!guest) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Guest not found</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Guest Info Card */}
        <View style={styles.guestCard}>
          <Ionicons name="person-circle-outline" size={48} color="#6200ee" />
          <View style={styles.guestInfo}>
            <Text style={styles.guestName}>{guest.fullName}</Text>
            <Text style={styles.guestDetail}>Room: {guest.roomNumber}</Text>
            <Text style={styles.guestDetail}>
              Regular Amount: ₹{guest.paymentAmount.toLocaleString()}
            </Text>
          </View>
        </View>
        
        {/* Payment Details */}
        <Text style={styles.sectionTitle}>Payment Details</Text>
        
        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={formData.amount}
          onChangeText={text => updateField('amount', text)}
          placeholder="Enter amount"
          keyboardType="decimal-pad"
        />
        
        <Text style={styles.label}>Payment Method *</Text>
        <View style={styles.methodContainer}>
          {['cash', 'upi', 'card', 'bank_transfer'].map(method => (
            <TouchableOpacity
              key={method}
              style={[
                styles.methodButton,
                formData.paymentMethod === method && styles.methodButtonActive,
              ]}
              onPress={() => updateField('paymentMethod', method)}
            >
              <Ionicons
                name={
                  method === 'cash'
                    ? 'cash-outline'
                    : method === 'upi'
                    ? 'qr-code-outline'
                    : method === 'card'
                    ? 'card-outline'
                    : 'business-outline'
                }
                size={24}
                color={formData.paymentMethod === method ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.methodText,
                  formData.paymentMethod === method && styles.methodTextActive,
                ]}
              >
                {method.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.label}>Receipt Number</Text>
        <TextInput
          style={styles.input}
          value={formData.receiptNumber}
          onChangeText={text => updateField('receiptNumber', text)}
          placeholder="Auto-generated if left empty"
        />
        
        <Text style={styles.label}>Status *</Text>
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              formData.status === 'paid' && styles.statusButtonActive,
            ]}
            onPress={() => updateField('status', 'paid')}
          >
            <Text
              style={[
                styles.statusText,
                formData.status === 'paid' && styles.statusTextActive,
              ]}
            >
              Paid
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              formData.status === 'pending' && styles.statusButtonActive,
            ]}
            onPress={() => updateField('status', 'pending')}
          >
            <Text
              style={[
                styles.statusText,
                formData.status === 'pending' && styles.statusTextActive,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={text => updateField('notes', text)}
          placeholder="Add any notes about this payment"
          multiline
          numberOfLines={4}
        />
        
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information" size={20} color="#2196f3" />
          <Text style={styles.infoText}>
            Next due date will be automatically calculated as{' '}
            {format(calculateNextDueDate(), 'dd MMM yyyy')}
          </Text>
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.submitButtonText}>
            {saving ? 'Recording Payment...' : 'Record Payment'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const enhance = withObservables(['route'], ({ route }) => ({
  guest: database.get('guests').findAndObserve(route.params.guestId),
}));

export default enhance(AddPaymentScreen);
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
  form: {
    padding: 16,
  },
  guestCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  guestInfo: {
    marginLeft: 16,
    flex: 1,
  },
  guestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  guestDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  methodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    minWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  methodButtonActive: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  methodText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  methodTextActive: {
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  statusButtonActive: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  statusTextActive: {
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1976d2',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
