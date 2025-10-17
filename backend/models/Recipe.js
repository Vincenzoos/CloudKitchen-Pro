const mongoose = require('mongoose');
const {
    RECIPE_ID_REGEX,
    TITLE_MIN_LENGTH,
    TITLE_MAX_LENGTH,
    USER_ID_REGEX,
    CHEF_NAME_REGEX,
    CHEF_NAME_MIN_LENGTH,
    CHEF_NAME_MAX_LENGTH,
    INGREDIENT_REGEX,
    MIN_INGREDIENT_COUNT,
    MAX_INGREDIENT_COUNT,
    MIN_INGREDIENT_LENGTH,
    INSTRUCTION_MIN_LENGTH,
    MIN_INSTRUCTION_COUNT,
    MAX_INSTRUCTION_COUNT,
    PREP_TIME_MIN,
    PREP_TIME_MAX,
    SERVINGS_MIN,
    SERVINGS_MAX,
    MEAL_TYPES,
    CUISINE_TYPES,
    DIFFICULTY_TYPES
} = require('../utils/recipe/constants');

// Define the Recipe schema with validation and constraints
const recipeSchema = new mongoose.Schema({
    // Auto generated (format: R-XXXXX), created when new recipe is added, required, unique
    recipeId: {
        type: String,
        required: true,
        unique: true,
        match: [RECIPE_ID_REGEX, 'Recipe ID must follow the format R-XXXXX']
    },
    //  Must be a valid userId (format: U-XXXXX) that exists in the users collection
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        match: [USER_ID_REGEX, 'User ID must follow the format U-XXXXX'],
        ref: 'User' // Reference to User model
    },
    // Minimum 3 characters, maximum 100 characters, required, must be unique per user
    title: {
        type: String,
        required: [true, 'Title is required'],
        minlength: [TITLE_MIN_LENGTH, 'Title must be at least 3 characters'],
        maxlength: [TITLE_MAX_LENGTH, 'Title cannot exceed 100 characters']
    },
    // Minimum 2 characters, maximum 50 characters, no numbers or special characters except spaces, hyphens, and apostrophes
    chef: {
        type: String,
        required: [true, 'Chef is required'],
        minlength: [CHEF_NAME_MIN_LENGTH, 'Chef name must be at least 2 characters'],
        maxlength: [CHEF_NAME_MAX_LENGTH, 'Chef name cannot exceed 50 characters'],
        match: [CHEF_NAME_REGEX, 'Chef name can only contain letters, spaces, hyphens, and apostrophes']
    },
    // Array must contain at least 1 ingredient, maximum 20 ingredients
    // Each ingredient string must be minimum 3 characters and follow the format: quantity(optional) unit(optional) ingredient
    ingredients: {
        type: [String],
        required: [true, 'Ingredients are required'],
        validate: {
            validator: function(arr) {
                if (!Array.isArray(arr) || arr.length < MIN_INGREDIENT_COUNT || arr.length > MAX_INGREDIENT_COUNT) return false;
                return arr.every(item => {
                    const trimmed = item.trim();
                    // Must be at least 3 characters and match the format
                    // Accept if:
                      // - Only ingredient name (one or more words)
                      // - Quantity + at least one word after (e.g. "1 egg", "100g beef", "1 large egg")
                      // Reject if: quantity + only one char (e.g. "100g")
                    return trimmed.length >= MIN_INGREDIENT_LENGTH && INGREDIENT_REGEX.test(trimmed);
                });
            },
            message: 'Ingredients must contain 1-20 items. Each item must be at least 3 characters and follow the format: either just the ingredient name (e.g. "egg", "black pepper"), or "quantity ingredient" (e.g. "1 egg"), or "quantity unit ingredient" (e.g. "1 large egg"). Not allowed: "100g".'
        }
    },
    // Array must contain at least 1 instruction step, maximum 15 steps, each step minimum 10 characters
    instructions: {
        type: [String],
        required: [true, 'Instructions are required'],
        validate: {
            validator: function(arr) {
                return arr.length >= MIN_INSTRUCTION_COUNT && arr.length <= MAX_INSTRUCTION_COUNT && arr.every(step => step.length >= INSTRUCTION_MIN_LENGTH);
            },
            message: 'Instructions must contain 1-15 steps, each at least 10 characters'
        }
    },
    // Must be exactly one of: "Breakfast", "Lunch", "Dinner", "Snack"
    mealType: {
        type: String,
        required: [true, 'Meal type is required'],
        enum: {
            values: MEAL_TYPES,
            message: 'Meal type must be one of: Breakfast, Lunch, Dinner, Snack'
        }
    },
    // Must be exactly one of: "Italian", "Asian", "Mexican", "American", "French", "Indian", "Mediterranean", "Other"
    cuisineType: {
        type: String,
        required: [true, 'Cuisine type is required'],
        enum: {
            values: CUISINE_TYPES,
            message: 'Cuisine type must be one of: Italian, Asian, Mexican, American, French, Indian, Mediterranean, Other'
        }
    },
    // Must be a positive integer between 1 and 480 minutes (8 hours)
    prepTime: {
        type: Number,
        required: [true, 'Prep time is required'],
        min: [PREP_TIME_MIN, 'Prep time must be at least 1 minute'],
        max: [PREP_TIME_MAX, 'Prep time cannot exceed 480 minutes']
    },
    // Must be exactly one of: "Easy", "Medium", "Hard"
    difficulty: {
        type: String,
        required: [true, 'Difficulty is required'],
        enum: {
            values: DIFFICULTY_TYPES,
            message: 'Difficulty must be one of: Easy, Medium, Hard'
        }
    },
    // Must be a positive integer between 1 and 20
    servings: {
        type: Number,
        required: [true, 'Servings is required'],
        min: [SERVINGS_MIN, 'Servings must be at least 1'],
        max: [SERVINGS_MAX, 'Servings cannot exceed 20']
    },
    // Must be a valid date in YYYY-MM-DD format, cannot be in the future, default to current date if not provided
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

// Create compound index for unique title per user
recipeSchema.index({ userId: 1, title: 1 }, { unique: true });

// Index to optimize queries fetching recipes by userId sorted by createdDate descending
recipeSchema.index({ userId: 1, createdDate: -1 });

// Pre-validate middleware to generate recipeId if not present
recipeSchema.pre('validate', async function(next) {
    if (!this.recipeId) {
        // Find the last recipe (with highest ID) and increment the ID sequentially
        const lastRecipe = await this.constructor.findOne().sort({ recipeId: -1 });
        let nextNum = 1;
        if (lastRecipe && lastRecipe.recipeId) {
          // Extract the numeric part using regex
            const match = lastRecipe.recipeId.match(RECIPE_ID_REGEX);
            // if matched, match will be an array with the full match and the captured group (e.g. ["R-00003", "00003"])
            if (match) {
              // Get the numeric part (e.g. XXXXX in R-XXXXX), increment by 1
                nextNum = parseInt(match[1]) + 1;
            }
        }
        // Format the new recipeId with leading zeros (e.g. R-00001)
        this.recipeId = `R-${nextNum.toString().padStart(5, '0')}`;
    }
    next();
});

// Create and export the Recipe model
const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;