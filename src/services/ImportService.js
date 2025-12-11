import RNFS from 'react-native-fs';
import { database } from '../database';

class ImportService {
  // Import from JSON file
  async importFromJSON(filePath) {
    try {
      // Read file content
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      
      // Validate data structure
      if (!data.version || !data.guests || !data.payments || !data.guardians) {
        throw new Error('Invalid file format. Please select a valid backup file.');
      }
      
      // Clear existing data
      await this.clearAllData();
      
      // Import data in transaction
      await database.write(async () => {
        // Import guests
        for (const guestData of data.guests) {
          await database.get('guests').create(guest => {
            guest._raw.id = guestData.id;
            guest.firstName = guestData.firstName;
            guest.lastName = guestData.lastName;
            guest.age = guestData.age;
            guest.gender = guestData.gender;
            guest.mobileNumber = guestData.mobileNumber;
            guest.email = guestData.email;
            guest.aadharNumber = guestData.aadharNumber;
            guest.photoUri = guestData.photoUri;
            guest.roomNumber = guestData.roomNumber;
            guest.bedNumber = guestData.bedNumber;
            guest.paymentType = guestData.paymentType;
            guest.paymentAmount = guestData.paymentAmount;
            guest.paymentDueDate = new Date(guestData.paymentDueDate);
            guest.joinDate = new Date(guestData.joinDate);
            guest.isActive = guestData.isActive;
          });
        }
        
        // Import payments
        for (const paymentData of data.payments) {
          await database.get('payments').create(payment => {
            payment._raw.id = paymentData.id;
            payment.guestId = paymentData.guestId;
            payment.amount = paymentData.amount;
            payment.paymentDate = new Date(paymentData.paymentDate);
            payment.paymentType = paymentData.paymentType;
            payment.paymentMethod = paymentData.paymentMethod;
            payment.receiptNumber = paymentData.receiptNumber;
            payment.notes = paymentData.notes;
            payment.periodStart = new Date(paymentData.periodStart);
            payment.periodEnd = new Date(paymentData.periodEnd);
            payment.status = paymentData.status;
          });
        }
        
        // Import guardians
        for (const guardianData of data.guardians) {
          await database.get('guardians').create(guardian => {
            guardian._raw.id = guardianData.id;
            guardian.guestId = guardianData.guestId;
            guardian.name = guardianData.name;
            guardian.relationship = guardianData.relationship;
            guardian.mobileNumber = guardianData.mobileNumber;
            guardian.address = guardianData.address;
          });
        }
      });
      
      console.log('Import completed successfully');
      return { 
        success: true, 
        message: `Successfully imported ${data.guests.length} guests, ${data.payments.length} payments, and ${data.guardians.length} guardians.` 
      };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Clear all data from database
  async clearAllData() {
    try {
      await database.write(async () => {
        // Delete all guests (cascade will delete related records)
        const guests = await database.get('guests').query().fetch();
        for (const guest of guests) {
          await guest.markAsDeleted();
        }
        
        // Delete all payments
        const payments = await database.get('payments').query().fetch();
        for (const payment of payments) {
          await payment.markAsDeleted();
        }
        
        // Delete all guardians
        const guardians = await database.get('guardians').query().fetch();
        for (const guardian of guardians) {
          await guardian.markAsDeleted();
        }
        
        // Delete all notification logs
        const logs = await database.get('notification_logs').query().fetch();
        for (const log of logs) {
          await log.markAsDeleted();
        }
      });
      
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export default new ImportService();
