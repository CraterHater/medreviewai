// backend/services/aiService.js

const OpenAI = require('openai');

/**
 * Sends a prompt to the OpenAI API and expects a JSON object in return.
 * @param {string} prompt - The fully constructed user prompt.
 * @param {string} apiKey - The user's OpenAI API key.
 * @returns {Promise<object>} The parsed JSON response from the AI.
 */
async function getJsonResponse(prompt, apiKey) {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ "role": "user", "content": prompt }],
        response_format: { type: "json_object" },
    });

    const responseString = completion.choices[0].message.content;
    try {
        return JSON.parse(responseString);
    } catch (e) {
        console.error("aiService: Failed to parse AI JSON response.", responseString);
        throw new Error("The AI returned an invalid format. Please try again.");
    }
}

/**
 * Sends a prompt to the OpenAI API and expects a text (string) response.
 * @param {string} prompt - The fully constructed user prompt.
 * @param {string} apiKey - The user's OpenAI API key.
 * @returns {Promise<string>} The generated text response from the AI.
 */
async function getTextResponse(prompt, apiKey) {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ "role": "user", "content": prompt }],
    });

    return completion.choices[0].message.content;
}

module.exports = {
    getJsonResponse,
    getTextResponse
};