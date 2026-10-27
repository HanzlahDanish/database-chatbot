
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "./lib/supabase";

type Rule = {
  intent: string;
  keywords: string;
  reply: string;
};

type Message = {
  id: number;
  sender: "user" | "bot";
  text: string;
};

export default function Home() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Assalam-o-Alaikum! Welcome to UOS Helpdesk Bot. Ask me about admissions, fees, scholarships, hostels, exams, or university services.",
    },
  ]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [databaseError, setDatabaseError] = useState("");
  const [sending, setSending] = useState(false);
  const nextId = useRef(2);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadRules() {
      const { data, error } = await supabase
        .from("rules")
        .select("intent, keywords, reply");

     if (error) {
  console.error("Supabase error:", error);
  setDatabaseError(`Supabase error: ${error.message} (Code: ${error.code})`);
} else {
  setRules((data ?? []) as Rule[]);
  setDatabaseError("");
}

      setLoadingRules(false);
    }

    void loadRules();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function findAnswer(question: string): string {
    const normalizedQuestion = question.toLowerCase().trim();

    const rankedRules = rules
      .map((rule) => {
        const keywords = rule.keywords
          .split(",")
          .map((keyword) => keyword.trim().toLowerCase())
          .filter(Boolean);

        const matchedKeywords = keywords.filter((keyword) =>
          normalizedQuestion.includes(keyword)
        );

        return { rule, matchedKeywords };
      })
      .filter((item) => item.matchedKeywords.length > 0)
      .sort(
        (a, b) =>
          b.matchedKeywords.reduce((score, keyword) => score + keyword.length, 0) -
          a.matchedKeywords.reduce((score, keyword) => score + keyword.length, 0)
      );

    if (rankedRules.length > 0) {
      return rankedRules[0].rule.reply;
    }

    return "Sorry, I could not find a matching answer. Please try different keywords or contact the relevant University of Sargodha office for confirmation.";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = input.trim();
    if (!question || sending) return;

    if (loadingRules) {
      setDatabaseError("Please wait while helpdesk answers are loading.");
      return;
    }

    if (databaseError || rules.length === 0) {
      setDatabaseError(
        "The helpdesk database is unavailable. Please check your connection and try again."
      );
      return;
    }

    const userMessage: Message = {
      id: nextId.current++,
      sender: "user",
      text: question,
    };

    const botMessage: Message = {
      id: nextId.current++,
      sender: "bot",
      text: findAnswer(question),
    };

    setMessages((current) => [...current, userMessage, botMessage]);
    setInput("");
    setSending(false);
  }

  const suggestions = [
    "How can I apply for admission?",
    "Tell me about scholarships",
    "How do I get my roll number slip?",
    "What hostel facilities are available?",
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto flex min-h-[85vh] max-w-5xl flex-col">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          
<div className="flex items-center gap-4">
  <Image
    src="/uos-logo.png"
    alt="University of Sargodha logo"
    width={64}
    height={64}
    className="h-14 w-14 shrink-0 object-contain"
    priority
  />

  <div>
    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
      University of Sargodha
    </p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
      UOS Helpdesk Bot
    </h1>
    <p className="mt-2 text-sm text-slate-400">
      Student support, made simpler.
    </p>
  </div>
</div>


          <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Database-powered
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="flex min-h-[560px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20">
            <div className="border-b border-slate-800 px-5 py-4">
              <h2 className="font-semibold">Chat with Helpdesk</h2>
              <p className="mt-1 text-xs text-slate-400">
                Ask a question in your own words.
              </p>
            </div>

            <div
              className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"
              aria-live="polite"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[88%]">
                    <p
                      className={`mb-1 text-xs ${
                        message.sender === "user"
                          ? "text-right text-cyan-300"
                          : "text-slate-400"
                      }`}
                    >
                      {message.sender === "user" ? "You" : "UOS Helpdesk"}
                    </p>
                    <div
                      className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${
                        message.sender === "user"
                          ? "rounded-br-md bg-cyan-500 text-slate-950"
                          : "rounded-bl-md border border-slate-700 bg-slate-800 text-slate-200"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {databaseError && (
              <p className="px-5 pb-2 text-sm text-amber-300" role="status">
                {databaseError}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-800 bg-slate-900 p-4 sm:p-5"
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your question..."
                  aria-label="Your question"
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loadingRules || sending}
                  className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Answers are retrieved from the helpdesk rules stored in Supabase.
              </p>
            </form>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="font-semibold">Try asking</h2>
              <div className="mt-4 space-y-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-left text-sm text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Knowledge base</p>
              <p className="mt-2 text-3xl font-bold text-cyan-400">
                {loadingRules ? "…" : rules.length}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Answer rules loaded from the database
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <h2 className="font-semibold text-cyan-300">Project features</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                <li>• Supabase database storage</li>
                <li>• Keyword-based matching</li>
                <li>• Responsive chat interface</li>
                <li>• No AI API required</li>
                <li>• Read-only database access</li>
              </ul>
            </div>
          </aside>
        </section>

        <footer className="mt-8 border-t border-slate-800 pt-5 text-center text-xs text-slate-500">
          UOS Helpdesk Bot · Student support project
        </footer>
      </div>
    </main>
  );
}
