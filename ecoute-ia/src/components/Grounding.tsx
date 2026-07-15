import { useState } from "react";

const STEPS = [
  { count: 5, sense: "choses que tu peux VOIR", icon: "👀" },
  { count: 4, sense: "choses que tu peux TOUCHER", icon: "✋" },
  { count: 3, sense: "sons que tu peux ENTENDRE", icon: "👂" },
  { count: 2, sense: "odeurs que tu peux SENTIR", icon: "👃" },
  { count: 1, sense: "chose que tu peux GOÛTER", icon: "👅" },
];

export function Grounding() {
  const [step, setStep] = useState(0);
  const done = step >= STEPS.length;

  if (done) {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-medium">C'est terminé.</p>
        <p className="mt-2 text-sm text-slate-500">
          Prends un instant pour remarquer comment tu te sens maintenant, ici.
        </p>
        <button
          onClick={() => setStep(0)}
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white"
        >
          Recommencer
        </button>
      </div>
    );
  }

  const current = STEPS[step];

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="text-5xl">{current.icon}</div>
      <p className="text-lg font-medium">
        Nomme {current.count} {current.sense}
      </p>
      <p className="text-sm text-slate-500">Prends ton temps, il n'y a rien à réussir.</p>
      <button
        onClick={() => setStep((s) => s + 1)}
        className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-medium text-white"
      >
        Étape suivante
      </button>
      <p className="text-xs text-slate-400">
        Étape {step + 1} / {STEPS.length}
      </p>
    </div>
  );
}
