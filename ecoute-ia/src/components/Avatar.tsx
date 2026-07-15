import type { CoachGender } from "../types";

// Avatar volontairement stylisé et non photoréaliste (pour ne pas
// accentuer l'illusion d'un humain réel), expression neutre/douce.
export function Avatar({ gender, size = 64 }: { gender: CoachGender; size?: number }) {
  const skin = gender === "femme" ? "#f4c9a8" : "#e8b48c";
  const hair = gender === "femme" ? "#5b3a29" : "#3a2a1e";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Avatar coach ${gender}`}>
      <circle cx="50" cy="50" r="48" fill="#e4e6fa" />
      <circle cx="50" cy="55" r="28" fill={skin} />
      {gender === "femme" ? (
        <path d="M22 50 a28 30 0 0 1 56 0 v10 h-6 a22 22 0 0 0 -44 0 h-6 z" fill={hair} />
      ) : (
        <path d="M24 48 a26 22 0 0 1 52 0 v4 h-52 z" fill={hair} />
      )}
      <circle cx="40" cy="54" r="2.6" fill="#3a2a1e" />
      <circle cx="60" cy="54" r="2.6" fill="#3a2a1e" />
      <path d="M40 66 q10 8 20 0" stroke="#3a2a1e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
