import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { database } from '../database';
import { format } from 'date-fns';

class ExportService {
  // Export all data to CSV
  async exportToCSV() {
    try {
      const guests = await database.get('guests').query().fetch();
      const payments = await database.get('payments').query().fetch();
      const guardians = await database.get('guardians').query().fetch();
      
      // Create CSV content
      const guestsCSV = this.guestsToCSV(guests);
      const paymentsCSV = this.paymentsToCSV(payments);
      const guardiansCSV = this.guardiansToCSV(guardians);
      
      // Combine into single file with sections
      const fullCSV = `
=== GUESTS DATA ===
${guestsCSV}

=== PAYMENTS DATA ===
${paymentsCSV}

=== GUARDIANS DATA ===
${guardiansCSV}
      `.trim();
      
      // Save to file
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const fileName = `PGManager_Export_${timestamp}.csv`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, fullCSV, 'utf8');
      
      // Share file
      await Share.open({
        url: `file://${filePath}`,
        type: 'text/csv',
        title: 'Export PG Manager Data',
        subject: 'PG Manager Data Export',
      });
      
      return { success: true, filePath };
    } catch (error) {
      console.error('Export CSV error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Export to JSON
  async exportToJSON() {
    try {
      const guests = await database.get('guests').query().fetch();
      const payments = await database.get('payments').query().fetch();
      const guardians = await database.get('guardians').query().fetch();
      
      const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'PG Manager',
        guests: guests.map(g => this.guestToObject(g)),
        payments: payments.map(p => this.paymentToObject(p)),
        guardians: guardians.map(g => this.guardianToObject(g)),
      };
      
      const jsonString = JSON.stringify(data, null, 2);
      
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const fileName = `PGManager_Export_${timestamp}.json`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, jsonString, 'utf8');
      
      await Share.open({
        url: `file://${filePath}`,
        type: 'application/json',
        title: 'Export PG Manager Data',
        subject: 'PG Manager Data Export',
      });
      
      return { success: true, filePath };
    } catch (error) {
      console.error('Export JSON error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Convert guests to CSV
  guestsToCSV(guests) {
    const headers = [
      'ID', 'First Name', 'Last Name', 'Age', 'Gender', 'Mobile', 'Email',
      'Aadhar', 'Room', 'Bed', 'Payment Type', 'Payment Amount', 'Due Date',
      'Join Date', 'Active',
    ];
    
    const rows = guests.map(g => [
      g.id,
      g.firstName,
      g.lastName,
      g.age,
      g.gender,
      g.mobileNumber,
      g.email || '',
      g.aadharNumber,
      g.roomNumber,
      g.bedNumber || '',
      g.paymentType,
      g.paymentAmount,
      format(g.paymentDueDate, 'yyyy-MM-dd'),
      format(g.joinDate, 'yyyy-MM-dd'),
      g.isActive ? 'Yes' : 'No',
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
  
  // Convert payments to CSV
  paymentsToCSV(payments) {
    const headers = [
      'ID', 'Guest ID', 'Amount', 'Payment Date', 'Payment Type', 'Method',
      'Receipt Number', 'Notes', 'Period Start', 'Period End', 'Status',
    ];
    
    const rows = payments.map(p => [
      p.id,
      p.guestId,
      p.amount,
      format(p.paymentDate, 'yyyy-MM-dd HH:mm:ss'),
      p.paymentType,
      p.paymentMethod,
      p.receiptNumber,
      p.notes || '',
      format(p.periodStart, 'yyyy-MM-dd'),
      format(p.periodEnd, 'yyyy-MM-dd'),
      p.status,
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
  
  // Convert guardians to CSV
  guardiansToCSV(guardians) {
    const headers = ['ID', 'Guest ID', 'Name', 'Relationship', 'Mobile', 'Address'];
    
    const rows = guardians.map(g => [
      g.id,
      g.guestId,
      g.name,
      g.relationship,
      g.mobileNumber,
      g.address || '',
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
  
  // Convert guest to object
  guestToObject(guest) {
    return {
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      age: guest.age,
      gender: guest.gender,
      mobileNumber: guest.mobileNumber,
      email: guest.email,
      aadharNumber: guest.aadharNumber,
      photoUri: guest.photoUri,
      roomNumber: guest.roomNumber,
      bedNumber: guest.bedNumber,
      paymentType: guest.paymentType,
      paymentAmount: guest.paymentAmount,
      paymentDueDate: guest.paymentDueDate.toISOString(),
      joinDate: guest.joinDate.toISOString(),
      isActive: guest.isActive,
      createdAt: guest.createdAt.toISOString(),
    };
  }
  
  // Convert payment to object
  paymentToObject(payment) {
    return {
      id: payment.id,
      guestId: payment.guestId,
      amount: payment.amount,
      paymentDate: payment.paymentDate.toISOString(),
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      receiptNumber: payment.receiptNumber,
      notes: payment.notes,
      periodStart: payment.periodStart.toISOString(),
      periodEnd: payment.periodEnd.toISOString(),
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
    };
  }
  
  // Convert guardian to object
  guardianToObject(guardian) {
    return {
      id: guardian.id,
      guestId: guardian.guestId,
      name: guardian.name,
      relationship: guardian.relationship,
      mobileNumber: guardian.mobileNumber,
      address: guardian.address,
      createdAt: guardian.createdAt.toISOString(),
    };
  }
}

export default new ExportService();
