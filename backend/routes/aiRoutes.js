const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const protect = require('../middleware/authMiddleware');
const router = express.Router();

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey && process.env.NODE_ENV !== 'test') {
    console.error('SERVER ERROR: GEMINI_API_KEY is not set in environment variables! AI features will not work.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey || 'dummy_api_key_for_initialization');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

router.post('/chat', protect, async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    try {
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();
        res.json({ reply: text });
    } catch (error) {
        console.error('Error calling Gemini API for general chat:', error);
        res.status(500).json({ error: 'Failed to get a response from the AI assistant.', details: error.message });
    }
});

router.post('/journal-insights', protect, async (req, res) => {
    const { journalEntryContent } = req.body;

    if (!journalEntryContent) {
        return res.status(400).json({ error: 'Journal entry content is required for insights.' });
    }

    try {
        const prompt = `
            You are a helpful AI assistant acting as a Senior Developer and Tech Mentor. Your task is to analyze a developer's journal entry and provide structured feedback.

            **Your response MUST be a single, valid, minified JSON object and nothing else. Do not wrap it in markdown backticks (e.g., \`\`\`json). Do not add any text before or after the JSON object.**

            The JSON object must conform to this exact structure:
            {
              "sentiment": "Positive" | "Neutral" | "Negative" | "Mixed",
              "key_themes": ["Theme 1", "Theme 2"],
              "positive_reinforcement": "A brief, encouraging statement about a specific accomplishment or good practice mentioned in the entry.",
              "actionable_advice": [
                "A concrete, specific, and practical piece of technical or professional advice.",
                "Another clear, actionable step."
              ],
              "resource_recommendations": [
                {
                  "type": "Article" | "Video" | "Book" | "Course" | "Documentation",
                  "title": "Specific Title of the Resource",
                  "description": "A short sentence explaining why this resource is relevant to the journal entry."
                }
              ]
            }

            **If the entry is too short or vague:** Return a JSON object where "sentiment" is "Neutral" and "actionable_advice" contains a single item: "To receive more detailed insights, try writing about a specific challenge you faced or a new concept you learned today."

            **Journal Entry to Analyze:**
            ---
            ${journalEntryContent}
            ---
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/;
        const match = text.match(jsonRegex);
        if (match && match[1]) {
          text = match[1];
        }

        try {
            const insightsJson = JSON.parse(text);
            res.json({ insights: insightsJson });
        } catch (parseError) {
            console.error('Error parsing JSON from Gemini response after cleaning. Raw text:', text);
            res.json({ insights: { error: 'The AI returned an invalid response. Please try again.' } });
        }

    } catch (error) {
        console.error('Error calling Gemini API for journal insights:', error);
        res.status(500).json({ error: 'Failed to generate insights from the AI.', details: error.message });
    }
});

module.exports = router;
