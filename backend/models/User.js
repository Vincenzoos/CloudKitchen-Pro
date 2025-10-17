const mongoose = require('mongoose');
const { ROLES, 
    EMAIL_REGEX, 
    PASSWORD_REGEX,
    PASSWORD_MIN_LENGTH, 
    FULLNAME_MIN_LENGTH, 
    FULLNAME_MAX_LENGTH, 
    FULLNAME_REGEX, 
    PHONE_REGEX,
    PHONE_MAX_LENGTH,
    USERID_REGEX 
} = require('../utils/user/constants');

// Define the User schema with validation and constraints
const userSchema = new mongoose.Schema({
    // Auto generated (format: U-XXXXX), created when new user register, required, unique
    userId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // valid email format, unique across users, required
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [EMAIL_REGEX, 'Please enter a valid email']
    },
    // min 8 chars, at least one uppercase, one lowercase, one number, one special char, required
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`],
        match: [PASSWORD_REGEX, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character']
    },
    // Minimum 2 characters, maximum 100 characters, no numbers or special characters except spaces, hyphens, and apostrophes, required
    fullname: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [FULLNAME_MIN_LENGTH, `Full name must be at least ${FULLNAME_MIN_LENGTH} characters`],
        maxlength: [FULLNAME_MAX_LENGTH, `Full name cannot exceed ${FULLNAME_MAX_LENGTH} characters`],
        match: [FULLNAME_REGEX, 'Full name can only contain letters, spaces, hyphens, and apostrophes']
    },
    // Must be exactly one of: "admin", "chef", "manager", required
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: {
            values: ROLES,
            message: 'Role must be one of: admin, chef, manager'
        }
    },
    // Must follow the exact format: +61 4xx xxx xxx, required
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        maxlength: [PHONE_MAX_LENGTH, `Phone number cannot exceed ${PHONE_MAX_LENGTH} characters`],
        match: [PHONE_REGEX, 'Phone number must follow the format: +61 4xx xxx xxx']
    },
    // Login status flag
    isLoggedIn: {
        type: Boolean,
        default: false
    }
}, {
    // Adds createdAt and updatedAt fields automatically by Mongoose
    timestamps: true 
});

// Pre-validate middleware to generate userId if not present (e.g. generate id when new user register, do nothing on updates)
// mongoose middleware/hook allows you to execute code before a Mongoose document is saved to the database (similar to triggers in SQL)
// Generate userId before validation so required validator passes
// Use pre-validate instead of pre-save to ensure userId is set before any validation occurs
userSchema.pre('validate', async function(next) {
    try {
        // check if userId is already set (to avoid overwriting on updates)
        if (!this.userId) {
            // Find the last user (with highest ID) and increment the ID sequentially
            // Use this.constructor instead of mongoose.model('User') to avoid circular reference
            const lastUser = await this.constructor.findOne().sort({ userId: -1 });
            let nextNum = 1;
            if (lastUser && lastUser.userId) {
                // Extract the numeric part using regex
                const match = lastUser.userId.match(USERID_REGEX);
                // if matched, match will be an array with the full match and the captured group (e.g. ["U-00003", "00003"])
                if (match) {
                    // Increment the numeric part by 1
                    nextNum = parseInt(match[1]) + 1;
                }
            }
            // Format the new userId with leading zeros (e.g. U-00001)
            this.userId = `U-${nextNum.toString().padStart(5, '0')}`;
        }
    // Proceed to next middleware or validation/save operation
        next();
    } catch (error) {
        console.error('Error generating userId:', error);
        next(error);
    }
});

// Create and export the User model
const User = mongoose.model('User', userSchema);

// Export the User model
module.exports = User;