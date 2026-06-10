import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "@/utils/environmentUtil";

/**
 * Maximum token limit for a prompt.
 * @url - https://docs.anthropic.com/en/docs/about-claude/models
 */
const ANTHROPIC_MAX_TOKEN_INPUT = 200_000;
const ANTHROPIC_MAX_TOKEN_OUTPUT = 8192;
let anthropic: Anthropic | null = null;

/**
 * Get the Anthropic client instance
 * @returns - The Anthropic client instance
 */
export function getAnthropicClient(): Anthropic {
    if (!anthropic) {
        anthropic = new Anthropic({ apiKey: getAnthropicApiKey() });
    }
    return anthropic;
}

/**
 * Call the Anthropic LLM
 * @param prompt - The prompt to send to the LLM
 * @param model - The model to use
 * @param maxTokens - The maximum number of tokens to generate
 * @returns
 */
export async function callAnthropicLLM(
    prompt: string,
    model = "claude-3-5-sonnet-20241022",
    maxTokens = ANTHROPIC_MAX_TOKEN_OUTPUT
): Promise<any> {
    const anthropic = getAnthropicClient();
    return anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
    });
}
/**
 * Get the number of tokens in the given prompt.
 * @param prompt - The prompt to measure.
 * @param model - The Anthropic model to use for counting (default: "claude-3-5-sonnet-20241022")
 * @returns - The number of tokens consumed by the prompt.
 */
export async function getAnthropicTokenCount(
    prompt: string,
    model = "claude-3-5-sonnet-20241022"
): Promise<number> {
    const client = getAnthropicClient();
    const tokenCountRes = await client.messages.countTokens({
        model,
        // optionally add system or user role messages as needed
        messages: [{ role: "user", content: prompt }],
    });

    // The returned result typically has shape: { input_tokens: number }
    return tokenCountRes.input_tokens;
}

/**
 * Validate prompt token size before calling the Anthropic LLM.
 *
 * @param prompt - The string prompt to send.
 * @param model - The Anthropic model (default: "claude-3-5-sonnet-20241022").
 * @param maxTokensOutput - The maximum number of tokens to generate in the output (default: 1024).
 * @param maxPromptTokenLimit - Optional custom max tokens allowed for the prompt (default: 9000).
 * @returns - The completion response from Anthropic.
 * @throws - Error if the prompt token count exceeds maxPromptTokenLimit.
 */
export async function validateTokensAndCallAnthropicLLM(
    prompt: string,
    model = "claude-3-5-sonnet-20241022",
    maxTokensOutput = ANTHROPIC_MAX_TOKEN_OUTPUT,
    maxPromptTokenLimit = ANTHROPIC_MAX_TOKEN_INPUT
) {
    // validate prompt token count
    const tokenCount = await getAnthropicTokenCount(prompt, model);
    if (tokenCount > maxPromptTokenLimit) {
        throw new Error(
            `Prompt token count of ${tokenCount} exceeds limit of ${maxPromptTokenLimit}.`
        );
    }

    const client = getAnthropicClient();
    return client.messages.create({
        model,
        max_tokens: maxTokensOutput,
        messages: [{ role: "user", content: prompt }],
    });
}
