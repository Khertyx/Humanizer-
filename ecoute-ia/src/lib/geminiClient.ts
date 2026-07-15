// Client Gemini pour le MVP frontend-seul.
//
// IMPORTANT (voir docs/DESIGN.md 1.3) : en production, cet appel doit être
// fait côté serveur pour ne jamais exposer la clé API dans le bundle client.
// Ce client reste volontairement isolé dans ce seul fichier pour rendre
// cette migration simple.
//
// Fiabilité : si aucune clé n'est configurée, ou si l'appel réseau échoue,
// on bascule sur une génération locale de secours (`localFallbackReply`)
// pour que le chat reste toujours utilisable en démonstration.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MODEL = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || "gemini-2.5-flash";

export interface GeminiTurn {
  role: "user" | "model";
  text: string;
}

export async function generateCoachReply(
  systemPrompt: string,
  history: GeminiTurn[],
  latestUserMessage: string
): Promise<string> {
  if (!API_KEY) {
    return localFallbackReply(latestUserMessage);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    const contents = [
      ...history.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      { role: "user", parts: [{ text: latestUserMessage }] },
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 500 },
      }),
    });

    if (!response.ok) {
      return localFallbackReply(latestUserMessage);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim().length > 0
      ? text.trim()
      : localFallbackReply(latestUserMessage);
  } catch {
    return localFallbackReply(latestUserMessage);
  }
}

// Génération de secours, entièrement locale : une écoute active minimale,
// jamais un vide. Ne remplace pas le moteur Gemini, sert uniquement de
// filet de fiabilité pour que l'app reste démontrable sans clé API.
function localFallbackReply(userMessage: string): string {
  const trimmed = userMessage.trim();
  const openers = [
    "Merci de me confier ça.",
    "Je t'écoute.",
    "D'accord, je comprends.",
  ];
  const opener = openers[trimmed.length % openers.length];
  return `${opener} Peux-tu m'en dire un peu plus sur ce qui te pèse le plus en ce moment, dans ce que tu viens de partager ?`;
}

export function isGeminiConfigured(): boolean {
  return Boolean(API_KEY);
}
