import { useEffect, useState } from "react";

const PHASES: { label: string; seconds: number }[] = [
  { label: "Inspire", seconds: 4 },
  { label: "Retiens", seconds: 4 },
  { label: "Expire", seconds: 6 },
];

export function BreathingTimer() {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].seconds);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        setPhaseIndex((i) => (i + 1) % PHASES.length);
        return PHASES[(phaseIndex + 1) % PHASES.length].seconds;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, phaseIndex]);

  const phase = PHASES[phaseIndex];
  const scale = phase.label === "Inspire" ? 1.3 : phase.label === "Expire" ? 0.85 : 1.1;

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div
        className="flex h-40 w-40 items-center justify-center rounded-full bg-brand-300/60 transition-transform duration-[1000ms] ease-in-out"
        style={{ transform: `scale(${running ? scale : 1})` }}
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-500 text-white">
          <div className="text-center">
            <div className="text-sm font-medium">{phase.label}</div>
            <div className="text-2xl font-semibold">{secondsLeft}</div>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          setRunning((r) => !r);
          setPhaseIndex(0);
          setSecondsLeft(PHASES[0].seconds);
        }}
        className="rounded-xl bg-brand-500 px-6 py-2 font-medium text-white"
      >
        {running ? "Arrêter" : "Commencer"}
      </button>
      <p className="max-w-xs text-center text-sm text-slate-500">
        Inspire 4 secondes, retiens 4 secondes, expire 6 secondes. Laisse ton
        corps suivre le rythme, sans forcer.
      </p>
    </div>
  );
}
