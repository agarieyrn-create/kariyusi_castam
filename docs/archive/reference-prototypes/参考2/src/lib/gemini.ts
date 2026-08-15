import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DesignProposal {
  imageUrl: string;
  description: string;
  features: string[];
}

export async function generateDesignProposals(conditions: {
  purpose: string;
  impression: string;
  baseColor: string;
  motif: string;
}): Promise<DesignProposal[]> {
  const prompt = `
    Kariyushi wear design proposal generator.
    Conditions:
    - Purpose: ${conditions.purpose}
    - Impression: ${conditions.impression}
    - Base Color: ${conditions.baseColor}
    - Motif: ${conditions.motif}

    Generate 3 distinct kariyushi wear design concepts.
    For each concept, provide a detailed visual description that can be used to imagine the shirt.
    Return the response in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            features: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["description", "features"]
        }
      }
    }
  });

  const proposals = JSON.parse(response.text || "[]");
  
  // In a real app, we would use an image generation model here to get actual URLs.
  // For this prototype, we'll generate placeholder prompts for imaging.
  return proposals.map((p: any, i: number) => ({
    ...p,
    // Using a placeholder URL with the description as a seed for variety in the prototype UI
    imageUrl: `https://picsum.photos/seed/${encodeURIComponent(p.description.slice(0, 20))}/800/1000`,
  }));
}

export async function getDesignAdvice(currentDesign: any, question: string) {
  const prompt = `
    You are an expert Kariyushi Wear designer.
    Current Design Information: ${JSON.stringify(currentDesign)}
    User Question: ${question}
    
    Provide professional advice on how to improve or refine the design.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}
