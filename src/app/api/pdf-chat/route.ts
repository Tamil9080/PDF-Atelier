import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type RequestMessage = {
  role: "user" | "assistant";
  text: string;
};

type ChatPayload = {
  prompt?: string;
  fileName?: string;
  history?: RequestMessage[];
  pdfContext?: string;
};

type ProviderType = "groq" | "huggingface" | "openrouter";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const HUGGINGFACE_URL = "https://api-inference.huggingface.co/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_PROVIDER: ProviderType = "groq";
const PROVIDER_PRIORITY: ProviderType[] = ["groq", "huggingface", "openrouter"];
const MAX_SERVER_PDF_CONTEXT_CHARS = parseInt(process.env.MAX_SERVER_PDF_CONTEXT_CHARS || "24000", 10);
const DEFAULT_MODELS = {
  groq: "llama-3.1-8b-instant",
  huggingface: "mistralai/Mistral-7B-Instruct-v0.1",
  openrouter: "openai/gpt-4o-mini",
};

function getProviderConfig(provider: ProviderType) {
  let apiKey = "";
  let model = "";
  let url = "";

  switch (provider) {
    case "groq":
      apiKey = process.env.GROQ_API_KEY || "";
      model = process.env.GROQ_MODEL || DEFAULT_MODELS.groq;
      url = GROQ_URL;
      break;
    case "huggingface":
      apiKey = process.env.HUGGINGFACE_API_KEY || "";
      model = process.env.HUGGINGFACE_MODEL || DEFAULT_MODELS.huggingface;
      url = HUGGINGFACE_URL;
      break;
    case "openrouter":
      apiKey = process.env.OPENROUTER_API_KEY || "";
      model = process.env.OPENROUTER_MODEL || DEFAULT_MODELS.openrouter;
      url = OPENROUTER_URL;
      break;
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }

  if (!apiKey) {
    throw new Error(
      `API key missing for ${provider}. Set ${
        provider === "groq"
          ? "GROQ_API_KEY"
          : provider === "huggingface"
            ? "HUGGINGFACE_API_KEY"
            : "OPENROUTER_API_KEY"
      } in .env.local`
    );
  }

  return { provider, apiKey, model, url };
}

function isRateLimitError(status: number, data: unknown): boolean {
  if (status === 429) return true;
  
  const errorData = data as Record<string, unknown>;
  const message = String(errorData?.error?.message || "").toLowerCase();
  
  return message.includes("rate limit") || 
         message.includes("tokens per minute") || 
         message.includes("tpm") ||
         message.includes("quota");
}

async function tryProvider(
  provider: ProviderType,
  messages: Array<{ role: string; content: string }>,
  origin: string
) {
  const config = getProviderConfig(provider);
  
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = origin;
    headers["X-Title"] = "PDF AI Analyzer";
  }

  const upstream = await fetch(config.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.3,
    }),
  });

  const data = (await upstream.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!upstream.ok) {
    const isRateLimit = isRateLimitError(upstream.status, data);
    const errorMsg = data?.error?.message || `${provider} request failed.`;
    
    return {
      success: false,
      isRateLimit,
      status: upstream.status,
      error: errorMsg,
      provider,
    };
  }

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return {
      success: false,
      isRateLimit: false,
      status: 502,
      error: "No reply returned from model.",
      provider,
    };
  }

  return {
    success: true,
    isRateLimit: false,
    status: 200,
    reply,
    provider,
  };
}

export async function POST(request: Request) {
  let payload: ChatPayload;
  try {
    payload = (await request.json()) as ChatPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const prompt = payload.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const history = Array.isArray(payload.history) ? payload.history.slice(-8) : [];
  const rawPdfContext = payload.pdfContext?.trim() || "";
  const pdfContext = rawPdfContext.slice(0, MAX_SERVER_PDF_CONTEXT_CHARS);

  const systemPrompt = [
    "You are PDF AI Analyzer, a concise and useful assistant.",
    "Answer in clear bullet points when helpful.",
    pdfContext
      ? "Use the provided PDF context to answer. Quote or reference page markers like [Page X] when relevant."
      : "If the user asks about document content, acknowledge when exact PDF text was not provided.",
    payload.fileName ? `Current file name: ${payload.fileName}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const messages = [
    { role: "system", content: systemPrompt },
    ...(pdfContext
      ? [
          {
            role: "system" as const,
            content: `PDF context (may be truncated):\n${pdfContext}`,
          },
        ]
      : []),
    ...history.map((msg) => ({ role: msg.role, content: msg.text })),
    { role: "user", content: prompt },
  ];

  const origin = request.headers.get("origin") || "http://localhost:3000";

  // Try providers in order, with fallback for rate limits
  const errors = [];
  
  for (const provider of PROVIDER_PRIORITY) {
    try {
      const result = await tryProvider(provider, messages, origin);
      
      if (result.success) {
        console.log(`[PDF Chat] Used ${provider} provider`);
        return NextResponse.json({ reply: result.reply, provider: result.provider });
      }
      
      errors.push(result);
      
      // If rate limited, try next provider
      if (result.isRateLimit) {
        console.log(`[PDF Chat] ${provider} rate limited, trying next provider...`);
        continue;
      }
      
      // For other errors, try next provider too
      console.log(`[PDF Chat] ${provider} failed: ${result.error}, trying next provider...`);
      continue;
    } catch (err) {
      console.log(`[PDF Chat] ${provider} error: ${(err as Error).message}`);
      errors.push({
        success: false,
        isRateLimit: false,
        error: (err as Error).message,
        provider,
      });
      continue;
    }
  }

  // All providers failed
  const rateErrors = errors.filter(e => e.isRateLimit);
  if (rateErrors.length > 0) {
    return NextResponse.json(
      {
        error: "All AI providers are rate limited. Please try again in a moment.",
        providers_tried: errors.map(e => ({ provider: e.provider, error: e.error })),
      },
      { status: 429 }
    );
  }

  return NextResponse.json(
    {
      error: "All AI providers failed. Please try again later.",
      providers_tried: errors.map(e => ({ provider: e.provider, error: e.error })),
    },
    { status: 502 }
  );
}
