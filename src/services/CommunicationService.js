import { Linking, Alert, Platform } from 'react-native';

class CommunicationService {
  // Make phone call
  makeCall(phoneNumber) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const url = `tel:${formattedNumber}`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to make phone call');
        }
      })
      .catch(error => {
        console.error('Error making call:', error);
        Alert.alert('Error', 'Failed to initiate call');
      });
  }
  
  // Send SMS
  sendSMS(phoneNumber, message) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${formattedNumber}${separator}body=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to send SMS');
        }
      })
      .catch(error => {
        console.error('Error sending SMS:', error);
        Alert.alert('Error', 'Failed to send SMS');
      });
  }
  
  // Send WhatsApp message
  sendWhatsApp(phoneNumber, message) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber).replace('+', '');
    const url = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert(
            'WhatsApp Not Installed',
            'Please install WhatsApp to send messages',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Install',
                onPress: () => {
                  const storeUrl = Platform.OS === 'ios'
                    ? 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
                    : 'https://play.google.com/store/apps/details?id=com.whatsapp';
                  Linking.openURL(storeUrl);
                },
              },
            ]
          );
        }
      })
      .catch(error => {
        console.error('Error opening WhatsApp:', error);
        Alert.alert('Error', 'Failed to open WhatsApp');
      });
  }
  
  // Send Email
  sendEmail(email, subject, body) {
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open email client');
        }
      })
      .catch(error => {
        console.error('Error opening email:', error);
        Alert.alert('Error', 'Failed to open email client');
      });
  }
  
  // Format phone number (add country code if needed)
  formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    
    return `+${cleaned}`;
  }
}

export default new CommunicationService();
