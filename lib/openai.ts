import OpenAI from "openai";

/**
 * Server-side OpenAI client utility for SkillSwap.
 * NEVER expose OPENAI_API_KEY to the client-side.
 */
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return null;
  }

  return new OpenAI({
    apiKey: apiKey.trim(),
  });
}