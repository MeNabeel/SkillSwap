import { GoogleGenAI } from "@google/genai";

/**
 * Single server-side configuration location for Gemini Model
 * Prioritizes fast, efficient text generation for SkillSwap conversational assistant.
 */
export const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Server-side Google Gemini client utility for SkillSwap.
 * NEVER expose GEMINI_API_KEY to browser client components.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return null;
  }

  return new GoogleGenAI({
    apiKey: apiKey.trim(),
  });
}
