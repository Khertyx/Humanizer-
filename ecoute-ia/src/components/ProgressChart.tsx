import type { MoodEntry } from "../types";

export function ProgressChart({ entries }: { entries: MoodEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Pas encore d'entrée. Ta courbe apparaîtra ici dès ton premier suivi
        d'humeur.
      </p>
    );
  }

  const width = 320;
  const height = 120;
  const padding = 16;
  const recent = entries.slice(-14);
  const stepX = recent.length > 1 ? (width - padding * 2) / (recent.length - 1) : 0;

  const points = recent.map((entry, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((entry.mood - 1) / 4) * (height - padding * 2);
    return { x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Courbe de progression de l'humeur">
      <path d={path} fill="none" stroke="#5b6ee1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#5b6ee1" />
      ))}
    </svg>
  );
}
