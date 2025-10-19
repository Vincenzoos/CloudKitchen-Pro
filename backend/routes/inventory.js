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
// INVENTORY ALERTS ROUTE
// ============================================
// GET - display expiring and low-stock alerts, category overview
router.get(`/alerts-${STUDENT_ID}`, async (req, res) => {
    try {
        // Current date at start of today at midnight (for daysLeft calculation)
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        // Compute date for expiringSoon (end of day after EXPIRY_DAYS)
        const soonToExpiredDate = new Date(startOfToday);
        soonToExpiredDate.setHours(23, 59, 59, 999);
        soonToExpiredDate.setDate(soonToExpiredDate.getDate() + EXPIRY_DAYS);

        // Aggregation for expiring soon: condition expirationDate <= soonToExpiredDate
        const expiringSoon = await Inventory.aggregate([
            { $match: { expirationDate: { $lte: soonToExpiredDate } } },
            {
                $project: {
                    ingredientName: 1,
                    quantity: 1,
                    unit: 1,
                    location: 1,
                    cost: 1,
                    expirationDate: { $dateToString: { format: "%Y-%m-%d", date: "$expirationDate" } },
                    daysLeft: {
                        $dateDiff: {
                            startDate: { $dateTrunc: { date: "$$NOW", unit: "day" } },
                            endDate: { $dateTrunc: { date: "$expirationDate", unit: "day" } },
                            unit: "day"
                        }
                    },
                    valueAtRisk: { $multiply: ["$cost", "$quantity"] }
                }
            },
            // Sort by expiration date soonest first
            { $sort: { expirationDate: 1 } }
        ]);

        // Aggregation for low stock: quantity < LOW_STOCK_THRESHOLD
        const lowStock = await Inventory.aggregate([
            { $match: { $expr: { $lt: ["$quantity", LOW_STOCK_THRESHOLD] } } },
            {
                $project:
                {
                    ingredientName: 1,
                    quantity: 1,
                    unit: 1,
                    location: 1,
                    category: 1,
                    cost: 1,
                    inventoryId: 1,
                    suggestedOrder: {
                        $add: ["$quantity", SUGGESTED_ORDER_ADD_ON]
                    }
                }
            },
            { $sort: { quantity: 1 } }
        ]);

        // Aggregate total value and total items (totalValue = sum of cost * quantity)
        const totalsAgg = await Inventory.aggregate([
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    totalValue: { $sum: { $multiply: ["$cost", "$quantity"] } }
                }
            }
        ]);

        // Aggregation result always return an array, therefore need to access result by index 0
        const totalItems = totalsAgg[0]?.totalItems || 0;
        const totalValue = totalsAgg[0]?.totalValue || 0;

        // Aggregate per-category counts and sums (value = sum of cost * quantity)
        const categoryAgg = await Inventory.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    value: { $sum: { $multiply: ["$cost", "$quantity"] } }
                }
            }
        ]);

        // Transform categoryAgg array to a dictionary for easier lookup in template
        const categoryOverview = {};
        categoryAgg.forEach(cat => {
            categoryOverview[cat._id] = { count: cat.count, value: cat.value };
        });

        // Render alerts view
        res.render('inventory/inventory-alerts', {
            title: 'Smart Inventory Alerts - CloudKitchen Pro',
            isLoggedIn: true,
            user: req.user,
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
            expiringSoon,
            lowStock,
            totalItems,
            totalValue,
            categoryOverview,
            EXPIRY_DAYS,
            LOW_STOCK_THRESHOLD
        });
    } catch (error) {
        console.error('Error preparing inventory alerts:', error);
        res.status(500).render('errors/500', {
            title: 'Error - CloudKitchen Pro',
            userId: req.user && req.user.userId ? req.user.userId : '',
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME
        });
    }
});

// ============================================
// INVENTORY INSIGHTS ROUTE - HD Task 4
// ============================================
// GET - display detailed inventory analytics and optimization suggestions
router.get(`/insights-${STUDENT_ID}`, async (req, res) => {
    try {
        const EXPIRY_DAYS = 3;
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const soonDate = new Date(startOfToday);
        soonDate.setDate(soonDate.getDate() + EXPIRY_DAYS);
        soonDate.setHours(23, 59, 59, 999);

        const [expirationWaste, monthlySpendingByCategory, smartShoppingList] = await Promise.all([
            // expiration Waste pipeline
            Inventory.aggregate([
                { $match: { expirationDate: { $lte: soonDate } } },
                {
                    $project: {
                        ingredientName: 1,
                        quantity: 1,
                        unit: 1,
                        location: 1,
                        cost: 1,
                        expirationDate: { $dateToString: { format: "%Y-%m-%d", date: "$expirationDate" } },
                        valueAtRisk: { $multiply: ["$cost", "$quantity"] }
                    }
                },
                {
                    $lookup: {
                        from: 'recipes',
                        let: { ingName: '$ingredientName' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $anyElementTrue: {
                                            $map: {
                                                input: '$ingredients',
                                                as: 'rIng',
                                                in: { $gt: [{ $indexOfCP: [{ $toLower: '$$rIng' }, { $toLower: '$$ingName' }] }, -1] }
                                            }
                                        }
                                    }
                                }
                            },
                            { $project: { title: 1, recipeId: 1 } }
                        ],
                        as: 'recipesUsing'
                    }
                },
                { $sort: { expirationDate: 1 } }
            ]),

            // Monthly Spending by inventory item category pipeline 
            Inventory.aggregate([
                {
                    $project: {
                        year: { $year: '$purchaseDate' },
                        month: { $month: '$purchaseDate' },
                        category: 1,
                        amount: { $multiply: ['$cost', '$quantity'] }
                    }
                },
                {
                    $group: {
                        _id: { year: '$year', month: '$month', category: '$category' },
                        totalSpent: { $sum: '$amount' },
                        purchases: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        year: '$_id.year',
                        month: '$_id.month',
                        category: '$_id.category',
                        totalSpent: { $round: ['$totalSpent', 2] },
                        purchases: 1
                    }
                },
                { $sort: { year: -1, month: -1, totalSpent: -1 } }
            ]),

            // Smart Shopping List (limit by top 10)
            Recipe.aggregate([
                {
                    $lookup: {
                        from: 'inventories',
                        let: { ingredients: '$ingredients' },
                        pipeline: [{ $project: { ingredientName: 1 } }],
                        as: 'inventory'
                    }
                },
                {
                    $addFields: {
                        inventoryNames: {
                            $map: { input: '$inventory', as: 'inv', in: { $toLower: '$$inv.ingredientName' } }
                        }
                    }
                },
                {
                    $addFields: {
                        missing: {
                            $filter: {
                                input: '$ingredients',
                                as: 'ing',
                                cond: {
                                    $not: {
                                        $anyElementTrue: {
                                            $map: {
                                                input: '$inventoryNames',
                                                as: 'inv',
                                                in: { $gt: [{ $indexOfCP: [{ $toLower: '$$ing' }, '$$inv'] }, -1] }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                { $unwind: { path: '$missing', preserveNullAndEmptyArrays: false } },
                {
                    $group: {
                        _id: { ingredient: '$missing' },
                        count: { $sum: 1 },
                        // collect unique recipes that require this missing ingredient
                        recipes: { $addToSet: { title: '$title', recipeId: '$recipeId' } }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        ingredient: '$_id.ingredient',
                        recipeCount: '$count',
                        // limit to top 5 recipes per ingredient for display
                        recipes: { $slice: ['$recipes', 5] }
                    }
                },
                { $sort: { recipeCount: -1 } },
                { $limit: 10 }
            ])
        ]);

        const inventoryInsights = {
            expirationWaste,
            monthlySpendingByCategory,
            smartShoppingList
        };

        res.render('inventory/insights', {
            title: 'Inventory Insights - CloudKitchen Pro',
            isLoggedIn: true,
            user: req.user,
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
            inventoryInsights
        });

    } catch (error) {
        console.error('Error preparing inventory insights:', error);
        res.status(500).render('errors/500', {
            title: 'Error - CloudKitchen Pro',
            userId: req.user && req.user.userId ? req.user.userId : '',
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME
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
    const userId = req.user.userId;

    try {
        // Ensure the inventory item exists
        const inventory = await Inventory.findOne({ _id: id, userId: userId });
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
        const userId = req.user.userId;
        const id = req.body.id;

        // Find and delete the inventory item if it belongs to the logged-in user
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