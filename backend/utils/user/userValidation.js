const { ROLES, 
    EMAIL_REGEX, 
    PASSWORD_REGEX,
    PASSWORD_MIN_LENGTH, 
    FULLNAME_MIN_LENGTH, 
    FULLNAME_MAX_LENGTH, 
    FULLNAME_REGEX, 
    PHONE_REGEX,
} = require('./constants');

function validateAndParseUserData(body) {
  let { email, password, fullname, role, phone } = body;

  const errors = [];

  // Validate email
  email = email ? email.trim().toLowerCase() : "";
  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push("Invalid email format.");
  }

  // Validate password
  if (!password || password.length < PASSWORD_MIN_LENGTH || !PASSWORD_REGEX.test(password)) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters and include uppercase, lowercase, number, and special character.`);
  }

  // Validate fullname
  fullname = fullname || "";
  if (!fullname || fullname.length < FULLNAME_MIN_LENGTH || fullname.length > FULLNAME_MAX_LENGTH || !FULLNAME_REGEX.test(fullname)) {
    errors.push(`Full name must be between ${FULLNAME_MIN_LENGTH} and ${FULLNAME_MAX_LENGTH} characters and contain only letters, spaces, hyphens, and apostrophes.`);
  }

  // Validate fullname
  fullname = fullname ? fullname.trim() : "";
  if (!fullname || fullname.length < FULLNAME_MIN_LENGTH || fullname.length > FULLNAME_MAX_LENGTH || !FULLNAME_REGEX.test(fullname)) {
    errors.push(`Full name must be between ${FULLNAME_MIN_LENGTH} and ${FULLNAME_MAX_LENGTH} characters and contain only letters, spaces, hyphens, and apostrophes.`);
  }

  // Validate role
  role = role ? role.trim() : "";
  if (!role || !ROLES.includes(role)) {
    errors.push(`Role must be one of: ${ROLES.join(", ")}.`);
  }

  // Validate phone
  phone = phone ? phone.trim() : "";
  if (!phone || !PHONE_REGEX.test(phone)) {
    errors.push("Phone number must follow the format: +61 4xx xxx xxx.");
  }

  // Return errors and individual fields
  return {
    errors,
    email,
    password,
    fullname,
    role,
    phone,
  };
}

module.exports = { validateAndParseUserData };