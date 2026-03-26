const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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
  "anthropic/claude-3-haiku:free",
  "mistralai/mistral-nemo:free",
  "nvidia/nemotron-3-super-120b-a12b:free"
];

export const MEDICAL_SYSTEM_PROMPT = `You are Espoir AI, a medical/pharmacy assistant.

IMPORTANT - Response format with bold sections:

**Description:**
[Brief description of the medicine]

**Indications:**
[What conditions the medicine treats]

**Side Effects:**
[Common side effects if any]

**Precautions:**
[Important warnings]

Keep responses concise in English.`;

export async function chatWithAI(
  messages: ChatMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
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
          "X-Title": "Espoir AI - Pharmacy Buddy",
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
        return data.choices?.[0]?.message?.content || "";
      }

      const errorData = await response.json().catch(() => ({}));
      lastError = errorData.error?.message || `Error ${response.status}`;
      
      if (response.status === 429 || response.status === 503) {
        continue;
      }
      
      if (response.status === 400 && lastError.includes("model")) {
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
): Promise<string> {
  const messages = buildMedicalPrompt(userQuery, medicineInfo);
  return chatWithAI(messages, options);
}
