const express = require('express');
const Recipe = require('../models/Recipe');
const Inventory = require('../models/UserInventory');
const { recipeValidationMiddleware } = require('../middleware/validation');
const { requireLogin, authorizeRoles } = require('../middleware/auth');
const STUDENT_ID = '33810672';
const { MEAL_TYPES, CUISINE_TYPES, DIFFICULTY_TYPES } = require('../utils/recipe/constants');
const STUDENT_NAME = 'Viet Tran';
const aiService = require('../utils/aiService');

const router = express.Router();

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

// GET - Get recipe form options (JSON API) - Public endpoint
router.get(`/form-options-${STUDENT_ID}`, (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            mealTypes: MEAL_TYPES,
            cuisineTypes: CUISINE_TYPES,
            difficultyTypes: DIFFICULTY_TYPES
        }
    });
});

// apply login + role-check to all recipe routes, make sure only user with the role of "chef" can access
router.use(requireLogin, authorizeRoles(['chef']));
// ============================================
// RECIPE LISTING ROUTES (chef only)
// ============================================

// GET / - Get all recipes (not just for the current user) (JSON API)
router.get(`/recipes-${STUDENT_ID}`, async (req, res) => {
    try {
        const userId = req.user.userId;
        const recipes = await Recipe.find({}).sort({ createdDate: -1 });

        return res.status(200).json({
            success: true,
            data: recipes,
            count: recipes.length
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch recipes'
        });
    }
});

// ============================================
// CREATE RECIPE ROUTES
// ============================================

// POST - Create new recipe (JSON API)
router.post(`/add-${STUDENT_ID}`, recipeValidationMiddleware, async (req, res) => {
    // If middleware found validation errors, return JSON error response
    if (req.validationErrors && req.validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: req.validationErrors
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

        // Return success response with created recipe
        return res.status(201).json({
            success: true,
            message: 'Recipe created successfully',
            data: newRecipe
        });

    } catch (error) {
        console.error('Error creating recipe:', error);

        let errors = [];

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

        // Return JSON error response
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }
});

// ============================================
// RECIPE UPDATE ROUTES
// ============================================

// GET - Get a single recipe by ID for viewing (no ownership check) (JSON API)
router.get(`/view-${STUDENT_ID}/:id`, async (req, res) => {
    const id = req.params.id;

    try {
        // Ensure the recipe exists
        const recipe = await Recipe.findById(id);
        if (!recipe) {
            return res.status(404).json({
                success: false,
                error: 'Recipe not found'
            });
        }

        // Return recipe data
        return res.status(200).json({
            success: true,
            data: recipe
        });
    } catch (error) {
        console.error('Error fetching recipe:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch recipe'
        });
    }
});

// GET - Get a single recipe by ID (JSON API)
router.get(`/edit-${STUDENT_ID}/:id`, async (req, res) => {
    const id = req.params.id;
    const userId = req.user.userId;

    try {
        // Ensure the recipe exists
        const recipe = await Recipe.findOne({ _id: id, userId: userId });
        if (!recipe) {
            return res.status(404).json({
                success: false,
                error: 'Recipe not found'
            });
        }

        // Return recipe data
        return res.status(200).json({
            success: true,
            data: recipe
        });
    } catch (error) {
        console.error('Error fetching recipe:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch recipe'
        });
    }
});


// PUT - Update existing recipe (JSON API)
router.put(`/edit-${STUDENT_ID}/:id`, recipeValidationMiddleware, async (req, res) => {
    const id = req.params.id;

    // Fetch existing recipe once and return 404 if not found
    const recipeToEdit = await Recipe.findOne({ _id: id });
    if (!recipeToEdit) {
        return res.status(404).json({
            success: false,
            error: 'Recipe not found'
        });
    }

    // If middleware found validation errors, return JSON error response
    if (req.validationErrors && req.validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: req.validationErrors
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
            return res.status(404).json({
                success: false,
                error: 'Recipe not found'
            });
        }

        // Return success response with updated recipe
        return res.status(200).json({
            success: true,
            message: 'Recipe updated successfully',
            data: updatedRecipe
        });
    } catch (error) {
        console.error('Error updating recipe:', error);

        // Prepare errors and return JSON error response
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

        return res.status(400).json({
            success: false,
            errors: errors
        });
    }
});

// ============================================
// RECIPE DELETION ROUTES
// ============================================

// DELETE - Delete a recipe (JSON API)
router.delete(`/delete-${STUDENT_ID}/:id`, async (req, res) => {
    try {
        const userId = req.user.userId;
        const id = req.params.id; // expecting MongoDB _id from the URL parameter

        // Find and delete the recipe if it belongs to the logged-in user
        const deletedRecipe = await Recipe.findOneAndDelete({ _id: id, userId: userId });

        // If no recipe was found to delete, return 404
        if (!deletedRecipe) {
            return res.status(404).json({
                success: false,
                error: 'Recipe not found'
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Recipe deleted successfully',
            data: deletedRecipe
        });
    }
    catch (error) {
        // unexpected server error
        console.error('Error deleting recipe:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete recipe'
        });
    }
});

// ============================================
// RECIPE HEALTH ANALYSIS ROUTE (HD TASK 1)
// ============================================

// POST - Analyze recipe health using AI (JSON API)
router.post(`/analyze-health-${STUDENT_ID}`, async (req, res) => {
    try {
        const { ingredients } = req.body;

        // Validate input
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Ingredients array is required and must not be empty'
            });
        }

        // Call AI service to analyze health
        const analysisResult = await aiService.analyzeRecipeHealth(ingredients);

        if (analysisResult.success) {
            return res.status(200).json({
                success: true,
                data: analysisResult.analysis
            });
        } else {
            return res.status(500).json({
                success: false,
                error: analysisResult.error
            });
        }
    } catch (error) {
        console.error('Error in health analysis:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to analyze recipe health'
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
            {
                $lookup: {
                    from: 'inventories',
                    let: { ingredients: '$ingredients' },
                    pipeline: [
                        { $project: { ingredientName: 1 } }
                    ],
                    as: 'inventory'
                }
            },
            // Create an array of lowercased inventory ingredient names for easier matching
            // e.g. recipe.inventoryNames = [ 'eggs', 'milk', ... ]
            {
                $addFields: {
                    inventoryNames: {
                        $map: {
                            input: '$inventory',
                            as: 'inv',
                            in: { $toLower: '$$inv.ingredientName' }
                        }
                    }
                }
            },
            {
                $addFields: {
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
                                            $gt: [{ $indexOfCP: [{ $toLower: "$$ing" }, "$$inv"] }, -1]
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
                                                $gt: [{ $indexOfCP: [{ $toLower: "$$ing" }, "$$inv"] }, -1]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // Calculate percentage of available ingredients (available / total * 100)
            {
                $addFields: {
                    percent: {
                        $floor: {
                            $multiply: [{ $divide: [{ $size: '$available' }, { $size: '$ingredients' }] }, 100]
                        }
                    }
                }
            },
            // Determine availability status based on percentage
            {
                $addFields: {
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
                }
            },
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
            {
                $lookup: {
                    from: 'inventories',
                    let: { ingredients: '$ingredients' },
                    pipeline: [
                        { $project: { ingredientName: 1 } }
                    ],
                    as: 'inventory'
                }
            },
            // Create an array of lowercased inventory ingredient names for easier matching
            // e.g. recipe.inventoryNames = [ 'eggs', 'milk', ... ]
            {
                $addFields: {
                    inventoryNames: {
                        $map: {
                            input: '$inventory',
                            as: 'inv',
                            in: { $toLower: '$$inv.ingredientName' }
                        }
                    }
                }
            },
            // Available ingredients array, used for calculating availability percentage
            {
                $addFields: {
                    available: {
                        $filter: {
                            input: '$ingredients',
                            as: 'ing',
                            cond: {
                                $anyElementTrue: {
                                    $map: {
                                        input: '$inventoryNames',
                                        as: 'inv',
                                        in: { $gt: [{ $indexOfCP: [{ $toLower: '$$ing' }, '$$inv'] }, -1] }
                                    }
                                }
                            }
                        }
                    },
                }
            },
            // Calculate percentage of available ingredients (available / total * 100)
            {
                $addFields: {
                    percent: {
                        $floor: {
                            $multiply: [{ $divide: [{ $size: '$available' }, { $size: '$ingredients' }] }, 100]
                        }
                    }
                }
            },
            // Determine availability status based on percentage
            {
                $addFields: {
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
                }
            },
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

// ============================================
// RECIPE TRANSLATION ROUTE (HD TASK 2)
// ============================================

// POST - Translate recipe ingredients and instructions (JSON API)
router.post(`/translate-${STUDENT_ID}`, async (req, res) => {
    try {
        const { ingredients, instructions, targetLanguage } = req.body;

        // Validate input
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Ingredients array is required and must not be empty'
            });
        }

        if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Instructions array is required and must not be empty'
            });
        }

        if (!targetLanguage || typeof targetLanguage !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Target language is required and must be a string'
            });
        }

        // Validate target language (support common languages)
        const supportedLanguages = ['es', 'fr', 'it', 'de', 'pt', 'zh', 'ja', 'ko'];
        if (!supportedLanguages.includes(targetLanguage.toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: 'Unsupported target language. Supported languages: es, fr, it, de, pt, zh, ja, ko'
            });
        }

        // Import translation service
        const translationService = require('../utils/translationService');

        // Translate the recipe
        const translationResult = await translationService.translateRecipe(
            ingredients,
            instructions,
            targetLanguage.toLowerCase()
        );

        if (translationResult) {
            return res.status(200).json({
                success: true,
                data: translationResult
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Failed to translate recipe'
            });
        }
    } catch (error) {
        console.error('Error in recipe translation:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to translate recipe'
        });
    }
});

// ============================================
// RECIPE TEXT-TO-SPEECH ROUTE (HD TASK 3)
// ============================================

// POST - Generate speech for recipe instructions (JSON API)
router.post(`/text-to-speech-${STUDENT_ID}`, async (req, res) => {
    try {
        const { instructions, recipeTitle, languageCode, voiceName, speakingRate } = req.body;

        // Validate input
        if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Instructions array is required and must not be empty'
            });
        }

        if (!recipeTitle || typeof recipeTitle !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Recipe title is required and must be a string'
            });
        }

        // Import TTS service
        const ttsService = require('../utils/ttsService');

        // Check if TTS service is initialized
        if (!ttsService.isInitialized()) {
            return res.status(503).json({
                success: false,
                error: 'Text-to-Speech service is not available. Please check Google Cloud credentials.'
            });
        }

        // Format instructions for speech
        const formattedText = ttsService.formatInstructionsForSpeech(instructions);

        // Generate speech audio
        const audioBuffer = await ttsService.synthesizeSpeech(formattedText, {
            languageCode: languageCode || 'en-US',
            voiceName: voiceName || 'en-US-Neural2-A',
            speakingRate: speakingRate || 1.0
        });

        // Convert buffer to base64 for transmission
        const audioBase64 = audioBuffer.toString('base64');

        // Return audio as base64 data URL
        return res.status(200).json({
            success: true,
            data: {
                audioBase64: audioBase64,
                contentType: 'audio/mpeg',
                recipeTitle: recipeTitle
            }
        });
    } catch (error) {
        console.error('Error in recipe text-to-speech:', error);
        return res.status(500).json({
            success: false,
            error: `Failed to generate speech: ${error.message}`
        });
    }
});