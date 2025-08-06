import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedThread } from "../types/types.tsx";

const API_KEY = process.env.API_KEY;

/**
 * A service object to abstract away the AI generation logic.
 */
export const aiService = {
  async generateThread(idea: string): Promise<GeneratedThread> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const systemInstruction = "You are a world-class social media manager specializing in creating engaging, viral threads for B2B brands on platforms like Meta Threads. Your tone is professional, insightful, and designed to capture the attention of a business audience. Generate a thread based on the user's idea.";
    const threadSchema = {
        type: Type.OBJECT,
        properties: {
          threadTitle: { type: Type.STRING, description: "A catchy, short title for the entire thread." },
          posts: { type: Type.ARRAY, description: "An array of strings, where each string is a single, concise post in the thread. Each post should be a maximum of 280 characters.", items: { type: Type.STRING } },
          hashtags: { type: Type.ARRAY, description: "An array of 3-5 relevant hashtags for the thread.", items: { type: Type.STRING } },
        },
        required: ["threadTitle", "posts", "hashtags"],
    };

    let jsonText = '';
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following idea, create a compelling thread with multiple posts. The idea is: "${idea}"`,
            config: { systemInstruction, responseMimeType: "application/json", responseSchema: threadSchema },
        });
        jsonText = response.text.trim();
        const parsedResponse: { threadTitle: string; posts: string[]; hashtags: string[] } = JSON.parse(jsonText);
        
        const threadWithIds: GeneratedThread = {
            ...parsedResponse,
            posts: parsedResponse.posts.map((postText, index) => ({ id: Date.now() + index, text: postText }))
        };
        return threadWithIds;

    } catch (e) {
        if (jsonText) {
            console.error("Failed to parse AI response:", jsonText);
        }
        // Re-throw the error to be caught by the caller
        const baseMessage = "An error occurred while generating the thread. The AI response might not be valid JSON.";
        if (e instanceof Error) {
            throw new Error(`${baseMessage} Details: ${e.message}`);
        }
        throw new Error(baseMessage);
    }
  }
};