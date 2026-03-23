import { CohereClientV2 } from 'cohere-ai';
import OpenAI from 'openai';
import config from '../config/config.js';

const cohere = new CohereClientV2({
  token: config.cohereApiKey,
});

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

async function chatWithFallback(prompt: string, model: string) {
  try {
    const response = await cohere.chat({
      model,
      messages: [{ role: 'user', content: prompt }],
    });

    if (response.message?.content?.[0]?.type === 'text') {
      return response.message.content[0].text;
    }
  } catch (error) {
    console.error('Cohere chat failed, falling back to OpenAI:', error);
  }

  const fallback = await openai.responses.create({
    model: 'gpt-4o-mini',
    input: prompt,
  });

  return fallback.output_text || null;
}

export async function chat(message: string, model: string = 'command-a-03-2025') {
  return chatWithFallback(message, model);
}

export async function chatStream(
  message: string, 
  onToken: (token: string) => void,
  model: string = 'command-a-03-2025'
) {
  const stream = await cohere.chatStream({
    model,
    messages: [{ role: 'user', content: message }],
  });

  for await (const event of stream) {
    if (event.type === 'content-delta' && event.delta?.message?.content?.text) {
      onToken(event.delta.message.content.text);
    }
  }
}

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

const SELF_ASSESSMENT_CONTENT = `I`;

export async function translateToFrench(text: string, model: string = 'command-a-03-2025') {
  const prompt = `You are a professional translator. Translate the following text into French. Provide ONLY the French translation, nothing else.

Text to translate:
${text}`;

  return chatWithFallback(prompt, model);
}

export async function translateContent(
  content: string,
  targetLanguage: string,
  model: string = 'command-a-03-2025'
) {
  const prompt = `You are a professional translator. Translate the following content into ${targetLanguage}. Maintain the same structure, formatting, and tone. Provide ONLY the translated text without any explanations.

CONTENT TO TRANSLATE:

${content}`;

  return chatWithFallback(prompt, model);
}




export async function translateContentStream(
  content: string,
  targetLanguage: string,
  onToken: (token: string) => void,
  model: string = 'command-a-03-2025'
) {
  const prompt = `You are a professional translator. Translate the following content into ${targetLanguage}. Maintain the same structure, formatting, and tone. Provide ONLY the translated text without any explanations.

CONTENT TO TRANSLATE:

${content}`;

  const stream = await cohere.chatStream({
    model,
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === 'content-delta' && event.delta?.message?.content?.text) {
      onToken(event.delta.message.content.text);
    }
  }
}

export { cohere, SELF_ASSESSMENT_CONTENT };
export default cohere;
