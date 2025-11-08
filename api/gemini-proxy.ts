// File: /api/gemini-proxy.ts
import { GoogleGenAI, Modality } from "@google/genai";
import type { Chapter } from "../types";

// This config is specific to Vercel for running on the edge for performance.
export const config = {
  runtime: 'edge',
};

// This is the main serverless function that will handle all incoming requests.
export default async function handler(req: Request) {
    // We only accept POST requests.
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        // Initialize the Gemini AI client safely on the server, using the API key from environment variables.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const body = await req.json();
        const { type } = body;

        // Use a switch statement to handle different types of requests from the frontend.
        switch (type) {
            // Case for generating an image.
            case 'generateImage': {
                const { prompt } = body;
                if (!prompt) return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE] },
                });

                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                        return new Response(JSON.stringify({ imageUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    }
                }
                throw new Error("No image data found in Gemini response");
            }

            // Case for generating the next chapter of the story.
            case 'generateNextChapter': {
                const { history } = body;
                if (!history) return new Response(JSON.stringify({ error: 'History is required' }), { status: 400 });

                const storyContext = history.map((turn: { chapter: Chapter, choice: string }) => 
                    `Previous Chapter: "${turn.chapter.title}"\nScene: ${turn.chapter.scene}\nDialogue: ${turn.chapter.dialogue}\nPlayer's Choice: "${turn.choice}"`
                ).join('\n\n---\n\n');

                const prompt = `You are an expert interactive horror story writer in Arabic. Based on the story history and the player's last choice, create the next chapter. It must be terrifying and continue the narrative.
            
                Story context so far:
                ${storyContext}
    
                IMPORTANT:
                1. Gradually increase the horror and mystery.
                2. Make the choices meaningful and impactful.
                3. If the story is reaching a conclusion, make the 'choices' array empty.
                4. The response MUST be a valid JSON object only, with no extra text or markdown formatting. The object must contain these exact keys: "title" (string), "scene" (string), "dialogue" (string), "imagePrompt" (string in English), "choices" (array of strings).
                `;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: "application/json" }
                });

                return new Response(response.text, { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            // Case for generating audio narration.
            case 'generateSpeech': {
                const { scene, dialogue } = body;
                if (!scene && !dialogue) return new Response(JSON.stringify({ error: 'Scene or dialogue is required' }), { status: 400 });

                const textToNarrate = dialogue ? `${scene}\n\n${dialogue}` : scene;
                
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: `Narrate this text with a mysterious and calm horror storyteller voice: "${textToNarrate}"` }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    },
                });
                const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!base64Audio) throw new Error("No audio data found in Gemini response");
                return new Response(JSON.stringify({ base64Audio }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
                
            default:
                return new Response(JSON.stringify({ error: 'Invalid request type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (error) {
        console.error("Error in Gemini proxy:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
