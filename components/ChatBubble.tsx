"use client";

import { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  sources?: { title?: string; url: string }[];
};

// Swap this URL to use a different avatar (or drop a file in /public and use
// a relative path like "/avatar.jpg").
const AVATAR_URL = "/avatar.jpeg";

const TOOLTIP_GREETINGS = [
  "Hi, I can help you with information about Natalie's office.",
  "Xin chào, tôi có thể hỗ trợ bạn với thông tin về văn phòng của Natalie.",
  "您好，我可以为您提供有关 Natalie 办公室的信息。",
  "안녕하세요, Natalie 사무실에 대한 정보를 안내해 드릴 수 있어요.",
];

const WELCOME_LINES = [
  "Hi, I’m Natalie Suleyman MP Office’s digital assistant. I can help with general questions and take messages. Natalie’s office team monitors enquiries where needed.",
  "Xin chào, tôi là trợ lý kỹ thuật số của Văn phòng Natalie Suleyman MP. Tôi có thể hỗ trợ các câu hỏi chung và ghi nhận lời nhắn. Đội ngũ văn phòng của Natalie sẽ theo dõi các yêu cầu khi cần.",
  "您好，我是 Natalie Suleyman MP 办公室的数字助理。我可以解答一般问题并记录留言。Natalie 的办公室团队会在需要时跟进您的咨询。",
];

const SUGGESTED = [
  "What support is there with the cost of living?",
  "How do I contact the electorate office?",
  "What is Natalie doing for small business?",
];

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Show the greeting peek shortly after mount, once per session.
  useEffect(() => {
    if (tooltipDismissed || open) return;
    const t = setTimeout(() => setShowTooltip(true), 1200);
    return () => clearTimeout(t);
  }, [tooltipDismissed, open]);

  // Rotate greeting languages while the tooltip is visible.
  useEffect(() => {
    if (!showTooltip || open) return;
    const id = setInterval(() => {
      setGreetingIndex((i) => (i + 1) % TOOLTIP_GREETINGS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [showTooltip, open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply ?? "",
          sources: data.sources ?? [],
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry — I couldn't reach the assistant just now. Please try again in a moment. (" +
            message +
            ")",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function dismissTooltip(e: React.MouseEvent) {
    e.stopPropagation();
    setShowTooltip(false);
    setTooltipDismissed(true);
  }

  return (
    <>
      {/* Launcher cluster: greeting peek + avatar */}
      <div className="fixed bottom-5 right-5 z-50 flex items-end gap-3">
        {showTooltip && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bubble-in relative max-w-[260px] rounded-2xl bg-white py-3 pl-4 pr-9 text-left text-sm leading-snug text-gray-800 shadow-xl shadow-black/25 hover:bg-gray-50"
          >
            <span key={greetingIndex} className="bubble-in block">
              {TOOLTIP_GREETINGS[greetingIndex]}
            </span>
            {/* Tail pointing toward the avatar */}
            <span className="absolute -right-1.5 bottom-5 h-3 w-3 rotate-45 bg-white shadow-[2px_-2px_4px_rgba(0,0,0,0.04)]" />
            <span
              role="button"
              aria-label="Dismiss greeting"
              onClick={dismissTooltip}
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </span>
          </button>
        )}

        <button
          type="button"
          aria-label={open ? "Close chat" : "Open chat with Natalie's assistant"}
          onClick={() => setOpen((v) => !v)}
          className="relative h-16 w-16 overflow-hidden rounded-full bg-sky-200 shadow-xl shadow-black/30 ring-4 ring-white/50 transition hover:scale-105 focus:outline-none focus:ring-sky-300"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={AVATAR_URL}
            alt="Assistant"
            className="h-full w-full object-cover"
          />
          {!open && (
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div className="bubble-in fixed bottom-24 right-5 z-50 flex h-[min(82vh,680px)] w-[min(96vw,400px)] flex-col rounded-3xl bg-white shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="relative flex items-center gap-3 rounded-t-3xl bg-[#0b0d10] px-5 py-4 text-white">
            <span className="flex h-9 w-9 overflow-hidden rounded-full bg-sky-200 ring-2 ring-white/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AVATAR_URL}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            <h2 className="text-lg font-semibold tracking-tight">
              Natalie Suleyman MP Office
            </h2>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-900 shadow-md hover:bg-gray-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div
            ref={scrollRef}
            className="chat-scroll flex-1 overflow-y-auto bg-white"
          >
            {messages.length === 0 ? (
              <WelcomeView onPick={(q) => send(q)} />
            ) : (
              <div className="space-y-3 px-4 py-4">
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-2 text-sm text-gray-500">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="rounded-b-3xl border-t border-gray-100 bg-white px-4 pb-4 pt-3">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-5 pr-1.5 focus-within:border-gray-400">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Type your message..."
                className="max-h-32 flex-1 resize-none border-0 bg-transparent py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">
              AI-generated answers may contain errors. For important details,
              email natalie.suleyman@parliament.vic.gov.au.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function WelcomeView({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-10 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center text-gray-900">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900">Welcome!</h3>
      <div className="mt-4 space-y-3 text-sm text-gray-700">
        {WELCOME_LINES.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div className="mt-8 w-full">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Try asking
        </p>
        <div className="flex flex-col gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm shadow-sm " +
          (isUser
            ? "rounded-br-sm bg-gray-900 text-white"
            : "rounded-bl-sm bg-gray-100 text-gray-800")
        }
      >
        {message.content}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 border-t border-black/10 pt-2 text-[11px] text-gray-500">
            <span className="mr-1 font-semibold uppercase tracking-wider text-gray-400">
              Sources:
            </span>
            {message.sources.slice(0, 4).map((s, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1.5 text-gray-400">·</span>}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  {s.title || s.url}
                </a>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
