import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingMessage = { role: "user" | "assistant"; content: string };

type Source = { title?: string; url: string };

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: { messages?: IncomingMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "No messages provided." },
      { status: 400 }
    );
  }

  // Map our chat history into Gemini's content format. Gemini uses "model"
  // for assistant turns; "user" is unchanged.
  const contents = messages
    .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ urlContext: {} }, { googleSearch: {} }],
        // Note: gemini-2.5-pro requires thinking to be enabled; do not set
        // thinkingBudget: 0 here. Pro's tool-use leakage is much rarer than
        // Flash, but we still keep the server-side scrub below as a backstop.
      },
    });

    const raw = (response.text ?? "").trim();
    const reply = scrubLeakedReasoning(raw);
    const sources = extractSources(response);

    return NextResponse.json({ reply, sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: `Assistant request failed: ${message}` },
      { status: 502 }
    );
  }
}

// Strip sentences/lines where the model narrates its tool-use process or
// failures instead of just answering the user. Belt-and-braces alongside the
// system-prompt rules, since Gemini sometimes leaks reasoning anyway.
const LEAK_PATTERNS: RegExp[] = [
  /\bi['’]?ll fall back\b/i,
  /\bfall(?:ing)? back to\b/i,
  /\bi['’]?ll try (?:again|using)\b/i,
  /\bi will try again\b/i,
  /\bi['’]?ll use\b.*\b(google[_ ]?search|url[_ ]?context)\b/i,
  /\bi will (?:now )?use\b.*\b(general knowledge|knowledge base|google[_ ]?search|url[_ ]?context)\b/i,
  /\bi apologi[sz]e[, ]/i,
  /\bbrowse(?: tool)? failed\b/i,
  /\bwebsite browse failed\b/i,
  /\bthe (?:browse|fetch) (?:tool|call)\b/i,
  /\bno content (?:was|has been) returned\b/i,
  /\bplease try again\b/i,
  /\bdouble[- ]check that the provided url\b/i,
  /\bfix the error\b/i,
  /\b(url_context|google_search)\b/i,
  /\brestricted to nataliesuleyman\.com\.au\b/i,
  /\bbased on (?:my|the) (?:general )?knowledge base\b/i,
  /\bit seems there was an issue\b/i,
];

function scrubLeakedReasoning(text: string): string {
  if (!text) return text;

  // Split on blank lines (paragraphs) and on sentence boundaries inside each.
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const cleanedParagraphs: string[] = [];

  for (const para of paragraphs) {
    // Naive sentence split on .!? followed by whitespace.
    const sentences = para.split(/(?<=[.!?])\s+/);
    const kept = sentences.filter(
      (s) => !LEAK_PATTERNS.some((re) => re.test(s))
    );
    const joined = kept.join(" ").trim();
    if (joined) cleanedParagraphs.push(joined);
  }

  const cleaned = cleanedParagraphs.join("\n\n").trim();

  if (!cleaned) {
    return "I'm not able to find that on Natalie's website right now. For help, please call the electorate office on (03) 9367 9925.";
  }
  return cleaned;
}

// Pull out grounding URLs from both url_context retrievals and Google Search
// grounding chunks, dedup by URL.
function extractSources(response: unknown): Source[] {
  const out: Source[] = [];
  const seen = new Set<string>();

  const candidates =
    (response as { candidates?: Array<Record<string, unknown>> }).candidates ??
    [];

  for (const candidate of candidates) {
    const urlContextMeta = (candidate as {
      urlContextMetadata?: { urlMetadata?: Array<Record<string, unknown>> };
    }).urlContextMetadata;
    const urlMeta = urlContextMeta?.urlMetadata ?? [];
    for (const item of urlMeta) {
      const url = (item.retrievedUrl as string) || (item.url as string);
      if (url && !seen.has(url)) {
        seen.add(url);
        out.push({ url });
      }
    }

    const groundingMeta = (candidate as {
      groundingMetadata?: {
        groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
      };
    }).groundingMetadata;
    const chunks = groundingMeta?.groundingChunks ?? [];
    for (const chunk of chunks) {
      const url = chunk.web?.uri;
      const title = chunk.web?.title;
      if (url && !seen.has(url)) {
        seen.add(url);
        out.push({ url, title });
      }
    }
  }

  return out;
}
