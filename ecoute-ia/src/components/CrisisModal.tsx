import { useState } from "react";
import type { TrustedContact } from "../types";

interface Props {
  onClose: () => void;
  trustedContact: TrustedContact | null;
}

// Protocole d'affichage en cas de signal rouge — voir docs/DESIGN.md 4.4.
// Priorité absolue sur tout le reste de l'interface.
export function CrisisModal({ onClose, trustedContact }: Props) {
  const [alerted, setAlerted] = useState(false);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Ce que tu traverses semble très difficile.
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Je veux que tu sois en sécurité maintenant. Tu peux appeler
          directement l'un de ces numéros :
        </p>

        <div className="mt-4 space-y-2">
          <a
            href="tel:3114"
            className="block rounded-xl bg-brand-500 px-4 py-3 text-center font-semibold text-white"
          >
            3114 — Prévention du suicide (gratuit, 24/7)
          </a>
          <a
            href="tel:15"
            className="block rounded-xl bg-slate-700 px-4 py-3 text-center font-semibold text-white"
          >
            15 — SAMU
          </a>
          <a
            href="tel:112"
            className="block rounded-xl bg-slate-700 px-4 py-3 text-center font-semibold text-white"
          >
            112 — Urgence Europe
          </a>
        </div>

        {trustedContact && !alerted && (
          <div className="mt-5 rounded-xl bg-brand-50 p-3 dark:bg-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Tu as désigné <strong>{trustedContact.name}</strong> comme contact
              de confiance. Veux-tu que je l'informe que tu traverses un moment
              difficile ?
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setAlerted(true)}
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white"
              >
                Oui, préviens-le/la
              </button>
              <button
                onClick={() => setAlerted(true)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-200"
              >
                Non, pas maintenant
              </button>
            </div>
          </div>
        )}

        {trustedContact && alerted && (
          <p className="mt-4 text-sm text-slate-500">
            (Démo MVP : dans la version de production, {trustedContact.name}{" "}
            recevrait une notification si tu as cliqué "Oui".)
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300"
        >
          Je suis en sécurité, revenir au chat
        </button>
      </div>
    </div>
  );
}
