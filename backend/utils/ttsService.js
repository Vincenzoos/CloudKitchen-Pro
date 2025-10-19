const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');

/**
 * Google Text-to-Speech Service
 * Handles conversion of recipe text to MP3 audio files
 * Requires Google Cloud credentials set via GOOGLE_APPLICATION_CREDENTIALS environment variable
 */
class TTSService {
    constructor() {
        // Initialize the Text-to-Speech client
        try {
            this.client = new textToSpeech.TextToSpeechClient();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize TTS client:', error);
            this.initialized = false;
        }
    }

    /**
     * Check if TTS service is properly initialized
     * @returns {boolean} - True if service is ready to use
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Convert recipe instructions text to MP3 audio
     * @param {string} recipeInstructions - Recipe instructions as a concatenated string
     * @param {Object} options - Configuration options
     * @param {string} options.languageCode - Language code (default: 'en-US')
     * @param {string} options.voiceName - Voice name (default: 'en-US-Neural2-A')
     * @param {number} options.speakingRate - Speaking rate (default: 1.0)
     * @returns {Promise<Buffer>} - MP3 audio buffer
     */
    async synthesizeSpeech(recipeInstructions, options = {}) {
        if (!this.initialized) {
            throw new Error('TTS service not initialized. Ensure GOOGLE_APPLICATION_CREDENTIALS is set.');
        }

        if (!recipeInstructions || typeof recipeInstructions !== 'string') {
            throw new Error('Recipe instructions must be a non-empty string');
        }

        try {
            // Limit text to 5000 characters (Google Cloud limit)
            const limitedText = recipeInstructions.substring(0, 5000);

            const request = {
                input: { text: limitedText },
                voice: {
                    languageCode: options.languageCode || 'en-US',
                    name: options.voiceName || 'en-US-Neural2-A'
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: options.speakingRate || 1.0,
                    pitch: options.pitch || 0.0
                }
            };

            // Perform text-to-speech synthesis
            const [response] = await this.client.synthesizeSpeech(request);

            if (!response.audioContent) {
                throw new Error('No audio content received from Google Text-to-Speech API');
            }

            return response.audioContent;
        } catch (error) {
            console.error('Error synthesizing speech:', error);
            throw new Error(`Failed to synthesize speech: ${error.message}`);
        }
    }

    /**
     * Convert recipe instructions to speech and save as file
     * @param {string} recipeTitle - Recipe title (used for filename)
     * @param {string} recipeInstructions - Recipe instructions text
     * @param {string} outputDir - Output directory path
     * @param {Object} options - Additional options
     * @returns {Promise<string>} - Path to the saved MP3 file
     */
    async synthesizeAndSaveFile(recipeTitle, recipeInstructions, outputDir, options = {}) {
        try {
            // Ensure output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Generate filename from recipe title (sanitized)
            const sanitizedTitle = recipeTitle
                .replace(/[^a-zA-Z0-9-_]/g, '_')
                .substring(0, 50)
                .toLowerCase();

            const timestamp = Date.now();
            const filename = `${sanitizedTitle}_${timestamp}.mp3`;
            const filePath = path.join(outputDir, filename);

            // Synthesize speech
            const audioContent = await this.synthesizeSpeech(recipeInstructions, options);

            // Write audio content to file
            fs.writeFileSync(filePath, audioContent, 'binary');

            console.log(`Audio file saved: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error('Error saving audio file:', error);
            throw new Error(`Failed to save audio file: ${error.message}`);
        }
    }

    /**
     * Prepare recipe instructions text from an array of instruction strings
     * @param {string[]} instructionsArray - Array of instruction strings
     * @returns {string} - Concatenated and formatted instructions
     */
    formatInstructionsForSpeech(instructionsArray) {
        if (!Array.isArray(instructionsArray) || instructionsArray.length === 0) {
            throw new Error('Instructions must be a non-empty array');
        }

        // Join instructions with appropriate pauses
        return instructionsArray
            .map((instruction, index) => `Step ${index + 1}: ${instruction}`)
            .join('. ');
    }
}

module.exports = new TTSService();
