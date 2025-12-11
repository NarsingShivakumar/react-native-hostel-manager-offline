import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { database } from '../../database';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import DatePicker from 'react-native-date-picker';
import NotificationService from '../../services/NotificationService';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function AddGuestScreen({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'Male',
    mobileNumber: '',
    email: '',
    aadharNumber: '',
    photoUri: '',
    roomNumber: '',
    bedNumber: '',
    paymentType: 'monthly',
    paymentAmount: '',
    paymentStatus: 'pending', // New: paid or pending
    advancePaymentCount: '0', // New: how many periods paid in advance
    joinDate: new Date(),
    dueDate: addMonths(new Date(), 1), // New: editable due date
    guardianName: '',
    guardianRelationship: '',
    guardianMobile: '',
    guardianAddress: '',
  });

  const [loading, setLoading] = useState(false);
  const [showJoinDatePicker, setShowJoinDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate due date when payment type changes
      if (field === 'paymentType') {
        const advanceCount = parseInt(updated.advancePaymentCount) || 0;
        updated.dueDate = calculateDueDate(updated.joinDate, value, advanceCount);
      }

      // Recalculate due date when advance payment count changes
      if (field === 'advancePaymentCount') {
        const advanceCount = parseInt(value) || 0;
        updated.dueDate = calculateDueDate(updated.joinDate, updated.paymentType, advanceCount);
      }

      // Recalculate due date when join date changes
      if (field === 'joinDate') {
        const advanceCount = parseInt(updated.advancePaymentCount) || 0;
        updated.dueDate = calculateDueDate(value, updated.paymentType, advanceCount);
      }

      return updated;
    });
  };

  const selectPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.7,
      },
      response => {
        if (!response.didCancel && !response.error) {
          updateField('photoUri', response.assets[0].uri);
        }
      }
    );
  };

  const calculateDueDate = (fromDate, paymentType, advanceCount = 0) => {
    let dueDate = new Date(fromDate);
    const periodsAhead = 1 + advanceCount; // 1 for current period + advance periods

    switch (paymentType) {
      case 'daily':
        return addDays(dueDate, periodsAhead);
      case 'weekly':
        return addWeeks(dueDate, periodsAhead);
      case 'monthly':
      default:
        return addMonths(dueDate, periodsAhead);
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'Please enter first name');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Please enter last name');
      return false;
    }
    if (!formData.age || parseInt(formData.age) < 1) {
      Alert.alert('Error', 'Please enter valid age');
      return false;
    }
    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      Alert.alert('Error', 'Please enter valid 10-digit mobile number');
      return false;
    }
    if (!formData.aadharNumber || formData.aadharNumber.length !== 12) {
      Alert.alert('Error', 'Please enter valid 12-digit Aadhar number');
      return false;
    }
    if (!formData.roomNumber.trim()) {
      Alert.alert('Error', 'Please enter room number');
      return false;
    }
    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
      Alert.alert('Error', 'Please enter valid payment amount');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      await database.write(async () => {
        // Create guest
        const guest = await database.get('guests').create(newGuest => {
          newGuest.firstName = formData.firstName.trim();
          newGuest.lastName = formData.lastName.trim();
          newGuest.age = parseInt(formData.age);
          newGuest.gender = formData.gender;
          newGuest.mobileNumber = formData.mobileNumber;
          newGuest.email = formData.email.trim();
          newGuest.aadharNumber = formData.aadharNumber;
          newGuest.photoUri = formData.photoUri;
          newGuest.roomNumber = formData.roomNumber.trim();
          newGuest.bedNumber = formData.bedNumber.trim();
          newGuest.paymentType = formData.paymentType;
          newGuest.paymentAmount = parseFloat(formData.paymentAmount);
          newGuest.paymentDueDate = formData.dueDate;
          newGuest.joinDate = formData.joinDate;
          newGuest.isActive = true;
        });

        // Create initial payment if status is paid
        if (formData.paymentStatus === 'paid') {
          const advanceCount = parseInt(formData.advancePaymentCount) || 0;
          const totalPeriods = advanceCount + 1;
          const totalAmount = parseFloat(formData.paymentAmount) * totalPeriods;

          await database.get('payments').create(payment => {
            payment.guestId = guest.id;
            payment.amount = totalAmount;
            payment.paymentDate = formData.joinDate;
            payment.paymentType = formData.paymentType;
            payment.paymentMethod = 'cash';
            payment.receiptNumber = `REC-${Date.now()}`;
            payment.notes = advanceCount > 0
              ? `Initial payment for ${totalPeriods} ${formData.paymentType} period(s)`
              : 'Initial payment';
            payment.periodStart = formData.joinDate;
            payment.periodEnd = formData.dueDate;
            payment.status = 'paid';
          });
        }

        // Create guardian if provided
        if (formData.guardianName && formData.guardianMobile) {
          await database.get('guardians').create(guardian => {
            guardian.guestId = guest.id;
            guardian.name = formData.guardianName.trim();
            guardian.relationship = formData.guardianRelationship.trim();
            guardian.mobileNumber = formData.guardianMobile;
            guardian.address = formData.guardianAddress.trim();
          });
        }

        // Schedule payment reminders only if payment is pending
        if (formData.paymentStatus === 'pending') {
          await NotificationService.schedulePaymentReminder(guest, 3);
          await NotificationService.scheduleOverdueNotification(guest);
        }
      });

      Alert.alert('Success', 'Guest added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error adding guest:', error);
      Alert.alert('Error', 'Failed to add guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoButton} onPress={selectPhoto}>
            {formData.photoUri ? (
              <Image source={{ uri: formData.photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#999" />
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Personal Details */}
        <Text style={styles.sectionTitle}>Personal Details</Text>

        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.firstName}
          onChangeText={text => updateField('firstName', text)}
          placeholder="Enter first name"
        />

        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.lastName}
          onChangeText={text => updateField('lastName', text)}
          placeholder="Enter last name"
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={text => updateField('age', text)}
              placeholder="Enter age"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'Male' && styles.genderButtonActive,
                ]}
                onPress={() => updateField('gender', 'Male')}>
                <Text
                  style={[
                    styles.genderText,
                    formData.gender === 'Male' && styles.genderTextActive,
                  ]}>
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'Female' && styles.genderButtonActive,
                ]}
                onPress={() => updateField('gender', 'Female')}>
                <Text
                  style={[
                    styles.genderText,
                    formData.gender === 'Female' && styles.genderTextActive,
                  ]}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.label}>Mobile Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.mobileNumber}
          onChangeText={text => updateField('mobileNumber', text)}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={text => updateField('email', text)}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Aadhar Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.aadharNumber}
          onChangeText={text => updateField('aadharNumber', text)}
          placeholder="12-digit Aadhar number"
          keyboardType="number-pad"
          maxLength={12}
        />

        {/* Room Details */}
        <Text style={styles.sectionTitle}>Room Details</Text>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Room Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.roomNumber}
              onChangeText={text => updateField('roomNumber', text)}
              placeholder="Room no."
            />
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>Bed Number</Text>
            <TextInput
              style={styles.input}
              value={formData.bedNumber}
              onChangeText={text => updateField('bedNumber', text)}
              placeholder="Bed no."
            />
          </View>
        </View>

        {/* Payment Details */}
        <Text style={styles.sectionTitle}>Payment Details</Text>

        <Text style={styles.label}>Payment Type *</Text>
        <View style={styles.paymentTypeContainer}>
          {['daily', 'weekly', 'monthly'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.paymentTypeButton,
                formData.paymentType === type && styles.paymentTypeButtonActive,
              ]}
              onPress={() => updateField('paymentType', type)}>
              <Text
                style={[
                  styles.paymentTypeText,
                  formData.paymentType === type && styles.paymentTypeTextActive,
                ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Payment Amount *</Text>
        <TextInput
          style={styles.input}
          value={formData.paymentAmount}
          onChangeText={text => updateField('paymentAmount', text)}
          placeholder="Enter amount"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Payment Status *</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              formData.paymentStatus === 'paid' && styles.genderButtonActive,
            ]}
            onPress={() => updateField('paymentStatus', 'paid')}>
            <Text
              style={[
                styles.genderText,
                formData.paymentStatus === 'paid' && styles.genderTextActive,
              ]}>
              Paid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              formData.paymentStatus === 'pending' && styles.genderButtonActive,
            ]}
            onPress={() => updateField('paymentStatus', 'pending')}>
            <Text
              style={[
                styles.genderText,
                formData.paymentStatus === 'pending' && styles.genderTextActive,
              ]}>
              Pending
            </Text>
          </TouchableOpacity>
        </View>

        {formData.paymentStatus === 'paid' && (
          <>
            <Text style={styles.label}>
              Advance Payment ({formData.paymentType} periods)
            </Text>
            <TextInput
              style={styles.input}
              value={formData.advancePaymentCount}
              onChangeText={text => updateField('advancePaymentCount', text)}
              placeholder="0 = Current period only"
              keyboardType="number-pad"
            />
            <Text style={styles.helperText}>
              Enter how many {formData.paymentType} periods paid in advance (0 for current period only)
            </Text>

            {parseInt(formData.advancePaymentCount) > 0 && (
              <View style={styles.advanceInfo}>
                <Ionicons name="information-circle" size={20} color="#2196f3" />
                <Text style={styles.advanceInfoText}>
                  Total Amount: ₹{(parseFloat(formData.paymentAmount) * (parseInt(formData.advancePaymentCount) + 1)).toLocaleString()}
                  {'\n'}For {parseInt(formData.advancePaymentCount) + 1} {formData.paymentType} period(s)
                </Text>
              </View>
            )}
          </>
        )}

        <Text style={styles.label}>Join Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowJoinDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#6200ee" />
          <Text style={styles.dateButtonText}>
            {format(formData.joinDate, 'dd MMM yyyy')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Next Due Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDueDatePicker(true)}>
          <Ionicons name="calendar" size={20} color="#6200ee" />
          <Text style={styles.dateButtonText}>
            {format(formData.dueDate, 'dd MMM yyyy')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          Due date auto-calculates based on payment type and advance periods. You can edit it manually if needed.
        </Text>

        {/* Guardian Details */}
        <Text style={styles.sectionTitle}>Guardian Details (Optional)</Text>

        <Text style={styles.label}>Guardian Name</Text>
        <TextInput
          style={styles.input}
          value={formData.guardianName}
          onChangeText={text => updateField('guardianName', text)}
          placeholder="Enter guardian name"
        />

        <Text style={styles.label}>Relationship</Text>
        <TextInput
          style={styles.input}
          value={formData.guardianRelationship}
          onChangeText={text => updateField('guardianRelationship', text)}
          placeholder="e.g., Father"
        />

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          value={formData.guardianMobile}
          onChangeText={text => updateField('guardianMobile', text)}
          placeholder="10-digit number"
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={styles.label}>Guardian Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.guardianAddress}
          onChangeText={text => updateField('guardianAddress', text)}
          placeholder="Enter address"
          multiline
          numberOfLines={3}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding Guest...' : 'Add Guest'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      <DatePicker
        modal
        open={showJoinDatePicker}
        date={formData.joinDate}
        mode="date"
        onConfirm={date => {
          setShowJoinDatePicker(false);
          updateField('joinDate', date);
        }}
        onCancel={() => setShowJoinDatePicker(false)}
      />

      <DatePicker
        modal
        open={showDueDatePicker}
        date={formData.dueDate}
        mode="date"
        onConfirm={date => {
          setShowDueDatePicker(false);
          updateField('dueDate', date);
        }}
        onCancel={() => setShowDueDatePicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  photoText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
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
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderButtonActive: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  genderText: {
    fontSize: 16,
    color: '#666',
  },
  genderTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  paymentTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  paymentTypeButtonActive: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  paymentTypeText: {
    fontSize: 14,
    color: '#666',
  },
  paymentTypeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  dateButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  advanceInfo: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  advanceInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1976d2',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
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
