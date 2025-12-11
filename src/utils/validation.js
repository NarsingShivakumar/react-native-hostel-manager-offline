// Validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateMobileNumber = (mobile) => {
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(mobile);
};

export const validateAadharNumber = (aadhar) => {
  const aadharRegex = /^[0-9]{12}$/;
  return aadharRegex.test(aadhar);
};

export const validateName = (name) => {
  return name && name.trim().length >= 2;
};

export const validateAge = (age) => {
  const ageNum = parseInt(age);
  return ageNum >= 1 && ageNum <= 150;
};

export const validateAmount = (amount) => {
  const amountNum = parseFloat(amount);
  return !isNaN(amountNum) && amountNum > 0;
};

export const validateRoomNumber = (roomNumber) => {
  return roomNumber && roomNumber.trim().length >= 1;
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

// Validate guest form
export const validateGuestForm = (formData) => {
  const errors = {};
  
  if (!validateName(formData.firstName)) {
    errors.firstName = 'First name must be at least 2 characters';
  }
  
  if (!validateName(formData.lastName)) {
    errors.lastName = 'Last name must be at least 2 characters';
  }
  
  if (!validateAge(formData.age)) {
    errors.age = 'Please enter a valid age';
  }
  
  if (!validateMobileNumber(formData.mobileNumber)) {
    errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
  }
  
  if (formData.email && !validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!validateAadharNumber(formData.aadharNumber)) {
    errors.aadharNumber = 'Please enter a valid 12-digit Aadhar number';
  }
  
  if (!validateRoomNumber(formData.roomNumber)) {
    errors.roomNumber = 'Please enter a room number';
  }
  
  if (!validateAmount(formData.paymentAmount)) {
    errors.paymentAmount = 'Please enter a valid payment amount';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate payment form
export const validatePaymentForm = (formData) => {
  const errors = {};
  
  if (!validateAmount(formData.amount)) {
    errors.amount = 'Please enter a valid amount';
  }
  
  if (!validateRequired(formData.paymentMethod)) {
    errors.paymentMethod = 'Please select a payment method';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
