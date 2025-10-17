const mongoose = require('mongoose');
const { 
    INVENTORY_ID_REGEX, 
    USER_ID_REGEX, 
    INGREDIENT_MIN_LENGTH, 
    INGREDIENT_MAX_LENGTH, 
    INGREDIENT_NAME_REGEX,
    MIN_QUANTITY, 
    MAX_QUANTITY, 
    ALLOWED_UNITS,
    ALLOWED_CATEGORIES,
    ALLOWED_LOCATIONS,
    COST_DECIMAL_REGEX,
    MIN_COST,
    MAX_COST
} = require('../utils/inventory/constants');

// Define the Inventory schema with validation and constraints
const inventorySchema = new mongoose.Schema({
    // Must follow format I-XXXXX where X is a number, must be unique across all inventory items
    inventoryId: {
        type: String,
        required: true,
        unique: true,
        match: [INVENTORY_ID_REGEX, 'Inventory ID must follow the format I-XXXXX']
    },
    // Must be a valid userId (format: U-XXXXX) that exists in the users collection
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        match: [USER_ID_REGEX, 'User ID must follow the format U-XXXXX'],
        ref: 'User'
    },
    //  Minimum 2 characters, maximum 50 characters, no numbers or special characters except spaces and hyphens
    ingredientName: {
        type: String,
        required: [true, 'Ingredient name is required'],
        minlength: [INGREDIENT_MIN_LENGTH, `Ingredient name must be at least ${INGREDIENT_MIN_LENGTH} characters`],
        maxlength: [INGREDIENT_MAX_LENGTH, `Ingredient name cannot exceed ${INGREDIENT_MAX_LENGTH} characters`],
        match: [INGREDIENT_NAME_REGEX, 'Ingredient name can only contain letters, spaces, and hyphens']
    },
    // Must be a positive number greater than 0, maximum 9999, supports decimal values (e.g., 2.5)
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [MIN_QUANTITY, 'Quantity must be greater than 0'],
        max: [MAX_QUANTITY, 'Quantity cannot exceed 9999']
    },
    // Must be exactly one of: "pieces", "kg", "g", "liters", "ml", "cups", "tbsp", "tsp", "dozen"
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        enum: {
            values: ALLOWED_UNITS,
            message: `Unit must be one of: ${ALLOWED_UNITS.join(', ')}`
        }
    },
    // Must be exactly one of: "Vegetables", "Fruits", "Meat", "Dairy", "Grains", "Spices", "Beverages", "Frozen", "Canned", "Other"
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ALLOWED_CATEGORIES,
            message: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`
        }
    },
    // Must be a valid date in YYYY-MM-DD format, cannot be in the future
    purchaseDate: {
        type: Date,
        required: [true, 'Purchase date is required'],
        validate: {
            validator: function(value) {
                return value <= new Date();
            },
            message: 'Purchase date cannot be in the future'
        }
    },
    // Must be a valid date in YYYY-MM-DD format, must be after purchase date
    expirationDate: {
        type: Date,
        required: [true, 'Expiration date is required'],
        validate: {
            validator: function(value) {
                // When validators run in update context, `this` may be the query object and
                // won't have the document fields. In that case, skip this schema-level
                // cross-field check and let the pre('findOneAndUpdate') hook validate updates.
                // Detect query context by presence of getQuery() function on `this`.
                if (this && typeof this.getQuery === 'function') {
                    // running as an update validator - skip cross-field check here and let pre('findOneAndUpdate') hook validate updates
                    return true;
                }
                console.log('schema-level validation ran ', this)
                return value > this.purchaseDate;
            },
            message: 'Expiration date must be after purchase date'
        }
    },
    // Must be exactly one of: "Fridge", "Freezer", "Pantry", "Counter", "Cupboard"
    location: {
        type: String,
        required: [true, 'Location is required'],
        enum: {
            values: ALLOWED_LOCATIONS,
            message: `Location must be one of: ${ALLOWED_LOCATIONS.join(', ')}`
        }
    },
    // Must be a positive number with maximum 2 decimal places, minimum $0.01, maximum $999.99
    cost: {
        type: Number,
        required: [true, 'Cost is required'],
        min: [MIN_COST, `Cost must be at least $${MIN_COST}`],
        max: [MAX_COST, `Cost cannot exceed $${MAX_COST}`],
        validate: {
            validator: function(value) {
                return COST_DECIMAL_REGEX.test(value.toString());
            },
            message: `Cost must have at most 2 decimal places, minimum $${MIN_COST}, maximum $${MAX_COST}`
        }
    },
    // Must be a valid date in YYYY-MM-DD format, cannot be in the future, defaults to current date if not provided
    createdDate: {
        type: Date,
        required: [true, 'Created date is required'],
        default: Date.now,
        validate: {
            validator: function(value) {
                return value <= new Date();
            },
            message: 'Created date cannot be in the future'
        }
    }
});

// Virtual user field so we can populate user by the string userId without changing schema type
inventorySchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: 'userId',
    justOne: true
});

// Ensure virtuals are included when converting documents to objects/JSON
inventorySchema.set('toObject', { virtuals: true });
inventorySchema.set('toJSON', { virtuals: true });

// Pre-validate middleware to generate inventoryId if not present
inventorySchema.pre('validate', async function(next) {
    if (!this.inventoryId) {
        // Find the last inventory item (with highest ID) and increment the ID sequentially
        const lastItem = await this.constructor.findOne().sort({ inventoryId: -1 });
        let nextNum = 1;
        if (lastItem && lastItem.inventoryId) {
            // Extract the numeric part using regex
            const match = lastItem.inventoryId.match(INVENTORY_ID_REGEX);
            // if matched, match will be an array with the full match and the captured group (e.g. ["I-00003", "00003"])
            if (match) {
                // Increment the numeric part by 1
                nextNum = parseInt(match[1]) + 1;
            }
        }
        // Format the new inventoryId with leading zeros (e.g. I-00001)
        this.inventoryId = `I-${nextNum.toString().padStart(5, '0')}`;
        console.log(`Generated new inventoryId: ${this.inventoryId}`); // Debug log
    }
    next();
});

// Pre hook for findOneAndUpdate to perform cross-field validation for updates
// Update validators don't have access to document instance `this` in the same way as document.save(),
// so implement explicit checks here to ensure expirationDate > purchaseDate for updates.
inventorySchema.pre('findOneAndUpdate', async function(next) {
    try {
        const update = this.getUpdate() || {};
        const upd = update.$set ? update.$set : update;

        // Normalise incoming values
        const purchaseRaw = upd.purchaseDate;
        const expirationRaw = upd.expirationDate;

        const hasPurchase = typeof purchaseRaw !== 'undefined';
        const hasExpiration = typeof expirationRaw !== 'undefined';
        console.log('model-level date validation prehook for updates ran');

        // If both supplied in update, validate directly
        if (hasPurchase && hasExpiration) {
            const purchaseDate = new Date(purchaseRaw);
            const expirationDate = new Date(expirationRaw);
            if (isNaN(purchaseDate.getTime()) || isNaN(expirationDate.getTime()) || expirationDate <= purchaseDate) {
                const ValidationError = mongoose.Error.ValidationError;
                const ValidatorError = mongoose.Error.ValidatorError;
                const err = new ValidationError();
                err.addError('expirationDate', new ValidatorError({ message: 'Expiration date must be after purchase date', path: 'expirationDate', value: expirationRaw }));
                return next(err);
            }
            return next();
        }

        // If only expiration supplied, fetch existing purchaseDate from DB to compare
        if (hasExpiration && !hasPurchase) {
            const doc = await this.model.findOne(this.getQuery()).select('purchaseDate').lean();
            if (doc && doc.purchaseDate) {
                const purchaseDate = new Date(doc.purchaseDate);
                const expirationDate = new Date(expirationRaw);
                if (isNaN(expirationDate.getTime()) || isNaN(purchaseDate.getTime()) || expirationDate <= purchaseDate) {
                    const ValidationError = mongoose.Error.ValidationError;
                    const ValidatorError = mongoose.Error.ValidatorError;
                    const err = new ValidationError();
                    err.addError('expirationDate', new ValidatorError({ message: 'Expiration date must be after purchase date', path: 'expirationDate', value: expirationRaw }));
                    return next(err);
                }
            }
            return next();
        }

        // If only purchase supplied, fetch existing expirationDate from DB to ensure it remains after new purchase
        if (hasPurchase && !hasExpiration) {
            const doc = await this.model.findOne(this.getQuery()).select('expirationDate').lean();
            if (doc && doc.expirationDate) {
                const purchaseDate = new Date(purchaseRaw);
                const expirationDate = new Date(doc.expirationDate);
                if (isNaN(expirationDate.getTime()) || isNaN(purchaseDate.getTime()) || expirationDate <= purchaseDate) {
                    const ValidationError = mongoose.Error.ValidationError;
                    const ValidatorError = mongoose.Error.ValidatorError;
                    const err = new ValidationError();
                    err.addError('expirationDate', new ValidatorError({ message: 'Expiration date must be after purchase date', path: 'expirationDate', value: doc.expirationDate }));
                    return next(err);
                }
            }
            return next();
        }

        // Nothing related to dates to validate
        return next();
    } catch (err) {
        console.error('Error in pre findOneAndUpdate hook when validating dates:', err);
        return next(err);
    }
});

// Create and export the model
const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;