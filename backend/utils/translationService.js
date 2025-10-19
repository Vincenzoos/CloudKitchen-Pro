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
 * Translates recipe ingredients and instructions
 * Preserves quantities and measurements in ingredients
 * @param {string[]} ingredients - Array of ingredient strings
 * @param {string[]} instructions - Array of instruction strings
 * @param {string} targetLanguage - Target language code
 * @returns {Promise<{translatedIngredients: string[], translatedInstructions: string[]}>}
 */
async function translateRecipe(ingredients, instructions, targetLanguage) {
    try {
        // For ingredients, we need to be careful to preserve quantities
        // Split ingredients into quantity/unit parts and ingredient names
        const processedIngredients = ingredients.map(ingredient => {
            // Match patterns like "1 cup flour", "2 large eggs", "salt", "100g beef"
            const match = ingredient.match(/^([\d\s\w\/.-]+)?\s*(.+)$/);
            if (match) {
                const quantityPart = match[1] || '';
                const ingredientPart = match[2] || ingredient;

                // Only translate the ingredient name part, keep quantity as is
                return {
                    quantity: quantityPart.trim(),
                    ingredient: ingredientPart.trim()
                };
            }
            return {
                quantity: '',
                ingredient: ingredient
            };
        });

        // Translate ingredient names only
        const ingredientNames = processedIngredients.map(item => item.ingredient);
        const translatedIngredientNames = await translateTexts(ingredientNames, targetLanguage);

        // Reconstruct ingredients with original quantities
        const translatedIngredients = processedIngredients.map((item, index) => {
            const translatedName = translatedIngredientNames[index];
            return item.quantity ? `${item.quantity} ${translatedName}` : translatedName;
        });

        // Translate instructions
        const translatedInstructions = await translateTexts(instructions, targetLanguage);

        return {
            translatedIngredients,
            translatedInstructions
        };
    } catch (error) {
        console.error('Recipe translation error:', error);
        throw new Error(`Failed to translate recipe: ${error.message}`);
    }
}

module.exports = {
    translateText,
    translateTexts,
    translateRecipe
};