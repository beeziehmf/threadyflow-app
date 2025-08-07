import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedThread, AnalyzedVoice, UserVoiceSample, ImprovementSuggestion } from "../types/types.tsx";

const API_KEY = process.env.API_KEY;

/**
 * A service object to abstract away the AI generation logic.
 */
export const aiService = {
  async generateIdeas(theme: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const systemInstruction = "You are a world-class content strategist specializing in brainstorming viral content ideas for B2B brands. Your goal is to generate a list of 5 distinct, catchy, and thought-provoking thread ideas based on a given theme. Each idea should be a concise, single sentence.";
    const ideasSchema = {
        type: Type.OBJECT,
        properties: {
          ideas: { type: Type.ARRAY, description: "An array of 5 unique thread ideas.", items: { type: Type.STRING } },
        },
        required: ["ideas"],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `Generate 5 thread ideas for the theme: "${theme}"`,
            config: { systemInstruction, responseMimeType: "application/json", responseSchema: ideasSchema },
        });
        const jsonText = response.text.trim();
        const parsedResponse: { ideas: string[] } = JSON.parse(jsonText);
        return parsedResponse.ideas;
    } catch (e) {
        const baseMessage = "An error occurred while generating ideas.";
        if (e instanceof Error) {
            throw new Error(`${baseMessage} Details: ${e.message}`);
        }
        throw new Error(baseMessage);
    }
  },

  async analyzeVoice(samples: UserVoiceSample[]): Promise<AnalyzedVoice> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const systemInstruction = "You are an expert content analyst. Analyze the provided text samples to identify the dominant tone and writing style. Provide a concise summary of the voice.";
    const voiceSchema = {
        type: Type.OBJECT,
        properties: {
          tone: { type: Type.STRING, description: "The dominant tone (e.g., professional, casual, humorous, inspirational, authoritative, empathetic)." },
          style: { type: Type.STRING, description: "The dominant writing style (e.g., informative, storytelling, list-based, conversational, academic)." },
          description: { type: Type.STRING, description: "A concise, 1-2 sentence summary of the identified voice.", maxLength: 150 },
        },
        required: ["tone", "style", "description"],
    };

    const sampleText = samples.map(s => `- ${s.text}`).join('\n');
    const contents = `Analyze the following text samples to determine the user's content voice (tone and style):\n\n${sampleText}\n\nProvide the analysis in JSON format.`

    let jsonText = '';
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: contents,
            config: { systemInstruction, responseMimeType: "application/json", responseSchema: voiceSchema },
        });
        jsonText = response.text.trim();
        const parsedResponse: AnalyzedVoice = JSON.parse(jsonText);
        return parsedResponse;
    } catch (e) {
        if (jsonText) {
            console.error("Failed to parse AI response:", jsonText);
        }
        const baseMessage = "An error occurred while analyzing the voice. The AI response might not be valid JSON.";
        if (e instanceof Error) {
            throw new Error(`${baseMessage} Details: ${e.message}`);
        }
        throw new Error(baseMessage);
    }
  },

  async suggestImprovements(postText: string, improvementType: ImprovementSuggestion['type']): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    let systemInstruction = "";
    let contents = "";

    switch (improvementType) {
      case "conciseness":
        systemInstruction = "You are an expert content editor. Your goal is to make the provided text more concise while retaining its core meaning and impact. Do not add new information.";
        contents = `Make the following text more concise:\n\n${postText}`;
        break;
      case "cta":
        systemInstruction = "You are a marketing expert. Your goal is to add a strong and clear call to action (CTA) to the provided text. The CTA should be relevant and encourage user engagement.";
        contents = `Add a compelling call to action to the following text:\n\n${postText}`;
        break;
      case "tone":
        systemInstruction = "You are a content strategist. Your goal is to adjust the tone of the provided text to be more engaging and persuasive for a social media audience.";
        contents = `Adjust the tone of the following text to be more engaging and persuasive:\n\n${postText}`;
        break;
      case "seo":
        systemInstruction = "You are an SEO specialist. Your goal is to optimize the provided text for search engines by naturally incorporating relevant keywords without keyword stuffing. Focus on making it more discoverable.";
        contents = `Optimize the following text for SEO:\n\n${postText}`;
        break;
      case "other":
        systemInstruction = "You are a versatile content assistant. Improve the provided text in a general way, focusing on clarity, impact, and readability.";
        contents = `Improve the following text:\n\n${postText}`;
        break;
      default:
        throw new Error("Unknown improvement type.");
    }

    const improvedTextSchema = {
        type: Type.OBJECT,
        properties: {
          improvedText: { type: Type.STRING, description: "The improved version of the text." },
        },
        required: ["improvedText"],
    };

    let jsonText = '';
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: contents,
            config: { systemInstruction, responseMimeType: "application/json", responseSchema: improvedTextSchema },
        });
        jsonText = response.text.trim();
        const parsedResponse: { improvedText: string } = JSON.parse(jsonText);
        return parsedResponse.improvedText;
    } catch (e) {
        if (jsonText) {
            console.error("Failed to parse AI response:", jsonText);
        }
        const baseMessage = "An error occurred while suggesting improvements. The AI response might not be valid JSON.";
        if (e instanceof Error) {
            throw new Error(`${baseMessage} Details: ${e.message}`);
        }
        throw new Error(baseMessage);
    }
  },

  async generateThread(idea: string, tone: string, style: string): Promise<GeneratedThread> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const systemInstruction = `You are a world-class social media manager specializing in creating engaging, viral threads for B2B brands on platforms like Meta Threads. Your tone is ${tone}, and your style is ${style}. Generate a thread based on the user's idea.`;
    const threadSchema = {
        type: Type.OBJECT,
        properties: {
          threadTitle: { type: Type.STRING, description: "A catchy, short title for the entire thread." },
          posts: { type: Type.ARRAY, description: "An array of strings, where each string is a single, concise post in the thread. Each post should be a maximum of 280 characters.", items: { type: Type.STRING } },
          hashtags: { type: Type.ARRAY, description: "An array of 3-5 highly relevant, trending, and impactful hashtags for the thread, optimized for maximum visibility and engagement.", items: { type: Type.STRING } },
        },
        required: ["threadTitle", "posts", "hashtags"],
    };

    let jsonText = '';
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
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