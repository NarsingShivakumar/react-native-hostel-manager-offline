import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { database } from '../../database';
import { addDays, addWeeks, addMonths, differenceInDays, format } from 'date-fns';
import DatePicker from 'react-native-date-picker';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function EditGuestScreen({ route, navigation }) {
  const { guestId } = route.params;
  const [guest, setGuest] = useState(null);
  const [guardian, setGuardian] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showJoinDatePicker, setShowJoinDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  
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
    joinDate: new Date(),
    dueDate: new Date(),
    isActive: true,
    guardianName: '',
    guardianRelationship: '',
    guardianMobile: '',
    guardianAddress: '',
  });
  
  const [originalPaymentType, setOriginalPaymentType] = useState('monthly');
  const [originalDueDate, setOriginalDueDate] = useState(new Date());

  useEffect(() => {
    loadGuest();
  }, []);

  const loadGuest = async () => {
    try {
      const guestRecord = await database.get('guests').find(guestId);
      const guardians = await guestRecord.guardians.fetch();

      setGuest(guestRecord);
      if (guardians.length > 0) {
        setGuardian(guardians[0]);
      }

      const loadedData = {
        firstName: guestRecord.firstName,
        lastName: guestRecord.lastName,
        age: guestRecord.age.toString(),
        gender: guestRecord.gender,
        mobileNumber: guestRecord.mobileNumber,
        email: guestRecord.email || '',
        aadharNumber: guestRecord.aadharNumber,
        photoUri: guestRecord.photoUri || '',
        roomNumber: guestRecord.roomNumber,
        bedNumber: guestRecord.bedNumber || '',
        paymentType: guestRecord.paymentType,
        paymentAmount: guestRecord.paymentAmount.toString(),
        joinDate: guestRecord.joinDate,
        dueDate: guestRecord.paymentDueDate,
        isActive: guestRecord.isActive,
        guardianName: guardians[0]?.name || '',
        guardianRelationship: guardians[0]?.relationship || '',
        guardianMobile: guardians[0]?.mobileNumber || '',
        guardianAddress: guardians[0]?.address || '',
      };

      setFormData(loadedData);
      setOriginalPaymentType(guestRecord.paymentType);
      setOriginalDueDate(guestRecord.paymentDueDate);
    } catch (error) {
      console.error('Error loading guest:', error);
      Alert.alert('Error', 'Failed to load guest details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-recalculate due date when payment type changes
      if (field === 'paymentType' && value !== originalPaymentType) {
        const currentDueDate = prev.dueDate;
        const today = new Date();
        const daysUntilDue = differenceInDays(currentDueDate, today);

        // Convert to new payment type
        updated.dueDate = convertDueDateToNewType(today, value, daysUntilDue, prev.paymentType);

        // Show alert about the change
        setTimeout(() => {
          Alert.alert(
            'Due Date Updated',
            `Payment type changed from ${prev.paymentType} to ${value}.\n\nDue date automatically adjusted to ${format(updated.dueDate, 'dd MMM yyyy')}.`,
            [{ text: 'OK' }]
          );
        }, 100);
      }

      return updated;
    });
  };

  // Convert due date when payment type changes
  const convertDueDateToNewType = (fromDate, newPaymentType, daysRemaining, oldPaymentType) => {
    let dueDate = new Date(fromDate);

    // If already overdue or due today, set next period
    if (daysRemaining <= 0) {
      switch (newPaymentType) {
        case 'daily':
          return addDays(dueDate, 1);
        case 'weekly':
          return addWeeks(dueDate, 1);
        case 'monthly':
          return addMonths(dueDate, 1);
      }
    }

    // Convert based on approximate period equivalence
    switch (newPaymentType) {
      case 'daily':
        // Keep the same number of days
        return addDays(dueDate, Math.max(1, daysRemaining));
      
      case 'weekly':
        // Convert days to weeks (round up)
        const weeks = Math.ceil(daysRemaining / 7);
        return addWeeks(dueDate, Math.max(1, weeks));
      
      case 'monthly':
        // Convert days to months (round up)
        const months = Math.ceil(daysRemaining / 30);
        return addMonths(dueDate, Math.max(1, months));
      
      default:
        return addMonths(dueDate, 1);
    }
  };

  // Calculate next due date from a specific date
  const calculateNextDueDate = (fromDate, paymentType) => {
    let dueDate = new Date(fromDate);

    switch (paymentType) {
      case 'daily':
        return addDays(dueDate, 1);
      case 'weekly':
        return addWeeks(dueDate, 1);
      case 'monthly':
      default:
        return addMonths(dueDate, 1);
    }
  };

  const handleRecalculateDueDate = () => {
    Alert.alert(
      'Recalculate Due Date',
      `Set next due date based on ${formData.paymentType} payment cycle from today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recalculate',
          onPress: () => {
            const newDueDate = calculateNextDueDate(new Date(), formData.paymentType);
            setFormData(prev => ({ ...prev, dueDate: newDueDate }));
            Alert.alert(
              'Due Date Updated',
              `Next due date set to ${format(newDueDate, 'dd MMM yyyy')}`
            );
          },
        },
      ]
    );
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

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'Please enter first and last name');
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

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    try {
      await database.write(async () => {
        // Update guest
        await guest.update(g => {
          g.firstName = formData.firstName.trim();
          g.lastName = formData.lastName.trim();
          g.age = parseInt(formData.age);
          g.gender = formData.gender;
          g.mobileNumber = formData.mobileNumber;
          g.email = formData.email.trim();
          g.aadharNumber = formData.aadharNumber;
          g.photoUri = formData.photoUri;
          g.roomNumber = formData.roomNumber.trim();
          g.bedNumber = formData.bedNumber.trim();
          g.paymentType = formData.paymentType;
          g.paymentAmount = parseFloat(formData.paymentAmount);
          g.paymentDueDate = formData.dueDate;
          g.joinDate = formData.joinDate;
          g.isActive = formData.isActive;
        });

        // Update or create guardian
        if (formData.guardianName && formData.guardianMobile) {
          if (guardian) {
            await guardian.update(g => {
              g.name = formData.guardianName.trim();
              g.relationship = formData.guardianRelationship.trim();
              g.mobileNumber = formData.guardianMobile;
              g.address = formData.guardianAddress.trim();
            });
          } else {
            await database.get('guardians').create(g => {
              g.guestId = guest.id;
              g.name = formData.guardianName.trim();
              g.relationship = formData.guardianRelationship.trim();
              g.mobileNumber = formData.guardianMobile;
              g.address = formData.guardianAddress.trim();
            });
          }
        }
      });

      Alert.alert('Success', 'Guest updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating guest:', error);
      Alert.alert('Error', 'Failed to update guest');
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
                <Text style={styles.photoText}>Change Photo</Text>
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

        {formData.paymentType !== originalPaymentType && (
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={20} color="#ff9800" />
            <Text style={styles.warningText}>
              Payment type changed from {originalPaymentType} to {formData.paymentType}.{'\n'}
              Due date has been automatically adjusted.
            </Text>
          </View>
        )}

        <Text style={styles.label}>Payment Amount *</Text>
        <TextInput
          style={styles.input}
          value={formData.paymentAmount}
          onChangeText={text => updateField('paymentAmount', text)}
          placeholder="Enter amount"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Join Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowJoinDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#6200ee" />
          <Text style={styles.dateButtonText}>
            {format(formData.joinDate, 'dd MMM yyyy')}
          </Text>
        </TouchableOpacity>

        <View style={styles.dueDateContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Next Due Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDueDatePicker(true)}>
              <Ionicons name="calendar" size={20} color="#6200ee" />
              <Text style={styles.dateButtonText}>
                {format(formData.dueDate, 'dd MMM yyyy')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.recalculateButton}
            onPress={handleRecalculateDueDate}>
            <Ionicons name="refresh" size={24} color="#6200ee" />
          </TouchableOpacity>
        </View>

        <Text style={styles.helperText}>
          • Tap date to edit manually{'\n'}
          • Tap refresh icon to auto-calculate from today{'\n'}
          • Due date auto-updates when payment type changes
        </Text>

        <Text style={styles.label}>Status</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              formData.isActive && styles.genderButtonActive,
            ]}
            onPress={() => updateField('isActive', true)}>
            <Text
              style={[
                styles.genderText,
                formData.isActive && styles.genderTextActive,
              ]}>
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              !formData.isActive && styles.genderButtonActive,
            ]}
            onPress={() => updateField('isActive', false)}>
            <Text
              style={[
                styles.genderText,
                !formData.isActive && styles.genderTextActive,
              ]}>
              Inactive
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guardian Details */}
        <Text style={styles.sectionTitle}>Guardian Details</Text>

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

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          <Text style={styles.submitButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  recalculateButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3e5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#e65100',
    lineHeight: 18,
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
