import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import withObservables from '@nozbe/with-observables';
import { of as of$ } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { format } from 'date-fns';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../database';
import CommunicationService from '../../services/CommunicationService';
import Ionicons from '@react-native-vector-icons/ionicons';

function GuestDetailsScreen({ route, navigation, guest, payments, guardians }) {
  if (!guest) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Guest not found</Text>
      </View>
    );
  }

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleCall = () => {
    CommunicationService.makeCall(guest.mobileNumber);
  };

  const handleSMS = () => {
    const message = `Hi ${guest.firstName}, this is a reminder about your pending payment of ₹${pendingAmount}. Please make the payment at your earliest convenience.`;
    CommunicationService.sendSMS(guest.mobileNumber, message);
  };

  const handleWhatsApp = () => {
    const message = `Hi ${guest.firstName}, this is a reminder about your pending payment of ₹${pendingAmount}. Please make the payment at your earliest convenience.`;
    CommunicationService.sendWhatsApp(guest.mobileNumber, message);
  };

  const handleAddPayment = () => {
    navigation.navigate('AddPayment', { guestId: guest.id, guest });
  };

  const handleEdit = () => {
    navigation.navigate('EditGuest', { guestId: guest.id });
  };

  const handleToggleActive = async () => {
    Alert.alert(
      guest.isActive ? 'Deactivate Guest' : 'Activate Guest',
      `Are you sure you want to ${guest.isActive ? 'deactivate' : 'activate'} ${guest.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: guest.isActive ? 'Deactivate' : 'Activate',
          style: guest.isActive ? 'destructive' : 'default',
          onPress: async () => {
            await database.write(async () => {
              await guest.update(g => {
                g.isActive = !g.isActive;
              });
            });
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Guest',
      `Are you sure you want to delete ${guest.fullName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await database.write(async () => {
              // Delete related records
              const guestPayments = await guest.payments.fetch();
              const guestGuardians = await guest.guardians.fetch();

              for (const payment of guestPayments) {
                await payment.markAsDeleted();
              }

              for (const guardian of guestGuardians) {
                await guardian.markAsDeleted();
              }

              await guest.markAsDeleted();
            });
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        {guest.photoUri ? (
          <Image source={{ uri: guest.photoUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
        )}

        <Text style={styles.name}>{guest.fullName}</Text>
        <Text style={styles.roomInfo}>
          Room: {guest.roomNumber}
          {guest.bedNumber && ` | Bed: ${guest.bedNumber}`}
        </Text>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: guest.isActive ? '#4caf50' : '#999' },
          ]}>
          <Text style={styles.statusText}>
            {guest.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="pencil" size={18} color="#6200ee" />
            <Text style={styles.headerButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleToggleActive}>
            <Ionicons
              name={guest.isActive ? 'pause-circle' : 'play-circle'}
              size={18}
              color="#6200ee"
            />
            <Text style={styles.headerButtonText}>
              {guest.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Status Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#4caf50' }]}>
          <Ionicons name="checkmark-circle" size={32} color="#fff" />
          <Text style={styles.statValue}>₹{totalPaid.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Paid</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#ff9800' }]}>
          <Ionicons name="time" size={32} color="#fff" />
          <Text style={styles.statValue}>₹{pendingAmount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Communication Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#4caf50" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSMS}>
            <Ionicons name="chatbubble" size={24} color="#2196f3" />
            <Text style={styles.actionText}>SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={24} color="#25d366" />
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleAddPayment}>
            <Ionicons name="cash" size={24} color="#ff9800" />
            <Text style={styles.actionText}>Payment</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Personal Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <DetailRow icon="person" label="Age" value={`${guest.age} years`} />
        <DetailRow icon="male-female" label="Gender" value={guest.gender} />
        <DetailRow icon="call" label="Mobile" value={guest.mobileNumber} />
        {guest.email && (
          <DetailRow icon="mail" label="Email" value={guest.email} />
        )}
        <DetailRow icon="card" label="Aadhar" value={guest.aadharNumber} />
        <DetailRow
          icon="calendar"
          label="Joined"
          value={format(guest.joinDate, 'dd MMM yyyy')}
        />
      </View>

      {/* Payment Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <DetailRow
          icon="cash"
          label="Amount"
          value={`₹${guest.paymentAmount.toLocaleString()} / ${guest.paymentType}`}
        />
        <DetailRow
          icon="calendar-outline"
          label="Due Date"
          value={format(guest.paymentDueDate, 'dd MMM yyyy')}
        />

        {guest.isPaymentOverdue && (
          <View style={styles.overdueAlert}>
            <Ionicons name="alert-circle" size={20} color="#f44336" />
            <Text style={styles.overdueText}>
              Payment overdue by {guest.daysOverdue} days
            </Text>
          </View>
        )}
      </View>

      {/* Guardian Details */}
      {guardians.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guardian Details</Text>
          {guardians.map((guardian, index) => (
            <View key={index} style={styles.guardianCard}>
              <DetailRow icon="person-circle" label="Name" value={guardian.name} />
              <DetailRow
                icon="people"
                label="Relationship"
                value={guardian.relationship}
              />
              <DetailRow
                icon="call"
                label="Mobile"
                value={guardian.mobileNumber}
              />
              {guardian.address && (
                <DetailRow icon="location" label="Address" value={guardian.address} />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Payment History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('PaymentHistory', { guestId: guest.id })
            }>
            <Ionicons name="arrow-forward" size={20} color="#6200ee" />
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {payments.slice(0, 5).map(payment => (
          <TouchableOpacity
            key={payment.id}
            style={styles.paymentCard}
            onPress={() =>
              navigation.navigate('PaymentDetails', { paymentId: payment.id })
            }>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentAmount}>
                ₹{payment.amount.toLocaleString()}
              </Text>
              <View
                style={[
                  styles.paymentStatusBadge,
                  {
                    backgroundColor:
                      payment.status === 'paid' ? '#4caf50' : '#ff9800',
                  },
                ]}>
                <Text style={styles.paymentStatusText}>
                  {payment.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.paymentDate}>
              {format(payment.paymentDate, 'dd MMM yyyy, hh:mm a')}
            </Text>
            <Text style={styles.paymentMethod}>
              Method: {payment.paymentMethod.toUpperCase()}
            </Text>
            {payment.notes && (
              <Text style={styles.paymentNotes}>Note: {payment.notes}</Text>
            )}
          </TouchableOpacity>
        ))}

        {payments.length === 0 && (
          <Text style={styles.emptyText}>No payment history available</Text>
        )}
      </View>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash" size={20} color="#f44336" />
        <Text style={styles.deleteButtonText}>Delete Guest</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={20} color="#6200ee" />
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

// ✅ Fixed withObservables HOC
const enhance = withObservables(['route'], ({ route }) => {
  const guestObservable = database
    .get('guests')
    .findAndObserve(route.params.guestId)
    .pipe(
      switchMap(guest => {
        if (!guest) return of$({ guest: null, payments: [], guardians: [] });
        return of$({ guest });
      })
    );

  return {
    guest: database.get('guests').findAndObserve(route.params.guestId),
    payments: database
      .get('guests')
      .findAndObserve(route.params.guestId)
      .pipe(
        switchMap(g =>
          g.payments
            .extend(Q.sortBy('payment_date', Q.desc))
            .observe()
        )
      ),
    guardians: database
      .get('guests')
      .findAndObserve(route.params.guestId)
      .pipe(switchMap(g => g.guardians.observe())),
  };
});

export default enhance(GuestDetailsScreen);

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
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  roomInfo: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6200ee',
  },
  headerButtonText: {
    color: '#6200ee',
    marginLeft: 4,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#6200ee',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
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
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  overdueText: {
    color: '#f44336',
    marginLeft: 8,
    fontWeight: '600',
  },
  guardianCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  paymentNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
