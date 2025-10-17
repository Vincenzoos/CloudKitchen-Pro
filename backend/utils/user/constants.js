// Enum for roles, must be exactly one of: "admin", "chef", "manager"
const ROLES = ['admin', 'chef', 'manager'];

// Regex patterns
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// min 8 chars, at least one uppercase, one lowercase, one number, one special char, required
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const PASSWORD_MIN_LENGTH = 8;

// Minimum 2 characters, maximum 100 characters, no numbers or special characters except spaces, hyphens, and apostrophes, required
const FULLNAME_REGEX = /^[a-zA-Z\s\-']+$/;
const FULLNAME_MIN_LENGTH = 2;
const FULLNAME_MAX_LENGTH = 100;

// Must follow the exact format: +61 4xx xxx xxx, required
const PHONE_REGEX = /^\+61 4\d{2} \d{3} \d{3}$/;
const PHONE_MAX_LENGTH = 15;

// UserID format: U-XXXXX where XXXXX is a zero-padded number, e.g., U-00001
const USERID_REGEX = /^U-(\d{5})$/;

// Export constants
module.exports = {
  ROLES,
  EMAIL_REGEX,
  PASSWORD_REGEX,
  PASSWORD_MIN_LENGTH,
  FULLNAME_REGEX,
  FULLNAME_MIN_LENGTH,
  FULLNAME_MAX_LENGTH,
  PHONE_REGEX,
  PHONE_MAX_LENGTH,
  USERID_REGEX
};