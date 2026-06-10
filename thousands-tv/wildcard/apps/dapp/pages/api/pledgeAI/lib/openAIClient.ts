import { getOpenAIApiKey } from "@/utils/environmentUtil";
import OpenAI from "openai";

const MAX_INPUT_PROMPT_TOKEN_LIMIT = 128_000;
let openai: any | null = null;

/**
 * Get the OpenAI client instance
 * @returns - The OpenAI client instance
 */
export function getOpenAIClient(): OpenAI {
    if (!openai) {
        openai = new OpenAI({
            apiKey: getOpenAIApiKey(),
        });
    }
    return openai;
}

/**
 * Call the OpenAI LLM (Chat Completion)
 * @url model types - https://platform.openai.com/docs/models
 * @param prompt - The prompt to send to the LLM
 * @param model - The model to use (default: "gpt-3.5-turbo")
 * @param maxTokens - The maximum number of tokens to generate
 * @returns - The completion response from OpenAI
 */
export async function callOpenAILLM(
    prompt: string,
    model = "gpt-4o-2024-11-20",
    maxTokens = 1024
) {
    const client = getOpenAIClient();
    return await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
    });
}

/**
 * Call the OpenAI LLM for structured JSON output.
 *
 * @param prompt - The prompt that instructs the LLM to return JSON.
 * @param model - The model to use (default: "gpt-3.5-turbo-0301").
 * @param maxTokens - The maximum number of tokens to generate.
 * @dev -  This function sets temperature to 0 to help ensure deterministic
 * @returns - The completion response from OpenAI.
 */
export async function callOpenAILLMStructured(
    prompt: string,
    model = "gpt-4o-2024-11-20", // using a version suited for structured outputs
    maxTokens = MAX_INPUT_PROMPT_TOKEN_LIMIT // 40,000 tokens is the maximum allowed for structured outputs
) {
    const client = getOpenAIClient();
    return await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0, // enforce deterministic output for JSON (for AI referee use)
    });
}
