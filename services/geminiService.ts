
import { GoogleGenAI, Type } from "@google/genai";

// Lazy initialize Gemini only if API key is available
let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key not configured. AI features will be disabled.");
      // Return a dummy client to prevent crashes
      throw new Error("Gemini API Key is required. Set GEMINI_API_KEY environment variable.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export const generateDraft = async (prompt: string, tone: string = 'professional'): Promise<string> => {
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Draft a WhatsApp message for the following context: "${prompt}". The tone should be ${tone}. Keep it concise and suitable for instant messaging.`,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });
    return response.text || "Failed to generate draft.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI draft.";
  }
};

export const checkCompliance = async (message: string): Promise<{ compliant: boolean; feedback: string }> => {
  try {
    // Fix: Using responseSchema and Type to ensure structured JSON output for compliance checks
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this WhatsApp message for compliance with Business Messaging Policies (anti-spam, professional tone, no prohibited content): "${message}".`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            compliant: {
              type: Type.BOOLEAN,
              description: 'Whether the message is compliant with policies.',
            },
            feedback: {
              type: Type.STRING,
              description: 'Feedback or reasons for the compliance status.',
            },
          },
          required: ["compliant", "feedback"],
        },
      }
    });
    return JSON.parse(response.text || '{"compliant": true, "feedback": "OK"}');
  } catch (error) {
    console.error("Gemini Compliance Error:", error);
    return { compliant: true, feedback: "Unable to verify compliance." };
  }
};

export const analyzeHealth = async (stats: any): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these WhatsApp bridge stats and provide a 1-sentence executive health summary: ${JSON.stringify(stats)}`,
    });
    return response.text || "System healthy.";
  } catch (error) {
    console.error("Gemini Health Analysis Error:", error);
    return "Monitoring operational.";
  }
};
