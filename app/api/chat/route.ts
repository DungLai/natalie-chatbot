import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingMessage = { role: "user" | "assistant"; content: string };
type Source = { title?: string; url: string };

const SITE_ORIGIN = "https://www.nataliesuleyman.com.au";

// Route a user question to one or more pages on nataliesuleyman.com.au.
// We always fetch at least one page; if multiple keyword groups match, we
// fetch the top-2 most relevant.
const PAGE_ROUTES: { path: string; title: string; keywords: RegExp }[] = [
  {
    path: "/contact-me",
    title: "Contact",
    keywords:
      /\b(contact|address|email|phone|office hours|social media|follow|instagram|facebook|twitter|x\.com|linkedin|youtube|tiktok|reach (out|her)|get in touch)\b/i,
  },
  {
    path: "/meet-natalie",
    title: "About Natalie",
    keywords:
      /\b(about|who is|biography|bio|background|history|career|story|meet natalie|her role|elected)\b/i,
  },
  {
    path: "/cost-of-living-support",
    title: "Cost-of-Living Support",
    keywords:
      /\b(cost of living|cost-of-living|rebate|voucher|bonus|energy bill|power bill|electricity|gas bill|concession|financial (help|support)|kinder|childcare|rent|housing|baby bundle|sanitary|tampon)\b/i,
  },
  {
    path: "/veterans",
    title: "Veterans",
    keywords:
      /\b(veteran|veterans|anzac|defence|defense|war|armed forces|service personnel|legacy)\b/i,
  },
  {
    path: "/small-business-employment",
    title: "Small Business & Employment",
    keywords:
      /\b(small business|family business|sole trader|business grant|business support|employment|jobs?|hiring|workforce|apprentice)\b/i,
  },
  {
    path: "/news",
    title: "News",
    keywords:
      /\b(news|announcement|recent|latest|update|press release|media release)\b/i,
  },
];

function pickRelevantPages(query: string): { path: string; title: string }[] {
  const matches = PAGE_ROUTES.filter((r) => r.keywords.test(query));
  if (matches.length === 0) {
    // Default: homepage + news for general questions
    return [
      { path: "/", title: "Home" },
      { path: "/news", title: "News" },
    ];
  }
  return matches.slice(0, 2).map(({ path, title }) => ({ path, title }));
}

// Fetch a page and strip it to plain readable text. Squarespace pages are
// large (~300KB HTML) but most of that is template chrome — we want the
// actual visible copy.
async function fetchAndClean(path: string): Promise<string> {
  const url = SITE_ORIGIN + path;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    // Don't let a slow fetch block the whole chat response.
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`fetch ${path} -> HTTP ${res.status}`);
  }
  const html = await res.text();
  return htmlToText(html);
}

function htmlToText(html: string): string {
  const stripped = html
    // Drop script/style/noscript/svg blocks entirely
    .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    // Block elements → newline so paragraphs survive
    .replace(/<\/(p|div|li|h[1-6]|tr|article|section|header|footer)>/gi, "\n")
    .replace(/<br\s*\/?>(?=)/gi, "\n")
    // Strip all remaining tags
    .replace(/<[^>]+>/g, " ")
    // Decode the most common HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    // Collapse whitespace within lines, then collapse blank-line runs
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  // Drop the standard Squarespace form-validation noise lines that show up
  // on every page and add nothing for the model.
  const NOISE = [
    /^must be a valid/i,
    /^value (should|must) /i,
    /^should not /i,
    /^captcha /i,
    /^form (submission|not) /i,
    /^email addresses should /i,
    /^country code /i,
    /^currency value /i,
    /^passwords should /i,
    /^please (fill out|try again|enter)/i,
    /^missing a required/i,
    /^contained an invalid/i,
    /^this is not a real date/i,
    /^all fields in/i,
    /^review the following/i,
    /^invalid form/i,
    /^reload the page/i,
  ];
  const lines = stripped
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !NOISE.some((re) => re.test(l)));

  let text = lines.join("\n");
  // Cap per page so we don't blow up the prompt with 50k characters of nav.
  if (text.length > 14000) text = text.slice(0, 14000) + "\n…[truncated]";
  return text;
}

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

  const messages = (Array.isArray(body.messages) ? body.messages : []).filter(
    (m) => typeof m.content === "string" && m.content.trim().length > 0
  );
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "No messages provided." },
      { status: 400 }
    );
  }

  // Pre-fetch relevant pages based on the latest user question.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const pagesToFetch = lastUser
    ? pickRelevantPages(lastUser.content)
    : [{ path: "/", title: "Home" }];

  const fetched: { path: string; title: string; text: string }[] = [];
  await Promise.all(
    pagesToFetch.map(async (p) => {
      try {
        const text = await fetchAndClean(p.path);
        fetched.push({ ...p, text });
      } catch (e) {
        console.warn(`[chat] fetch failed for ${p.path}:`, e);
      }
    })
  );

  // Build the augmented user turn: original question + fetched page contents
  // as inline context. The system prompt tells the model to answer using only
  // this content.
  const contextBlock =
    fetched.length > 0
      ? `\n\n---\nReference content from nataliesuleyman.com.au (use this as your sole source of information for the answer):\n\n` +
        fetched
          .map(
            (p) =>
              `[Page: ${SITE_ORIGIN}${p.path} — ${p.title}]\n${p.text}`
          )
          .join("\n\n---\n\n") +
        `\n---\n`
      : "";

  const contents = messages.map((m, i) => {
    const isLast = i === messages.length - 1 && m.role === "user";
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: isLast ? m.content + contextBlock : m.content }],
    };
  });

  const sources: Source[] = fetched.map((p) => ({
    url: SITE_ORIGIN + p.path,
    title: p.title,
  }));

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const raw = (response.text ?? "").trim();
    const reply = scrubLeakedReasoning(raw);

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
  /\baccording to the (?:provided|reference) content\b/i,
  /\bbased on the (?:provided|reference) (?:content|text|page)\b/i,
];

function scrubLeakedReasoning(text: string): string {
  if (!text) return text;
  // Normalise inline bullets ("foo. • bar • baz") onto their own lines so the
  // model's occasional single-line bullet runs render correctly in the UI.
  const normalised = text.replace(/\s*•\s+/g, "\n• ");
  const paragraphs = normalised.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const cleanedParagraphs: string[] = [];
  for (const para of paragraphs) {
    const lines = para.split("\n");
    const cleanedLines: string[] = [];
    for (const line of lines) {
      const sentences = line.split(/(?<=[.!?])\s+/);
      const kept = sentences.filter(
        (s) => !LEAK_PATTERNS.some((re) => re.test(s))
      );
      const joined = kept.join(" ").trim();
      if (joined) cleanedLines.push(joined);
    }
    const joinedPara = cleanedLines.join("\n").trim();
    if (joinedPara) cleanedParagraphs.push(joinedPara);
  }
  const cleaned = cleanedParagraphs.join("\n\n").trim();
  if (!cleaned) {
    return "I'm not able to find that on Natalie's website right now. For more information, please email us at natalie.suleyman@parliament.vic.gov.au.";
  }
  return cleaned;
}
