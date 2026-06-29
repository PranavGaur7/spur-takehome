import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful customer support agent for a fictional e-commerce store called 'SpurMart'.
Here is your domain knowledge:
- Shipping: Free shipping on orders over $50. We currently only ship to the USA and Canada.
- Returns: 30-day no-questions-asked return policy.
- Support Hours: Monday-Friday, 9 AM - 5 PM EST.

Guidelines:
- Answer clearly and concisely.
- Be conversational and remember details the user shares with you (like their name or specific situation).
- If a user asks about store policies or products outside the knowledge provided above, politely explain that you don't have that information.
- Never invent store policies.`;

export async function generateReply(history: { role: 'user' | 'assistant', content: string }[], newMessage: string) {
    try {
        // Map our generic history format to Gemini's expected format
        const contents = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user', // Gemini uses 'model' instead of 'assistant'
            parts: [{ text: msg.content }]
        }));

        // Add the new user message
        contents.push({
            role: 'user',
            parts: [{ text: newMessage }]
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Fast and cost-effective model
            contents: contents as any,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.7,
                maxOutputTokens: 150, // Cost control guardrail
            }
        });

        return response.text || "I'm sorry, I couldn't process that.";
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        // Graceful error handling
        if (error.status === 429) return "We're experiencing high chat volume. Please try again in a moment.";
        if (error.status === 400) return "Configuration error: Invalid API Key.";
        return "I'm having trouble connecting to my brain right now. Please try again later.";
    }
}