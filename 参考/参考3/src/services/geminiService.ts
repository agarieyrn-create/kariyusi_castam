import React from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { AIProposal, DesignConfig } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateProposals(config: Partial<DesignConfig>): Promise<AIProposal[]> {
  const prompt = `
    Create 3 unique design proposals for a Kariyushi wear (Okinawan shirts).
    Purpose: ${config.purpose}
    Desired Vibe: ${config.vibe}
    Base Color Preference: ${config.baseColor}
    Motifs to include: ${config.motifs?.join(', ')}

    Return the proposals in a JSON format.
    Each proposal should have:
    - id (short unique string)
    - name (catchy Japanese name)
    - description (detailed explanation of the design concept in Japanese)
    - color (Hex code)
    - motifs (list of motifs used)
    - imagePrompt (A detailed visual description for an image generator, focusing on pattern, texture, and mood)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              color: { type: Type.STRING },
              motifs: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              imagePrompt: { type: Type.STRING }
            },
            required: ['id', 'name', 'description', 'color', 'motifs', 'imagePrompt']
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('No response from AI');
    return JSON.parse(text);
  } catch (error) {
    console.error('Error generating proposals:', error);
    // Fallback data
    return [
      {
        id: 'prop-1',
        name: '琉球の風 (Ryukyu Breeze)',
        description: '伝統的なミンサー織の模様を現代的にアレンジした、落ち着いたデザイン。',
        color: config.baseColor || '#0047AB',
        motifs: ['Minsar', 'Waves'],
        imagePrompt: 'Traditional Okinawan Minsar pattern with modern aesthetic, deep ocean blue background, elegant fabric texture.'
      },
      {
        id: 'prop-2',
        name: 'サンセット・ハイビスカス',
        description: '鮮やかな夕日をイメージした配色に、大胆なハイビスカスを配置。',
        color: '#FF4500',
        motifs: ['Hibiscus', 'Palm Leaves'],
        imagePrompt: 'Bold sunset orange background with large hibiscus and palm leaf patterns, vibrant and tropical.'
      },
      {
        id: 'prop-3',
        name: 'モダン・シーサー',
        description: '守り神のシーサーを幾何学的に表現した、都会的なスタイル。',
        color: '#2F4F4F',
        motifs: ['Shisa', 'Geometry'],
        imagePrompt: 'Stylized geometric Shisa lion graphics, dark slate gray background, minimalist and sophisticated pattern.'
      }
    ];
  }
}
