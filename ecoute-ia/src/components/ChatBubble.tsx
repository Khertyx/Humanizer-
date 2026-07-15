import type { ChatMessage } from "../types";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const time = new Date(message.createdAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isUser
            ? "bg-brand-500 text-white rounded-br-sm"
            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <span className={`mt-1 block text-[10px] ${isUser ? "text-brand-100" : "text-slate-400"}`}>
          {time}
        </span>
      </div>
    </div>
  );
}
