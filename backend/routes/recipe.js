const express = require('express');
const Recipe = require('../models/Recipe');
const Inventory = require('../models/UserInventory');
const { recipeValidationMiddleware } = require('../middleware/validation');
const { requireLogin, authorizeRoles } = require('../middleware/auth');
const STUDENT_ID = '33810672';
const {MEAL_TYPES, CUISINE_TYPES, DIFFICULTY_TYPES} = require('../utils/recipe/constants');
const STUDENT_NAME = 'Viet Tran';

const router = express.Router();

// apply login + role-check to all recipe routes, make sure only user with the role of "chef" can access
router.use(requireLogin, authorizeRoles(['chef']));
// ============================================
// RECIPE LISTING ROUTES (chef only)
// ============================================

// GET / - Display all recipes for the current user
router.get(`/recipes-${STUDENT_ID}`, async (req, res) => {
    try {
        const userId = req.user.userId;
        const recipes = await Recipe.find({ userId: userId }).sort({ createdDate: -1 });

        res.render('recipe/recipes', {
            title: 'My Recipes - CloudKitchen Pro',
            isLoggedIn: true,
            user: req.user,
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
            recipes: recipes,
            msg: req.query.msg || ''
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).render('errors/500', {
            title: 'Error - CloudKitchen Pro',
            userId: req.user && req.user.userId ? req.user.userId : '',
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME
        });
    }
});

// ============================================
// CREATE RECIPE ROUTES
// ============================================

// GET - Display add recipe form
router.get(`/add-${STUDENT_ID}`, (req, res) => {
    res.render('recipe/add-recipe', {
        title: 'Add Recipe - CloudKitchen Pro',
        isLoggedIn: true,
        user: req.user,
        STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
        STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
        errors: [],
        formData: {},
        MEAL_TYPES: MEAL_TYPES,
        CUISINE_TYPES: CUISINE_TYPES,
        DIFFICULTY_TYPES: DIFFICULTY_TYPES
    });
});

// POST - Create new recipe
router.post(`/add-${STUDENT_ID}`, recipeValidationMiddleware, async (req, res) => {
    // If middleware found validation errors, render add page with errors
    if (req.validationErrors && req.validationErrors.length > 0) {
        return res.status(400).render('recipe/add-recipe', {
            title: 'Add Recipe - CloudKitchen Pro',
            isLoggedIn: true,
            user: req.user,
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
            errors: req.validationErrors,
            formData: req.body,
            MEAL_TYPES: MEAL_TYPES,
            CUISINE_TYPES: CUISINE_TYPES,
            DIFFICULTY_TYPES: DIFFICULTY_TYPES
        });
    }

    try {
        // Get validated data from middleware
        const {
            title,
            chef,
            ingredientsArr,
            instructionsArr,
            prepTimeNum,
            servingsNum,
            mealType,
            cuisineType,
            difficulty
        } = req.validatedRecipe;

        // Get userId from authenticated user
        const userId = req.user.userId;

        // Create new recipe document
        const newRecipe = new Recipe({
            userId: userId,
            title: title,
            chef: chef,
            ingredients: ingredientsArr,
            instructions: instructionsArr,
            mealType: mealType,
            cuisineType: cuisineType,
            prepTime: prepTimeNum,
            difficulty: difficulty,
            servings: servingsNum
        });

        // Save to database
        await newRecipe.save();

        // Redirect to recipes listing page
        res.redirect(`/recipe/recipes-${STUDENT_ID}?userId=${req.user.userId}`);

    } catch (error) {
        console.error('Error creating recipe:', error);

        let errors = [];
        let formData = req.body;

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            for (let field in error.errors) {
                errors.push(error.errors[field].message);
            }
        }
        // Handle duplicate key error (unique constraint violation)
        else if (error.code === 11000) {
            if (error.keyPattern && error.keyPattern.title) {
                errors.push('A recipe with this title already exists for this user.');
            } else {
                errors.push('Duplicate entry found.');
            }
        }
        // Handle other errors
        else {
            errors.push('An error occurred while saving the recipe. Please try again.');
        }

        // Render form with errors
        res.status(400).render('recipe/add-recipe', {
            title: 'Add Recipe - CloudKitchen Pro',
            isLoggedIn: true,
            user: req.user,
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
            errors: errors,
            formData: formData,
            MEAL_TYPES: MEAL_TYPES,
            CUISINE_TYPES: CUISINE_TYPES,
            DIFFICULTY_TYPES: DIFFICULTY_TYPES
        });
    }
});

// ============================================
// RECIPE UPDATE ROUTES
// ============================================

// GET - Display edit recipe form

router.get(`/edit-${STUDENT_ID}/:id`, async (req, res) => {
    const id = req.params.id;
    const userId = req.user.userId;

    try {
        // Ensure the recipe exists
        const recipeToEdit = await Recipe.findOne({ _id: id, userId: userId });
        if (!recipeToEdit) {
            return res.status(404).render('errors/404', {
                title: 'Recipe Not Found - CloudKitchen Pro',
                userId: req.user && req.user.userId ? req.user.userId : '',
                STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
                STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME
            });
        }

        // Render edit form with the selected recipe if found
        res.render('recipe/edit-recipe', {
            title: 'Edit Recipe - CloudKitchen Pro',
            isLoggedIn: true,
            user: req.user,
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
            errors: [],
            recipe: recipeToEdit,
            formData: {},
            MEAL_TYPES: MEAL_TYPES,
            CUISINE_TYPES: CUISINE_TYPES,
            DIFFICULTY_TYPES: DIFFICULTY_TYPES
        });
    } catch (error) {
        console.error('Error preparing edit form:', error);
        res.status(500).render('errors/500', {
            title: 'Error - CloudKitchen Pro',
            userId: req.user && req.user.userId ? req.user.userId : '',
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME
        });
    }
});


// POST - Update existing recipe
router.post(`/edit-${STUDENT_ID}/:id`, recipeValidationMiddleware, async (req, res) => {
    const id = req.params.id;

    // Fetch existing recipe once and return 404 if not found
    const recipeToEdit = await Recipe.findOne({ _id: id });
    if (!recipeToEdit) {
        return res.status(404).render('errors/404', {
            title: 'Recipe Not Found - CloudKitchen Pro',
            userId: req.user && req.user.userId ? req.user.userId : '',
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME
        });
    }

    // If middleware found validation errors, render edit page with errors
    if (req.validationErrors && req.validationErrors.length > 0) {
        return res.status(400).render('recipe/edit-recipe', {
            title: 'Edit Recipe - CloudKitchen Pro',
            isLoggedIn: true,
            user: req.user,
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
            errors: req.validationErrors,
            recipe: recipeToEdit,
            formData: req.body,
            MEAL_TYPES: MEAL_TYPES,
            CUISINE_TYPES: CUISINE_TYPES,
            DIFFICULTY_TYPES: DIFFICULTY_TYPES
        });
    }

    // Get validated data from middleware
    const {
        title,
        chef,
        ingredientsArr,
        instructionsArr,
        prepTimeNum,
        servingsNum,
        mealType,
        cuisineType,
        difficulty
    } = req.validatedRecipe;
    
    try {
        // Use findByIdAndUpdate with ownership check via query filter
        const updatedRecipe = await Recipe.findByIdAndUpdate(
            id,
            {
                title: title,
                chef: chef,
                ingredients: ingredientsArr,
                instructions: instructionsArr,
                mealType: mealType,
                cuisineType: cuisineType,
                prepTime: prepTimeNum,
                difficulty: difficulty,
                servings: servingsNum
            },
            { new: true, runValidators: true }
        );

        if (!updatedRecipe) {
            return res.status(404).render('errors/404', {
                title: 'Recipe Not Found - CloudKitchen Pro',
                userId: req.user && req.user.userId ? req.user.userId : '',
                STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
                STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME
            });
        }

        // Redirect back with success message
        res.redirect(`/recipe/recipes-${STUDENT_ID}?userId=${req.user.userId}&msg=${encodeURIComponent(updatedRecipe.title + ' (' + updatedRecipe.recipeId + ') updated successfully')}`);
    } catch (error) {
        console.error('Error updating recipe:', error);

        // Prepare errors and re-render edit page with form data
        let errors = [];
        if (error.name === 'ValidationError') {
            for (let field in error.errors) {
                errors.push(error.errors[field].message);
            }
        } else if (error.code === 11000) {
            errors.push('A recipe with this title already exists for this user.');
        } else {
            errors.push('An error occurred while updating the recipe.');
        }

        // Build a formData object similar to add form to repopulate fields
        const formData = req.body;

        res.status(400).render('recipe/edit-recipe', {
            title: 'Edit Recipe - CloudKitchen Pro',
            isLoggedIn: true,
            user: req.user,
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
            errors: errors,
            recipe: recipeToEdit,
            formData: formData,
            MEAL_TYPES: MEAL_TYPES,
            CUISINE_TYPES: CUISINE_TYPES,
            DIFFICULTY_TYPES: DIFFICULTY_TYPES
        });
    }
});

// ============================================
// RECIPE DELETION ROUTES
// ============================================

// POST - Delete a recipe
router.post(`/delete-${STUDENT_ID}`, async (req, res) => {
    try {
        const userId = req.user.userId;
        const id = req.body.id; // expecting MongoDB _id from the listing form

        // Find and delete the recipe if it belongs to the logged-in user
        const toDeleteRecipe = await Recipe.findOne({ _id: id, userId: userId });
        const deletedRecipe = await Recipe.findByIdAndDelete(id);
        
        // If no recipe was found to delete, show 404
        if (!deletedRecipe) {
            return res.status(404).render('errors/404', {
                title: 'Recipe Not Found - CloudKitchen Pro',
                userId: req.user && req.user.userId ? req.user.userId : '',
                STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
                STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME
            });
        }

    // Redirect back to recipes list after successful deletion with toast message
    const idLabel = toDeleteRecipe && toDeleteRecipe.recipeId ? `(${toDeleteRecipe.recipeId})` : `(_id:${toDeleteRecipe._id})`;
    res.redirect(`/recipe/recipes-${STUDENT_ID}?userId=${req.user.userId}&msg=${encodeURIComponent(toDeleteRecipe.title + ' ' + idLabel + ' deleted successfully')}`);
    }
    catch (error) {
        // unexpected server error
        console.error('Error deleting recipe:', error);
        res.status(500).render('errors/500', {
            title: 'Error - CloudKitchen Pro',
            userId: req.user && req.user.userId ? req.user.userId : '',
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME
        });
    }
});

// ============================================
// RECIPE AVAILABILITY ROUTE (HD TASK 1)
// ============================================
router.get(`/availability-${STUDENT_ID}`, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Aggregation pipeline for recipe-inventory matching
        const recipeAvailability = await Recipe.aggregate([
            // Match recipes by belonging to the current user
            { $match: { userId } },
            // Lookup inventory items documents
            // each recipe will have an "inventory" array of all inventory items
            // e.g. recipe.inventory = [ { ingredientName: 'eggs' }, { ingredientName: 'milk' }, ... ]
            { $lookup: {
                from: 'inventories',
                let: { ingredients: '$ingredients' },
                pipeline: [
                { $project: { ingredientName: 1 } }
                ],
                as: 'inventory'
            } },
            // Create an array of lowercased inventory ingredient names for easier matching
            // e.g. recipe.inventoryNames = [ 'eggs', 'milk', ... ]
            { $addFields: {
                inventoryNames: {
                    $map: {
                        input: '$inventory',
                        as: 'inv',
                        in: { $toLower: '$$inv.ingredientName' }
                    }
                }
            } },
            { $addFields: {
                // Available ingredients array for each recipe
                // filter inventoryNames to see if any match each ingredient (case-insensitive, substring)
                available: {
                    $filter: {
                        input: "$ingredients",
                        as: "ing",
                        cond: {
                        // check if any inventory item matches this ingredient, true if at least one match
                        $anyElementTrue: {
                            $map: {
                            input: "$inventoryNames",
                            as: "inv",
                            in: {
                                // check if inventory item name is a substring of the ingredient (case-insensitive)
                                // indexOfCP returns -1 if not found, so gt > -1 means found
                                $gt: [{ $indexOfCP: [ { $toLower: "$$ing" }, "$$inv" ] }, -1]
                            }
                            }
                        }
                        }
                    }
                },
                // Missing ingredients array for each recipe
                // filter inventoryNames to see if any not match each ingredient (case-insensitive, substring)
                missing: {
                    $filter: {
                        input: "$ingredients",
                        as: "ing",
                        cond: {
                            // check if no inventory item matches this ingredient, true if none match
                            $not: {
                                $anyElementTrue: {
                                $map: {
                                    input: "$inventoryNames",
                                    as: "inv",
                                    in: {
                                        // check if inventory item name is a substring of the ingredient (case-insensitive)
                                        // indexOfCP returns -1 if not found, so gt > -1 means found
                                        $gt: [{ $indexOfCP: [ { $toLower: "$$ing" }, "$$inv" ] }, -1]
                                    }
                                }
                                }
                            }
                        }
                    }
                }
            } },
            // Calculate percentage of available ingredients (available / total * 100)
            { $addFields: {
                percent: {
                    $floor: {
                        $multiply: [ { $divide: [ { $size: '$available' }, { $size: '$ingredients' } ] }, 100 ]
                    }
                }
            } },
            // Determine availability status based on percentage
            { $addFields: {
                status: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$percent', 100] }, then: 'Ready to Cook!' },
                            { case: { $gte: ['$percent', 60] }, then: 'Mostly Available' },
                            { case: { $gte: ['$percent', 30] }, then: 'Partially Available' },
                        ],
                        default: 'Not Available'
                    }
                }
            } },
            // Project only necessary fields for the view
            // recipe: ROOT, preserve all fields in the recipe document (including additional fields created in pipeline)
            { $project: { recipe: '$$ROOT', available: 1, missing: 1, percent: 1, status: 1 } },
            // Sort by most recently created recipes first
            { $sort: { 'recipe.createdDate': -1 } }
        ]);


        // Compute suggested recipes (recipe that chef can cook given current available inventory item)
        const suggestedRecipes = await Recipe.aggregate([
            // Lookup inventory items documents
            // each recipe will have an "inventory" array of all inventory items
            // e.g. recipe.inventory = [ { ingredientName: 'eggs' }, { ingredientName: 'milk' }, ... ]
            { $lookup: {
                from: 'inventories',
                let: { ingredients: '$ingredients' },
                pipeline: [
                { $project: { ingredientName: 1 } }
                ],
                as: 'inventory'
            } },
            // Create an array of lowercased inventory ingredient names for easier matching
            // e.g. recipe.inventoryNames = [ 'eggs', 'milk', ... ]
            { $addFields: {
                inventoryNames: {
                    $map: {
                        input: '$inventory',
                        as: 'inv',
                        in: { $toLower: '$$inv.ingredientName' }
                    }
                }
            } },
            // Available ingredients array, used for calculating availability percentage
            { $addFields: {
                available: {
                    $filter: {
                        input: '$ingredients',
                        as: 'ing',
                        cond: {
                            $anyElementTrue: {
                                $map: {
                                    input: '$inventoryNames',
                                    as: 'inv',
                                    in: { $gt: [ { $indexOfCP: [ { $toLower: '$$ing' }, '$$inv' ] }, -1 ] }
                                }
                            }
                        }
                    }
                },
            } },
            // Calculate percentage of available ingredients (available / total * 100)
            { $addFields: {
                percent: {
                    $floor: {
                        $multiply: [ { $divide: [ { $size: '$available' }, { $size: '$ingredients' } ] }, 100 ]
                    }
                }
            } },
            // Determine availability status based on percentage
            { $addFields: {
                status: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$percent', 100] }, then: 'Ready to Cook!' },
                            { case: { $gte: ['$percent', 60] }, then: 'Mostly Available' },
                            { case: { $gte: ['$percent', 30] }, then: 'Partially Available' },
                        ],
                        default: 'Not Available'
                    }
                }
            } },
            { $project: { recipe: '$$ROOT', available: 1, missing: 1, percent: 1, status: 1 } },
            // Only suggest recipes that are fully available (100% of ingredients)
            { $match: { percent: 100 } },
            { $sort: { 'recipe.createdDate': -1 } }
        ]);

        // render availability view
        res.render('recipe/recipe-availability', {
            title: 'Recipe Availability - CloudKitchen Pro',
            isLoggedIn: true,
            user: req.user,
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
            recipeAvailability,
            suggestedRecipes
        });
    } catch (error) {
        console.error('Error preparing recipe availability:', error);
        res.status(500).render('errors/500', {
            title: 'Error - CloudKitchen Pro',
            userId: req.user && req.user.userId ? req.user.userId : '',
            STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME
        });
    }
});

module.exports = router;

// Route to import a suggested recipe into the chef's own recipes
router.post(`/import-suggested-${STUDENT_ID}`, async (req, res) => {
    try {
        const userId = req.user.userId;
        const suggestedId = req.body.suggestedId;
        if (!suggestedId) return res.status(400).send('Missing suggestedId');

        // Find suggested recipe (must exist)
        const suggested = await Recipe.findById(suggestedId).lean();
        if (!suggested) return res.status(404).send('Suggested recipe not found');

        // Create a copy for current user (preserve fields but set userId)
        const copy = new Recipe({
            userId: userId,
            title: suggested.title + ' (Copy)',
            chef: suggested.chef,
            ingredients: suggested.ingredients,
            instructions: suggested.instructions,
            mealType: suggested.mealType,
            cuisineType: suggested.cuisineType,
            prepTime: suggested.prepTime,
            difficulty: suggested.difficulty,
            servings: suggested.servings
        });
        await copy.save();
        res.redirect(`/recipe/availability-${STUDENT_ID}?userId=${userId}`);
    } catch (err) {
        console.error('Error importing suggested recipe:', err);
        res.status(500).render('errors/500', { title: 'Error' });
    }
});