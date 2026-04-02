/**
 * Form Validation Utilities
 * Provides reusable validation functions with error messages
 */

export const validationRules = {
  required: {
    validate: (value) => value !== null && value !== undefined && value !== '',
    message: 'This field is required',
  },
  email: {
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message: 'Please enter a valid email address',
  },
  minLength: (min) => ({
    validate: (value) => value?.length >= min,
    message: `Must be at least ${min} characters`,
  }),
  maxLength: (max) => ({
    validate: (value) => value?.length <= max,
    message: `Must not exceed ${max} characters`,
  }),
  phone: {
    validate: (value) => {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
    },
    message: 'Please enter a valid phone number',
  },
  numeric: {
    validate: (value) => !isNaN(value) && value !== '',
    message: 'Must be a number',
  },
  positiveNumber: {
    validate: (value) => !isNaN(value) && parseFloat(value) > 0,
    message: 'Must be a positive number',
  },
  alphabetic: {
    validate: (value) => /^[a-zA-Z\s]+$/.test(value),
    message: 'Only alphabetic characters are allowed',
  },
  alphanumeric: {
    validate: (value) => /^[a-zA-Z0-9\s]+$/.test(value),
    message: 'Only alphanumeric characters are allowed',
  },
  url: {
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Please enter a valid URL',
  },
  date: {
    validate: (value) => !isNaN(Date.parse(value)),
    message: 'Please enter a valid date',
  },
  passwordStrength: {
    validate: (value) => {
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasNonAlphaNumeric = /[^a-zA-Z0-9]/.test(value);
      return hasUpperCase && hasLowerCase && hasNumbers && hasNonAlphaNumeric;
    },
    message: 'Password must contain uppercase, lowercase, numbers, and special characters',
  },
};

/**
 * Validate a single field
 * @param {string} value - The value to validate
 * @param {Array} rules - Array of validation rules to apply
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateField = (value, rules = []) => {
  const errors = [];

  rules.forEach((rule) => {
    if (typeof rule === 'string') {
      // Named rule like 'required', 'email'
      const ruleConfig = validationRules[rule];
      if (ruleConfig && !ruleConfig.validate(value)) {
        errors.push(ruleConfig.message);
      }
    } else if (typeof rule === 'function') {
      // Custom validation function
      const result = rule(value);
      if (result && typeof result === 'object' && result.isValid === false) {
        errors.push(result.message);
      } else if (result === false) {
        errors.push('Validation failed');
      }
    } else if (typeof rule === 'object' && rule.validate) {
      // Rule object with validate function
      if (!rule.validate(value)) {
        errors.push(rule.message || 'Validation failed');
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate entire form
 * @param {Object} formData - Form data object
 * @param {Object} schema - Validation schema { fieldName: [rules] }
 * @returns {Object} - { isValid: boolean, errors: { fieldName: [errors] } }
 */
export const validateForm = (formData, schema) => {
  const errors = {};
  let isValid = true;

  Object.entries(schema).forEach(([fieldName, rules]) => {
    const value = formData[fieldName];
    const fieldErrors = validateField(value, rules);

    if (!fieldErrors.isValid) {
      errors[fieldName] = fieldErrors.errors;
      isValid = false;
    }
  });

  return {
    isValid,
    errors,
  };
};

/**
 * Get first error message for a field
 * @param {Object} errors - Error object from validation
 * @param {string} fieldName - Field name
 * @returns {string} - First error message or empty string
 */
export const getFieldError = (errors = {}, fieldName) => {
  const fieldErrors = errors[fieldName];
  return Array.isArray(fieldErrors) && fieldErrors.length > 0 ? fieldErrors[0] : '';
};

/**
 * Check if field has error
 * @param {Object} errors - Error object from validation
 * @param {string} fieldName - Field name
 * @returns {boolean}
 */
export const hasFieldError = (errors = {}, fieldName) => {
  return Array.isArray(errors[fieldName]) && errors[fieldName].length > 0;
};

/**
 * Clear errors for a specific field
 * @param {Object} errors - Current errors object
 * @param {string} fieldName - Field to clear
 * @returns {Object} - Updated errors object
 */
export const clearFieldError = (errors = {}, fieldName) => {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
};

/**
 * Common validation schemas
 */
export const validationSchemas = {
  student: {
    student_number: ['required', validationRules.alphanumeric],
    first_name: ['required', validationRules.alphabetic],
    last_name: ['required', validationRules.alphabetic],
    email: ['required', 'email'],
    program_id: ['required'],
    section_id: ['required'],
  },
  teacher: {
    employee_number: ['required', validationRules.alphanumeric],
    first_name: ['required', validationRules.alphabetic],
    last_name: ['required', validationRules.alphabetic],
    email: ['required', 'email'],
    department: ['required'],
  },
  program: {
    code: ['required', validationRules.alphanumeric],
    name: ['required'],
    department: ['required'],
    duration_years: ['required', validationRules.positiveNumber],
  },
  department: {
    code: ['required', validationRules.alphanumeric],
    name: ['required'],
  },
  subject: {
    code: ['required', validationRules.alphanumeric],
    name: ['required'],
    units: ['required', validationRules.positiveNumber],
  },
  section: {
    code: ['required', validationRules.alphanumeric],
    program_id: ['required'],
    capacity: ['required', validationRules.positiveNumber],
  },
};
