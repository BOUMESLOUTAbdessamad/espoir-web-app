const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterOptions {
  model?: string;
  apiKey?: string;
}

const FREE_MODELS = [
  "qwen/qwen3-4b:free",
  "qwen/qwen3-8b:free",
  "mistralai/mistral-nemo:free",
  "nvidia/nemotron-3-super-120b-a12b:free"
];

const GROQ_MODELS = [
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

export const MEDICAL_SYSTEM_PROMPT = `You are Avicenna, a medical/pharmacy assistant built by Espoir.

On greeting: respond warmly, introduce yourself as Avicenna, and ask how you can help.

On medical/pharmacy queries, respond ONLY in this exact format:

**Description:**
[1-2 sentences max]

**Side Effects:**
[2-3 most common side effects, comma separated]

**Precautions:**
[1 line only — most critical warning]

STRICT RULES:
- Never include Indications section
- Never exceed 200 words total
- Never cut off mid-sentence
- Use plain English, no medical jargon
- If you don't know, say so briefly`;

async function chatWithGroq(
  messages: ChatMessage[],
  options: OpenRouterOptions = {}
): Promise<{ content: string; model: string }> {
  const apiKey = options.apiKey || import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("Groq API key not configured. Add VITE_GROQ_API_KEY to .env");
  }

  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { content: data.choices?.[0]?.message?.content || "", model };
      }

      if (response.status === 429) {
        continue;
      }

      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `Error ${response.status}`;
      throw new Error(errorMsg);
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      continue;
    }
  }

  throw new Error("Groq models unavailable. Try again later.");
}

async function chatWithOpenRouter(
  messages: ChatMessage[],
  options: OpenRouterOptions = {}
): Promise<{ content: string; model: string }> {
  const apiKey = options.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured. Add VITE_OPENROUTER_API_KEY to .env");
  }

  const configuredModel = import.meta.env.VITE_OPENROUTER_MODEL;
  const modelsToTry = configuredModel ? [configuredModel, ...FREE_MODELS] : FREE_MODELS;

  let lastError = "";

  for (const model of modelsToTry) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin || "https://pharmacy-buddy.app",
          "X-Title": "Avicenna - Pharmacy Buddy",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { content: data.choices?.[0]?.message?.content || "", model };
      }

      const errorData = await response.json().catch(() => ({}));
      lastError = errorData.error?.message || `Error ${response.status}`;
      
      if (response.status === 429 || response.status === 503) {
        continue;
      }
      
      if (response.status === 400) {
        continue;
      }
      
      throw new Error(lastError);
    } catch (err) {
      if (err instanceof Error && err.message !== lastError) {
        continue;
      }
    }
  }

  throw new Error(`OpenRouter Error: ${lastError || "Free models unavailable. Try again later."}`);
}

export async function chatWithAI(
  messages: ChatMessage[],
  options: OpenRouterOptions = {}
): Promise<{ content: string; model: string }> {
  if (options.apiKey || import.meta.env.VITE_GROQ_API_KEY) {
    try {
      return await chatWithGroq(messages, options);
    } catch {
      // Fall through to OpenRouter
    }
  }

  if (options.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY) {
    try {
      return await chatWithOpenRouter(messages, options);
    } catch (err) {
      // If OpenRouter fails, try Groq as fallback
      if (import.meta.env.VITE_GROQ_API_KEY) {
        return await chatWithGroq(messages, options);
      }
      throw err;
    }
  }

  throw new Error("No API key configured. Add VITE_OPENROUTER_API_KEY or VITE_GROQ_API_KEY to .env");
}

export function buildMedicalPrompt(userQuery: string, medicineInfo?: {
  name: string;
  dci?: string;
  mark?: string;
  pharmacies?: Array<{
    name: string;
    address: string;
    available: boolean;
  }>;
  sideEffects?: string[];
}): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: "system", content: MEDICAL_SYSTEM_PROMPT }
  ];

  if (medicineInfo) {
    let context = `User is asking about: ${medicineInfo.name}`;
    if (medicineInfo.dci) context += ` (DCI: ${medicineInfo.dci})`;
    if (medicineInfo.mark) context += ` (Brand: ${medicineInfo.mark})`;
    
    if (medicineInfo.pharmacies && medicineInfo.pharmacies.length > 0) {
      context += "\n\nNearby pharmacies found:";
      medicineInfo.pharmacies.forEach((p, i) => {
        context += `\n${i + 1}. ${p.name} - ${p.address} (${p.available ? "Available" : "Unavailable"})`;
      });
    }

    if (medicineInfo.sideEffects && medicineInfo.sideEffects.length > 0) {
      context += `\n\nCommon side effects: ${medicineInfo.sideEffects.join(", ")}`;
    }

    messages.push({ role: "user", content: context });
    messages.push({ role: "assistant", content: "I've found the medicine information. Here's what I can share:" });
  }

  messages.push({ role: "user", content: userQuery });
  return messages;
}

export async function getAIResponse(
  userQuery: string,
  medicineInfo?: {
    name: string;
    dci?: string;
    mark?: string;
    pharmacies?: Array<{
      name: string;
      address: string;
      available: boolean;
    }>;
    sideEffects?: string[];
  },
  options?: OpenRouterOptions
): Promise<{ content: string; model: string }> {
  const messages = buildMedicalPrompt(userQuery, medicineInfo);
  return chatWithAI(messages, options);
}
