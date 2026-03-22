import { CohereClientV2 } from 'cohere-ai';
import config from '../config/config.js';
import { matchTerms, buildGlossaryPrompt } from './glossary.js';

// Initialize the Cohere client
const cohere = new CohereClientV2({
  token: config.cohereApiKey,
});

/**
 * Generate a chat response using Cohere's Command model
 * @param message - The user message to send
 * @param model - The model to use (default: command-a-03-2025)
 * @returns The assistant's response text
 */
export async function chat(message: string, model: string = 'command-a-03-2025') {
  const response = await cohere.chat({
    model,
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
  });

  return response.message?.content?.[0]?.type === 'text' 
    ? response.message.content[0].text 
    : null;
}

/**
 * Generate a chat response with streaming
 * @param message - The user message to send
 * @param onToken - Callback function called for each token
 * @param model - The model to use (default: command-a-03-2025)
 */
export async function chatStream(
  message: string, 
  onToken: (token: string) => void,
  model: string = 'command-a-03-2025'
) {
  const stream = await cohere.chatStream({
    model,
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
  });

  for await (const event of stream) {
    if (event.type === 'content-delta' && event.delta?.message?.content?.text) {
      onToken(event.delta.message.content.text);
    }
  }
}

/**
 * Generate embeddings for text
 * @param texts - Array of texts to embed
 * @param inputType - The type of input (search_document, search_query, classification, clustering)
 * @param model - The model to use (default: embed-english-v3.0)
 * @returns The embeddings
 */
export async function embed(
  texts: string[], 
  inputType: 'search_document' | 'search_query' | 'classification' | 'clustering' = 'search_document',
  model: string = 'embed-english-v3.0'
) {
  const response = await cohere.embed({
    texts,
    model,
    inputType,
    embeddingTypes: ['float'],
  });

  return response.embeddings;
}

// Self-Assessment educational content
const SELF_ASSESSMENT_CONTENT = `I`;

/**
 * Translate text to French
 */
export async function translateToFrench(
  text: string,
  model: string = 'command-a-03-2025'
) {
  return translateContent(text, 'French', model);
}

/**
 * Translate content to any target language with glossary-aware context injection.
 * Matches glossary terms in the source text and injects their definitions into
 * the system prompt so the LLM produces culturally and linguistically appropriate
 * translations rather than literal word-for-word output.
 */
export async function translateContent(
  content: string,
  targetLanguage: string,
  model: string = 'command-a-03-2025'
) {
  const matched = matchTerms(content);
  const glossaryBlock = buildGlossaryPrompt(matched);

  const systemPrompt = `You are an expert educational content translator. Your task is to translate educational material while preserving pedagogical meaning and cultural relevance.

CRITICAL RULES:
- Translate for MEANING, not word-for-word. Adapt analogies, idioms, and culturally-specific references to equivalents that resonate in the target culture and region.
- For abbreviations/acronyms: use the target language and region's established equivalent if one exists. If none exists, keep the original with a brief inline explanation on first use.
- Maintain the same educational register and tone.
- Preserve all formatting, structure, and markup.
- Provide ONLY the translated text without any explanations or commentary.

${glossaryBlock}`.trim();

  const response = await cohere.chat({
    model,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Translate the following into ${targetLanguage}:\n\n${content}`,
      },
    ],
  });

  return response.message?.content?.[0]?.type === 'text'
    ? response.message.content[0].text
    : null;
}

export { cohere, SELF_ASSESSMENT_CONTENT };
export default cohere;
