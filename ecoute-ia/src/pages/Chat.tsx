import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../state/store";
import { ChatBubble } from "../components/ChatBubble";
import { Avatar } from "../components/Avatar";
import { CrisisModal } from "../components/CrisisModal";
import { detectCrisis } from "../lib/crisisDetection";
import { buildSystemPrompt } from "../lib/systemPrompts";
import { generateCoachReply, isGeminiConfigured } from "../lib/geminiClient";
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported, speak, startListening, stopSpeaking } from "../lib/speech";
import type { ChatMessage } from "../types";

const STOP_TOPIC_PATTERN = /n'en\s+parlons?\s+plus|n'en\s+parle\s+plus|arr[êe]tons?\s+d'en\s+parler/i;

export function Chat() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const closeTopic = useStore((s) => s.closeTopic);

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"texte" | "vocal">("texte");
  const [listening, setListening] = useState(false);
  const [sending, setSending] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [vigilanceNotice, setVigilanceNotice] = useState(false);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!profile) navigate("/onboarding");
  }, [profile, navigate]);

  if (!profile) return null;

  async function handleSend(rawText: string) {
    const text = rawText.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    // Couche de détection de crise : exécutée sur CHAQUE message, avant même
    // de solliciter la génération de réponse. Voir docs/DESIGN.md section 4.
    const crisis = detectCrisis(text);

    if (STOP_TOPIC_PATTERN.test(text)) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMessage) closeTopic(lastUserMessage.text);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
      crisisLevel: crisis.level,
    };
    addMessage(userMessage);

    if (crisis.level === "rouge") {
      // Interruption immédiate : on n'appelle pas Gemini, priorité absolue
      // au protocole de sécurité.
      setCrisisOpen(true);
      setSending(false);
      return;
    }

    if (crisis.level === "orange") {
      setVigilanceNotice(true);
    }

    const closedTopicsNote = profile!.closedTopics.length
      ? `Sujets que l'utilisateur a demandé de ne plus aborder : ${profile!.closedTopics.join(", ")}.`
      : "";
    const vigilanceNote =
      crisis.level === "orange"
        ? "Signal de vigilance détecté par la couche de sécurité (niveau orange) : adopte un ton particulièrement attentif et doux, sans dramatiser, et propose en douceur l'annuaire de professionnels si pertinent."
        : "";
    const contextSummary = [closedTopicsNote, vigilanceNote].filter(Boolean).join("\n");

    const systemPrompt = buildSystemPrompt(profile!, contextSummary);
    const history = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: (m.role === "coach" ? "model" : "user") as "model" | "user", text: m.text }));

    const replyText = await generateCoachReply(systemPrompt, history, text);

    const coachMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "coach",
      text: replyText,
      createdAt: new Date().toISOString(),
    };
    addMessage(coachMessage);
    setSending(false);

    if (mode === "vocal") speak(replyText, profile!.coachGender);
  }

  function toggleListening() {
    if (listening) {
      stopListeningRef.current?.();
      setListening(false);
      return;
    }
    const stop = startListening(
      (text, isFinal) => {
        setInput(text);
        if (isFinal) {
          setListening(false);
          handleSend(text);
        }
      },
      () => setListening(false)
    );
    if (stop) {
      stopListeningRef.current = stop;
      setListening(true);
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col pb-20">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <Avatar gender={profile.coachGender} size={40} />
        <div className="flex-1">
          <p className="font-medium">{profile.coachName}</p>
          <p className="text-xs text-slate-400">
            {isGeminiConfigured() ? "Coach de bien-être IA" : "Coach de bien-être IA · mode démo"}
          </p>
        </div>
        <button
          onClick={() => setMode(mode === "texte" ? "vocal" : "texte")}
          className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-slate-800 dark:text-brand-300"
        >
          {mode === "texte" ? "🎙 Passer en vocal" : "⌨️ Passer en texte"}
        </button>
      </header>

      <p className="border-b border-slate-100 bg-brand-50/60 px-4 py-1.5 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
        Ce service ne remplace pas un suivi médical ou psychologique professionnel.
      </p>

      {vigilanceNotice && (
        <div className="mx-4 mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
          Si tu en ressens le besoin, le <strong>3114</strong> (prévention du
          suicide, gratuit, 24/7) t'écoute aussi.
          <button onClick={() => setVigilanceNotice(false)} className="ml-2 underline">
            fermer
          </button>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400">Dis bonjour pour commencer.</p>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {sending && <p className="text-xs text-slate-400">{profile.coachName} écrit...</p>}
        <div ref={scrollRef} />
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          {mode === "vocal" && isSpeechRecognitionSupported() ? (
            <button
              onClick={toggleListening}
              className={`flex-1 rounded-xl py-3 text-sm font-medium text-white ${
                listening ? "bg-red-500" : "bg-brand-500"
              }`}
            >
              {listening ? "🔴 Écoute en cours... (appuie pour arrêter)" : "🎙 Appuie pour parler"}
            </button>
          ) : (
            <>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                placeholder="Écris ton message..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={sending || !input.trim()}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Envoyer
              </button>
            </>
          )}
        </div>
        {mode === "vocal" && !isSpeechRecognitionSupported() && (
          <p className="mt-1 text-xs text-slate-400">
            La reconnaissance vocale n'est pas prise en charge par ce
            navigateur — utilise le mode texte.
          </p>
        )}
        {mode === "vocal" && !isSpeechSynthesisSupported() && (
          <p className="mt-1 text-xs text-slate-400">La synthèse vocale n'est pas disponible sur ce navigateur.</p>
        )}
      </div>

      {crisisOpen && (
        <CrisisModal
          trustedContact={profile.trustedContact}
          onClose={() => {
            setCrisisOpen(false);
            stopSpeaking();
          }}
        />
      )}
    </div>
  );
}
