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
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ urlContext: {} }, { googleSearch: {} }],
      },
    });

    const reply = (response.text ?? "").trim();
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
