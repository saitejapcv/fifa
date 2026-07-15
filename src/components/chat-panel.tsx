"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useApp } from "@/context/app-context";
import { Button, Input } from "./ui";

const chips = [
  "Find my seat",
  "Nearest restroom",
  "Which gate is fastest?",
  "Transit home",
  "Report incident",
];

export function ChatPanel() {
  const { chatOpen, setChatOpen, messages, sendChat, chatBusy } = useApp();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = text;
    setText("");
    await sendChat(value);
  };

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close chat backdrop"
            className="fixed inset-0 z-40 bg-claude-ink/10 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setChatOpen(false)}
          />
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-claude-border bg-claude-card shadow-lift"
            aria-label="AI assistant"
          >
            <div className="flex h-16 items-center justify-between border-b border-claude-border px-5">
              <div>
                <div className="font-serif text-lg text-claude-ink">Assistant</div>
                <div className="text-xs text-claude-ink-muted">Stadium operations</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>
                Close
              </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-claude-accent text-white"
                        : "bg-claude-surface text-claude-ink"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.cards?.map((card, i) => (
                      <div
                        key={i}
                        className="mt-3 rounded-xl border border-claude-border bg-claude-card p-3 text-claude-ink"
                      >
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-claude-ink-muted">
                          {card.title}
                        </div>
                        {card.rows?.map((row, ri) => (
                          <div
                            key={ri}
                            className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-claude-border/60 py-1.5 text-xs first:border-0"
                          >
                            {row.map((cell, ci) => (
                              <span
                                key={ci}
                                className={ci === 0 ? "text-claude-ink-muted" : ""}
                              >
                                {cell}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                    {m.source && m.role === "assistant" && (
                      <div className="mt-2 text-[10px] opacity-60">
                        via {m.source === "gemini" ? "Gemini" : "local engine"}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {chatBusy && (
                <div className="text-xs text-claude-ink-muted">Thinking…</div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-claude-border p-4">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => sendChat(c)}
                    className="rounded-full border border-claude-border bg-claude-bg px-2.5 py-1 text-[11px] text-claude-ink-secondary transition hover:border-claude-accent hover:text-claude-accent"
                  >
                    {c}
                  </button>
                ))}
              </div>
              <form onSubmit={onSubmit} className="flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ask about routes, queues, incidents…"
                  maxLength={500}
                  disabled={chatBusy}
                />
                <Button type="submit" disabled={chatBusy || !text.trim()}>
                  Send
                </Button>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
