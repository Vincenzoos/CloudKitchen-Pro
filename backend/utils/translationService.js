const { Translate } = require('@google-cloud/translate').v2;

// Initialize the Translate API client with service account credentials
let translate;
try {
    translate = new Translate();
} catch (error) {
    console.warn('Google Translate API client initialization failed. Make sure GOOGLE_APPLICATION_CREDENTIALS is set to the path of your service account JSON file.');
    translate = null;
}

/**
 * Translates text to a specified language using Google Translate API
 * @param {string} text - The text to translate
 * @param {string} targetLanguage - The target language code (e.g., 'es' for Spanish)
 * @returns {Promise<string>} - The translated text
 */
async function translateText(text, targetLanguage) {
    if (!translate) {
        throw new Error('Google Translate API client not initialized. Please set GOOGLE_APPLICATION_CREDENTIALS to the path of your service account JSON file.');
    }

    try {
        const [translation] = await translate.translate(text, targetLanguage);
        return translation;
    } catch (error) {
        console.error('Translation error:', error);
        throw new Error(`Failed to translate text: ${error.message}`);
    }
}

/**
 * Translates an array of strings to a specified language
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLanguage - The target language code
 * @returns {Promise<string[]>} - Array of translated texts
 */
async function translateTexts(texts, targetLanguage) {
    try {
        const translations = await Promise.all(
            texts.map(text => translateText(text, targetLanguage))
        );
        return translations;
    } catch (error) {
        console.error('Batch translation error:', error);
        throw new Error(`Failed to translate texts: ${error.message}`);
    }
}

/**
 * Translates complete recipe with all attributes
 * Translates title, chef name, ingredients, instructions, meal type, cuisine type, and difficulty
 * Preserves quantities and measurements in ingredients
 * @param {object} recipe - Recipe object with all attributes
 * @param {string} targetLanguage - Target language code
 * @returns {Promise<object>} - Translated recipe object
 */
async function translateCompleteRecipe(recipe, targetLanguage) {
    try {
        // Process ingredients to extract quantities and ingredient names separately
        const processedIngredients = recipe.ingredients.map(ingredient => {
            // Match pattern: optional quantity (numbers, spaces, units like g, kg, ml, etc) followed by ingredient name
            const match = ingredient.match(/^([\d\s\w\/.,\-]*?)\s+(.+)$/);
            if (match && match[1].trim()) {
                return {
                    quantity: match[1].trim(),
                    ingredient: match[2].trim()
                };
            }
            // If no quantity found, treat entire string as ingredient
            return {
                quantity: '',
                ingredient: ingredient.trim()
            };
        });

        // Collect all text fields to translate (only ingredient names, not quantities)
        const textsToTranslate = [
            recipe.title,
            recipe.chef,
            recipe.mealType,
            recipe.cuisineType,
            recipe.difficulty,
            ...processedIngredients.map(ing => ing.ingredient), // Only ingredient names
            ...recipe.instructions
        ];

        // Translate all texts in one batch
        const translatedTexts = await translateTexts(textsToTranslate, targetLanguage);

        // Map back translated texts to recipe attributes
        let index = 0;
        const translatedTitle = translatedTexts[index++];
        const translatedChef = translatedTexts[index++];
        const translatedMealType = translatedTexts[index++];
        const translatedCuisineType = translatedTexts[index++];
        const translatedDifficulty = translatedTexts[index++];

        // Get translated ingredients (preserve quantities)
        const ingredientCount = recipe.ingredients.length;
        const translatedIngredientNames = translatedTexts.slice(index, index + ingredientCount);
        const translatedIngredients = processedIngredients.map((item, i) => {
            const translatedName = translatedIngredientNames[i];
            // If there's a quantity, prepend it to the translated ingredient name
            return item.quantity ? `${item.quantity} ${translatedName}` : translatedName;
        });

        // Get translated instructions
        const translatedInstructions = translatedTexts.slice(index + ingredientCount);

        return {
            title: translatedTitle,
            chef: translatedChef,
            mealType: translatedMealType,
            cuisineType: translatedCuisineType,
            difficulty: translatedDifficulty,
            ingredients: translatedIngredients,
            instructions: translatedInstructions
        };
    } catch (error) {
        console.error('Recipe translation error:', error);
        throw new Error(`Failed to translate recipe: ${error.message}`);
    }
}

module.exports = {
    translateText,
    translateTexts,
    translateCompleteRecipe
};