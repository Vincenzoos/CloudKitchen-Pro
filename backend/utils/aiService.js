const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini AI client
// Note: In production, this should be set via environment variables
// You need to get a Gemini API key from https://makersuite.google.com/app/apikey
// and set it as GEMINI_API_KEY environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-gemini-api-key-here');

class AIService {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    /**
     * Analyze the healthiness of a recipe based on its ingredients
     * @param {string[]} ingredients - Array of ingredient strings
     * @returns {Promise<Object>} - Analysis result with health score, concerns, and suggestions
     */
    async analyzeRecipeHealth(ingredients) {
        try {
            const ingredientsText = ingredients.join(', ');

            const prompt = `Analyze the healthiness of this recipe based on its ingredients: "${ingredientsText}".

Please provide a comprehensive health analysis including:
1. Overall health score (1-10, where 10 is very healthy)
2. Key health concerns (if any) with explanations
3. Nutritional benefits (if any)
4. Specific suggestions for improving nutritional value
5. Alternative ingredient recommendations

Format your response as a JSON object with the following structure. Do not include any markdown formatting, code blocks, or additional text:

{
    "healthScore": number (1-10),
    "concerns": array of strings (each concern with brief explanation),
    "benefits": array of strings (nutritional benefits),
    "suggestions": array of strings (specific improvement suggestions),
    "alternatives": array of objects with format: [{"original": "ingredient_name", "alternative": "healthier_option", "reason": "explanation"}]
}

Be specific and provide actionable advice. Consider factors like sodium content, saturated fats, processed ingredients, whole foods, vitamins, minerals, etc.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Try to parse the JSON response
            try {
                // Clean the response text - remove markdown code blocks if present
                let cleanText = text.trim();

                // Remove markdown code block markers
                if (cleanText.startsWith('```json')) {
                    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanText.startsWith('```')) {
                    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }

                // Remove any leading/trailing whitespace
                cleanText = cleanText.trim();

                const analysis = JSON.parse(cleanText);
                return {
                    success: true,
                    analysis: analysis
                };
            } catch (parseError) {
                // If JSON parsing fails, return the raw text
                console.warn('Failed to parse AI response as JSON:', parseError);
                console.warn('Raw response:', text);
                return {
                    success: true,
                    analysis: {
                        healthScore: 5,
                        concerns: ['Unable to parse detailed analysis'],
                        benefits: ['Analysis completed'],
                        suggestions: [text],
                        alternatives: {}
                    }
                };
            }
        } catch (error) {
            console.error('Error analyzing recipe health:', error);
            return {
                success: false,
                error: 'Failed to analyze recipe health. Please try again later.'
            };
        }
    }
}

module.exports = new AIService();