import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../state/store";
import { COACH_NAME_SUGGESTIONS } from "../lib/systemPrompts";
import { exportStateAsFile } from "../lib/storage";
import type { CoachGender } from "../types";

export function Settings() {
  const navigate = useNavigate();
  const state = useStore();
  const profile = state.profile;
  const updateProfile = state.updateProfile;
  const resetAll = state.resetAll;
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!profile) {
    navigate("/onboarding");
    return null;
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-6 pb-24">
      <h1 className="text-xl font-semibold">Réglages</h1>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <p className="font-medium">Profil</p>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">Pseudo affiché</span>
          <input
            value={profile.pseudonym}
            onChange={(e) => updateProfile({ pseudonym: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <p className="font-medium">Coach</p>
        <div className="flex gap-2">
          {(["homme", "femme"] as CoachGender[]).map((gender) => (
            <button
              key={gender}
              onClick={() => updateProfile({ coachGender: gender, coachName: COACH_NAME_SUGGESTIONS[gender][0] })}
              className={`flex-1 rounded-xl py-2 text-sm capitalize ${
                profile.coachGender === gender ? "bg-brand-500 text-white" : "bg-brand-50 dark:bg-slate-900"
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {COACH_NAME_SUGGESTIONS[profile.coachGender].map((name) => (
            <button
              key={name}
              onClick={() => updateProfile({ coachName: name })}
              className={`rounded-full px-3 py-1 text-sm ${
                profile.coachName === name ? "bg-brand-500 text-white" : "bg-brand-50 dark:bg-slate-900"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <p className="font-medium">Contact de confiance</p>
        <input
          placeholder="Nom"
          value={profile.trustedContact?.name || ""}
          onChange={(e) =>
            updateProfile({
              trustedContact: { name: e.target.value, contact: profile.trustedContact?.contact || "" },
            })
          }
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <input
          placeholder="Téléphone ou email"
          value={profile.trustedContact?.contact || ""}
          onChange={(e) =>
            updateProfile({
              trustedContact: { name: profile.trustedContact?.name || "", contact: e.target.value },
            })
          }
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        {profile.trustedContact && (
          <button
            onClick={() => updateProfile({ trustedContact: null })}
            className="text-sm text-red-500"
          >
            Retirer le contact de confiance
          </button>
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <p className="font-medium">Confidentialité et données (RGPD)</p>
        <p className="text-sm text-slate-500">
          Consentement enregistré le{" "}
          {profile.healthConsentAt ? new Date(profile.healthConsentAt).toLocaleDateString("fr-FR") : "—"}.
        </p>
        <button
          onClick={() => exportStateAsFile(state)}
          className="w-full rounded-xl border border-slate-300 py-2 text-sm font-medium dark:border-slate-600"
        >
          Exporter mes données (JSON)
        </button>

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="w-full rounded-xl border border-red-300 py-2 text-sm font-medium text-red-500"
          >
            Supprimer mon compte et mes données
          </button>
        ) : (
          <div className="space-y-2 rounded-xl bg-red-50 p-3 dark:bg-red-900/30">
            <p className="text-sm text-red-700 dark:text-red-200">
              Cette action est définitive et supprime toutes tes données de
              cet appareil. Confirmer ?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetAll();
                  navigate("/onboarding");
                }}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white"
              >
                Oui, supprimer
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm dark:border-slate-600"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="px-1 text-center text-xs text-slate-400">
        Ce service ne remplace pas un suivi médical ou psychologique
        professionnel.
      </p>
    </div>
  );
}
