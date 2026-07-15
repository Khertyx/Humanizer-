import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../state/store";
import { COACH_NAME_SUGGESTIONS } from "../lib/systemPrompts";
import type { CoachGender, UserProfile } from "../types";
import { Avatar } from "../components/Avatar";

type Step =
  | "bienvenue"
  | "inscription"
  | "age"
  | "consentement-sante"
  | "disclaimer"
  | "pseudonyme"
  | "genre-coach"
  | "nom-coach"
  | "contact-confiance";

const STEP_ORDER: Step[] = [
  "bienvenue",
  "inscription",
  "age",
  "consentement-sante",
  "disclaimer",
  "pseudonyme",
  "genre-coach",
  "nom-coach",
  "contact-confiance",
];

function yearsSince(dateStr: string): number {
  const birth = new Date(dateStr);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function Onboarding() {
  const navigate = useNavigate();
  const setProfile = useStore((s) => s.setProfile);
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEP_ORDER[stepIndex];

  const [form, setForm] = useState({
    fullName: "",
    birthDate: "",
    city: "",
    email: "",
    pseudonym: "",
    coachGender: "femme" as CoachGender,
    coachName: "",
    trustedContactName: "",
    trustedContactInfo: "",
    skipTrustedContact: false,
    healthConsent: false,
    disclaimerAccepted: false,
  });

  const next = () => setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  const age = form.birthDate ? yearsSince(form.birthDate) : null;
  const blocked = age !== null && age < 16;

  function finish() {
    const profile: UserProfile = {
      fullName: form.fullName,
      birthDate: form.birthDate,
      city: form.city,
      email: form.email,
      pseudonym: form.pseudonym || form.fullName,
      coachGender: form.coachGender,
      coachName: form.coachName || COACH_NAME_SUGGESTIONS[form.coachGender][0],
      trustedContact:
        !form.skipTrustedContact && form.trustedContactName
          ? { name: form.trustedContactName, contact: form.trustedContactInfo }
          : null,
      healthConsentAt: new Date().toISOString(),
      disclaimerAcceptedAt: new Date().toISOString(),
      onboardingComplete: true,
      closedTopics: [],
    };
    setProfile(profile);
    navigate("/premier-echange");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-6 h-1 w-full rounded-full bg-brand-100">
        <div
          className="h-1 rounded-full bg-brand-500 transition-all"
          style={{ width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` }}
        />
      </div>

      {step === "bienvenue" && (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Avant de commencer</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Ecoute.ia est un coach de bien-être propulsé par une intelligence
            artificielle. Tu échanges avec une IA, pas avec un être humain.
          </p>
          <p className="rounded-xl bg-brand-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Ce service ne remplace pas un suivi médical ou psychologique
            professionnel.
          </p>
          <button onClick={next} className="w-full rounded-xl bg-brand-500 py-3 font-medium text-white">
            J'ai compris, continuer
          </button>
        </div>
      )}

      {step === "inscription" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Créer ton compte</h1>
          <Field label="Prénom et nom" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
          <Field
            label="Date de naissance"
            type="date"
            value={form.birthDate}
            onChange={(v) => setForm({ ...form, birthDate: v })}
          />
          <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <NavButtons onBack={back} onNext={next} disabled={!form.fullName || !form.birthDate || !form.email} />
        </div>
      )}

      {step === "age" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Ton âge</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ecoute.ia traite des sujets personnels et des données sensibles.
            Pour créer un compte seul(e), tu dois avoir au moins 16 ans.
          </p>
          {blocked ? (
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              L'inscription autonome n'est pas possible en dessous de 16 ans.
              Rapproche-toi d'un parent, ou contacte Fil Santé Jeunes (0800 235
              236) si tu as besoin d'en parler maintenant.
            </div>
          ) : age !== null && age < 18 ? (
            <div className="rounded-xl bg-brand-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Un accord parental sera nécessaire avant l'activation complète du
              compte (étape simulée dans ce MVP).
            </div>
          ) : null}
          <NavButtons onBack={back} onNext={next} disabled={blocked || age === null} />
        </div>
      )}

      {step === "consentement-sante" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Ton consentement pour les données sensibles</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ecoute.ia va traiter le contenu de tes échanges et de ton journal
            d'humeur — des <strong>données de santé</strong> au sens du RGPD
            (article 9).
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <strong>Pourquoi :</strong> te proposer un accompagnement
              personnalisé et cohérent d'une session à l'autre.
            </li>
            <li>
              <strong>Combien de temps :</strong> conservées tant que ton
              compte est actif, supprimables à tout moment.
            </li>
            <li>
              <strong>Tes droits :</strong> consulter, exporter ou supprimer
              tes données depuis les Réglages, en un clic.
            </li>
          </ul>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.healthConsent}
              onChange={(e) => setForm({ ...form, healthConsent: e.target.checked })}
              className="mt-1"
            />
            J'ai lu et je comprends comment mes données de santé seront
            utilisées, et j'y consens.
          </label>
          <NavButtons onBack={back} onNext={next} disabled={!form.healthConsent} />
        </div>
      )}

      {step === "disclaimer" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Avant ton premier échange</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ecoute.ia peut t'aider à y voir plus clair sur des difficultés du
            quotidien : stress, sommeil, relations, confiance en soi, charge
            mentale...
          </p>
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
            Ce service ne remplace pas un suivi médical ou psychologique
            professionnel. Si tu traverses une crise ou une urgence, contacte
            le <strong>3114</strong> (prévention du suicide, gratuit, 24/7), le{" "}
            <strong>15</strong> (SAMU) ou le <strong>112</strong> (urgence
            Europe).
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.disclaimerAccepted}
              onChange={(e) => setForm({ ...form, disclaimerAccepted: e.target.checked })}
              className="mt-1"
            />
            J'ai compris et j'accepte de commencer.
          </label>
          <NavButtons onBack={back} onNext={next} disabled={!form.disclaimerAccepted} />
        </div>
      )}

      {step === "pseudonyme" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Comment veux-tu qu'on t'appelle ?</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ton nom réel reste uniquement lié à la gestion de ton compte et
            n'apparaît jamais dans tes échanges.
          </p>
          <Field
            label="Pseudo affiché"
            value={form.pseudonym || form.fullName}
            onChange={(v) => setForm({ ...form, pseudonym: v })}
          />
          <NavButtons onBack={back} onNext={next} disabled={false} />
        </div>
      )}

      {step === "genre-coach" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Choisis ton coach</h1>
          <div className="flex gap-4">
            {(["homme", "femme"] as CoachGender[]).map((gender) => (
              <button
                key={gender}
                onClick={() => setForm({ ...form, coachGender: gender, coachName: "" })}
                className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-4 ${
                  form.coachGender === gender ? "border-brand-500 bg-brand-50 dark:bg-slate-800" : "border-transparent bg-white dark:bg-slate-800"
                }`}
              >
                <Avatar gender={gender} size={72} />
                <span className="text-sm font-medium capitalize">Coach {gender}</span>
              </button>
            ))}
          </div>
          <NavButtons onBack={back} onNext={next} disabled={false} />
        </div>
      )}

      {step === "nom-coach" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Choisis son prénom</h1>
          <div className="flex flex-wrap gap-2">
            {COACH_NAME_SUGGESTIONS[form.coachGender].map((name) => (
              <button
                key={name}
                onClick={() => setForm({ ...form, coachName: name })}
                className={`rounded-full px-4 py-2 text-sm ${
                  form.coachName === name ? "bg-brand-500 text-white" : "bg-white dark:bg-slate-800"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <Field
            label="Ou choisis un autre prénom"
            value={form.coachName}
            onChange={(v) => setForm({ ...form, coachName: v })}
          />
          <NavButtons onBack={back} onNext={next} disabled={!form.coachName} />
        </div>
      )}

      {step === "contact-confiance" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Un contact de confiance ? (facultatif)</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Si un jour tu traverses un moment difficile, tu pourras choisir de
            prévenir cette personne — jamais automatiquement, toujours avec
            ton accord explicite au moment même.
          </p>
          <Field
            label="Nom"
            value={form.trustedContactName}
            onChange={(v) => setForm({ ...form, trustedContactName: v })}
          />
          <Field
            label="Téléphone ou email"
            value={form.trustedContactInfo}
            onChange={(v) => setForm({ ...form, trustedContactInfo: v })}
          />
          <div className="flex gap-3 pt-2">
            <button onClick={back} className="flex-1 rounded-xl border border-slate-300 py-3 font-medium">
              Retour
            </button>
            <button onClick={finish} className="flex-1 rounded-xl bg-brand-500 py-3 font-medium text-white">
              {form.trustedContactName ? "Ajouter et terminer" : "Passer cette étape"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600 dark:text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
      />
    </label>
  );
}

function NavButtons({ onBack, onNext, disabled }: { onBack: () => void; onNext: () => void; disabled: boolean }) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onBack} className="flex-1 rounded-xl border border-slate-300 py-3 font-medium dark:border-slate-600">
        Retour
      </button>
      <button
        onClick={onNext}
        disabled={disabled}
        className="flex-1 rounded-xl bg-brand-500 py-3 font-medium text-white disabled:opacity-40"
      >
        Continuer
      </button>
    </div>
  );
}
