import { useState } from "react";
import { BreathingTimer } from "../components/BreathingTimer";
import { Grounding } from "../components/Grounding";

const JOURNAL_PROMPTS = [
  "Qu'est-ce qui s'est bien passé aujourd'hui, même petit ?",
  "Quelle pensée revient souvent ces derniers jours ? Est-elle vraiment aussi certaine qu'elle en a l'air ?",
  "De quoi aurais-tu besoin, là, maintenant ?",
  "Qu'est-ce que tu dirais à un ami qui vivrait exactement ce que tu vis ?",
];

type Tool = "menu" | "respiration" | "ancrage" | "devoir" | "journaling";

export function Exercises() {
  const [tool, setTool] = useState<Tool>("menu");
  const [thought, setThought] = useState("");
  const [reframe, setReframe] = useState("");

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6 pb-24">
      <h1 className="text-xl font-semibold">Exercices</h1>

      {tool === "menu" && (
        <div className="grid gap-3">
          <ToolCard title="Respiration guidée" subtitle="4-4-6, avec minuteur visuel" onClick={() => setTool("respiration")} />
          <ToolCard title="Ancrage 5-4-3-2-1" subtitle="Reviens à l'instant présent" onClick={() => setTool("ancrage")} />
          <ToolCard title="Devoir léger" subtitle="Pensée automatique → reformulation" onClick={() => setTool("devoir")} />
          <ToolCard title="Journaling guidé" subtitle="Des questions pour t'aider à écrire" onClick={() => setTool("journaling")} />
        </div>
      )}

      {tool !== "menu" && (
        <button onClick={() => setTool("menu")} className="text-sm text-brand-600 dark:text-brand-300">
          ← Retour aux exercices
        </button>
      )}

      {tool === "respiration" && <BreathingTimer />}
      {tool === "ancrage" && <Grounding />}

      {tool === "devoir" && (
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Une pensée automatique que tu as eue récemment</span>
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              placeholder="Ex : « Je vais forcément échouer »"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Une reformulation plus juste ou plus nuancée</span>
            <textarea
              value={reframe}
              onChange={(e) => setReframe(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              placeholder="Ex : « Je n'en sais rien encore, et j'ai déjà réussi d'autres choses difficiles »"
            />
          </label>
          <p className="text-xs text-slate-400">
            Ce petit exercice reste sur cet appareil ; tu peux en reparler à
            ton coach quand tu veux.
          </p>
        </div>
      )}

      {tool === "journaling" && (
        <div className="space-y-3">
          {JOURNAL_PROMPTS.map((prompt) => (
            <div key={prompt} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
              <p className="text-sm font-medium">{prompt}</p>
              <textarea
                className="mt-2 w-full rounded-xl border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                rows={2}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCard({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl bg-white p-4 text-left shadow-sm dark:bg-slate-800">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </button>
  );
}
