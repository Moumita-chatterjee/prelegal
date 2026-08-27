"use client";

import { FormEvent, useState } from "react";
import { sendDocumentChatMessage } from "@/lib/documents/chat";
import { ChatMessage, DocumentFieldValues } from "@/lib/documents/types";

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "Hi! What kind of legal document can I help you put together today?",
};

export interface DocumentChatTurn {
  documentType: string | null;
  fields: DocumentFieldValues | null;
  messages: ChatMessage[];
}

interface DocumentChatProps {
  documentType: string | null;
  initialMessages?: ChatMessage[];
  onTurnComplete: (turn: DocumentChatTurn) => void;
}

export default function DocumentChat({ documentType, initialMessages, onTurnComplete }: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? [INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);
    try {
      const response = await sendDocumentChatMessage(nextMessages, documentType);
      const withReply = [...nextMessages, { role: "assistant" as const, content: response.reply }];
      setMessages(withReply);
      onTurnComplete({ documentType: response.documentType, fields: response.fields, messages: withReply });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border border-slate-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" role="log">
        {messages.map((message, index) => (
          <div key={index} className={message.role === "user" ? "text-right" : "text-left"}>
            <span
              className={
                "inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-sm " +
                (message.role === "user" ? "bg-[#209dd7] text-white" : "bg-slate-100 text-slate-800")
              }
            >
              {message.content}
            </span>
          </div>
        ))}
        {isSending && <p className="text-sm text-slate-400">Thinking...</p>}
      </div>

      {error && <p className="px-4 pb-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f2e75] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
