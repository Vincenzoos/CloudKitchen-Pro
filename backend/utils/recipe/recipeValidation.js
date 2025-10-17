const {
    TITLE_MIN_LENGTH,
    TITLE_MAX_LENGTH,
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
} = require('./constants');

function validateAndParseRecipeData(body) {
    let {
        title,
        chef,
        ingredients,
        instructions,
        'meal-type': mealType,
        'cuisine-type': cuisineType,
        'prep-time': prepTime,
        difficulty,
        servings,
    } = body;

    // Array of possible errors
    let errors = [];

    // Trim title and chef here
    title = title ? title.trim() : "";
    chef = chef ? chef.trim() : "";
    // Title: required, min 3, max 100 characters
    if (!title || title.trim() === "") {
        errors.push("Title is required.");
    } else if (title.length < TITLE_MIN_LENGTH) {
        errors.push(`Title must be at least ${TITLE_MIN_LENGTH} characters.`);
    } else if (title.length > TITLE_MAX_LENGTH) {
        errors.push(`Title cannot exceed ${TITLE_MAX_LENGTH} characters.`);
    }

    // Chef name: required, min 2, max 50, match regex
    if (!chef || chef.trim() === "") {
        errors.push("Chef name is required.");
    } else if (chef.length < CHEF_NAME_MIN_LENGTH) {
        errors.push(`Chef name must be at least ${CHEF_NAME_MIN_LENGTH} characters.`);
    } else if (chef.length > CHEF_NAME_MAX_LENGTH) {
        errors.push(`Chef name cannot exceed ${CHEF_NAME_MAX_LENGTH} characters.`);
    } else if (!CHEF_NAME_REGEX.test(chef)) {
        errors.push("Chef name can only contain letters, spaces, hyphens, and apostrophes.");
    }

    // Ingredients: split by newlines, 1-20 items, each >=3 chars, match regex
    const ingredientsArr = ingredients ? ingredients.split('\n').map(i => i.trim()).filter(Boolean) : [];
    if (ingredientsArr.length < MIN_INGREDIENT_COUNT) {
        errors.push("At least one ingredient is required.");
    } else if (ingredientsArr.length > MAX_INGREDIENT_COUNT) {
        errors.push(`Ingredients cannot exceed ${MAX_INGREDIENT_COUNT} items.`);
    } else {
        ingredientsArr.forEach((item, idx) => {
            if (item.length < MIN_INGREDIENT_LENGTH) {
                errors.push(`Ingredient ${idx + 1} must be at least ${MIN_INGREDIENT_LENGTH} characters.`);
            } else if (!INGREDIENT_REGEX.test(item)) {
                errors.push(`Ingredient ${idx + 1} must be either just the ingredient name (e.g. "egg", "black pepper"), or "quantity ingredient" (e.g. "1 egg"), or "quantity unit ingredient" (e.g. "1 large egg"). Not allowed: "100g".`);
            }
        });
    }

    // Instructions: split by newlines, 1-15 items, each >=10 chars
    const instructionsArr = instructions ? instructions.split('\n').map(i => i.trim()).filter(Boolean) : [];
    if (instructionsArr.length < MIN_INSTRUCTION_COUNT) {
        errors.push("At least one instruction is required.");
    } else if (instructionsArr.length > MAX_INSTRUCTION_COUNT) {
        errors.push(`Instructions cannot exceed ${MAX_INSTRUCTION_COUNT} steps.`);
    } else {
        instructionsArr.forEach((item, idx) => {
            if (item.length < INSTRUCTION_MIN_LENGTH) {
                errors.push(`Instruction ${idx + 1} must be at least ${INSTRUCTION_MIN_LENGTH} characters.`);
            }
        });
    }

    // Meal type, cuisine type, and difficulty dropdown required and must be valid options
    if (!mealType || mealType.trim() === "") {
        errors.push("Meal type is required.");
    } else if (!MEAL_TYPES.includes(mealType)) {
        errors.push(`Meal type must be one of: ${MEAL_TYPES.join(', ')}.`);
    }

    if (!cuisineType || cuisineType.trim() === "") {
        errors.push("Cuisine type is required.");
    } else if (!CUISINE_TYPES.includes(cuisineType)) {
        errors.push(`Cuisine type must be one of: ${CUISINE_TYPES.join(', ')}.`);
    }

    if (!difficulty || difficulty.trim() === "") {
        errors.push("Difficulty is required.");
    } else if (!DIFFICULTY_TYPES.includes(difficulty)) {
        errors.push(`Difficulty must be one of: ${DIFFICULTY_TYPES.join(', ')}.`);
    }

    // Prep time and servings must be positive integers within range
    const prepTimeNum = parseInt(prepTime, 10);
    if (isNaN(prepTimeNum) || prepTimeNum < PREP_TIME_MIN) {
        errors.push(`Preparation time must be at least ${PREP_TIME_MIN} minute.`);
    } else if (prepTimeNum > PREP_TIME_MAX) {
        errors.push(`Preparation time cannot exceed ${PREP_TIME_MAX} minutes.`);
    }
    
    const servingsNum = parseInt(servings, 10);
    if (isNaN(servingsNum) || servingsNum < SERVINGS_MIN) {
        errors.push(`Servings must be at least ${SERVINGS_MIN}.`);
    } else if (servingsNum > SERVINGS_MAX) {
        errors.push(`Servings cannot exceed ${SERVINGS_MAX}.`);
    }

    // Return errors and parsed arrays for use in POST handler
    return {
        errors,
        ingredientsArr,
        instructionsArr,
        prepTimeNum,
        servingsNum,
        title,
        chef,
        mealType,
        cuisineType,
        difficulty
    };
}

module.exports = { validateAndParseRecipeData };