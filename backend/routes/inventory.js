const express = require('express');
const Inventory = require('../models/UserInventory');
const Recipe = require('../models/Recipe');
const { inventoryValidationMiddleware } = require('../middleware/validation');
const { requireLogin } = require('../middleware/auth');
const {
    ALLOWED_UNITS,
    ALLOWED_CATEGORIES,
    ALLOWED_LOCATIONS,
    EXPIRY_DAYS,
    LOW_STOCK_THRESHOLD,
    SUGGESTED_ORDER_ADD_ON
} = require('../utils/inventory/constants');
const STUDENT_ID = '33810672';
const STUDENT_NAME = 'Viet Tran';

const router = express.Router();


// ============================================
// INVENTORY FORM OPTIONS ROUTE
// ============================================
// GET - Get form options (units, categories, locations) - Public endpoint
router.get(`/form-options-${STUDENT_ID}`, (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            allowedUnits: ALLOWED_UNITS,
            allowedCategories: ALLOWED_CATEGORIES,
            allowedLocations: ALLOWED_LOCATIONS
        }
    });
});

// apply login middleware to all inventory routes
// do not apply role-check here as viewing inventory is allowed for all roles
router.use(requireLogin);
// ============================================
// INVENTORY LISTING ROUTES
// ============================================

// GET - Get all inventory items for the current user (JSON API)
router.get(`/inventories-${STUDENT_ID}`, async (req, res) => {
    try {
        // fetch all inventory items (sorted by most recent) and populate the user virtual
        const inventoryItems = await Inventory.find({}).sort({ createdDate: -1 }).populate('user', 'fullname userId');

        return res.status(200).json({
            success: true,
            data: inventoryItems,
            count: inventoryItems.length
        });
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch inventory items'
        });
    }
});

// ============================================
// CREATE INVENTORY ROUTES
// ============================================

// POST - Create new inventory item (JSON API)
router.post(`/add-${STUDENT_ID}`, inventoryValidationMiddleware, async (req, res) => {
    // If validation middleware attached validation errors, return JSON error response
    if (req.validationErrors && req.validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: req.validationErrors
        });
    }

    try {
        // Get validated data from middleware
        const {
            ingredientName,
            category,
            quantity,
            unitMeasurement,
            purchaseDate,
            expirationDate,
            location,
            purchaseCost
        } = req.validatedInventory;

        // Get userId from authenticated user
        const userId = req.user.userId;

        // Create new inventory document
        const newInventory = new Inventory({
            userId,
            ingredientName,
            category,
            quantity,
            unit: unitMeasurement,
            purchaseDate,
            expirationDate,
            location,
            cost: purchaseCost
        });

        // Save to database
        await newInventory.save();

        // Return success response with created inventory item
        return res.status(201).json({
            success: true,
            message: 'Inventory item created successfully',
            data: newInventory
        });
    } catch (error) {
        console.error('Error creating inventory item:', error);

        let errors = [];

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            for (let field in error.errors) {
                errors.push(error.errors[field].message);
            }
        }
        // Handle duplicate key error (unique constraint violation)
        else if (error.code === 11000) {
            if (error.keyPattern && error.keyPattern.name) {
                errors.push('An inventory item with this name already exists for this user.');
            } else {
                errors.push('Duplicate entry found.');
            }
        }
        // Handle other errors
        else {
            errors.push('An error occurred while saving the inventory item. Please try again.');
        }

        // Return JSON error response
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }
});

// ============================================
// INVENTORY UPDATE ROUTES
// ============================================

// GET - Get a single inventory item by ID (JSON API)
router.get(`/edit-${STUDENT_ID}/:id`, async (req, res) => {
    const id = req.params.id;

    try {
        // Ensure the inventory item exists
        const inventory = await Inventory.findOne({ _id: id });
        if (!inventory) {
            return res.status(404).json({
                success: false,
                error: 'Inventory item not found'
            });
        }

        // Return inventory data
        return res.status(200).json({
            success: true,
            data: inventory
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch inventory item'
        });
    }
});

// POST - Update existing inventory item (JSON API)
router.post(`/edit-${STUDENT_ID}/:id`, inventoryValidationMiddleware, async (req, res) => {
    const id = req.params.id;

    // Fetch existing inventory once and return 404 if not found
    const inventoryToEdit = await Inventory.findOne({ _id: id });
    if (!inventoryToEdit) {
        return res.status(404).json({
            success: false,
            error: 'Inventory item not found'
        });
    }

    // If validation middleware attached validation errors, return JSON error response
    if (req.validationErrors && req.validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: req.validationErrors
        });
    }

    // Get validated data from middleware
    const {
        ingredientName,
        category,
        quantity,
        unitMeasurement,
        purchaseDate,
        expirationDate,
        location,
        purchaseCost
    } = req.validatedInventory;

    try {
        // Use findByIdAndUpdate to update the inventory item with given id
        const updatedInventory = await Inventory.findByIdAndUpdate(
            id,
            {
                ingredientName,
                category,
                quantity,
                unit: unitMeasurement,
                purchaseDate,
                expirationDate,
                location,
                cost: purchaseCost
            },
            // options to return the updated document and run validators
            { new: true, runValidators: true }
        );

        // If no inventory item was found to update, return 404
        if (!updatedInventory) {
            return res.status(404).json({
                success: false,
                error: 'Inventory item not found'
            });
        }

        // Return success response with updated inventory item
        return res.status(200).json({
            success: true,
            message: 'Inventory item updated successfully',
            data: updatedInventory
        });
    } catch (error) {
        console.error('Error updating inventory item:', error);

        // Prepare errors and return JSON error response
        let errors = [];
        if (error.name === 'ValidationError') {
            for (let field in error.errors) {
                errors.push(error.errors[field].message);
            }
        } else if (error.code === 11000) {
            errors.push('An inventory item with this title already exists for this user.');
        } else {
            errors.push('An error occurred while updating the inventory item.');
        }

        return res.status(400).json({
            success: false,
            errors: errors
        });
    }
});


// ============================================
// DELETE INVENTORY ROUTES
// ============================================
// POST - Delete an inventory item (JSON API)
router.post(`/delete-${STUDENT_ID}`, async (req, res) => {
    try {
        const id = req.body.id;

        // Find and delete the inventory item
        const deletedInventory = await Inventory.findByIdAndDelete(id);

        // If no inventory item was found to delete, return 404
        if (!deletedInventory) {
            return res.status(404).json({
                success: false,
                error: 'Inventory item not found'
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Inventory item deleted successfully',
            data: deletedInventory
        });
    }
    catch (error) {
        // unexpected server error
        console.error('Error deleting inventory item:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete inventory item'
        });
    }
});

module.exports = router;