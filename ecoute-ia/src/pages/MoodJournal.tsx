import { useState } from "react";
import { useStore } from "../state/store";
import { MoodSlider } from "../components/MoodSlider";
import { ProgressChart } from "../components/ProgressChart";

export function MoodJournal() {
  const moodEntries = useStore((s) => s.moodEntries);
  const wins = useStore((s) => s.wins);
  const addMoodEntry = useStore((s) => s.addMoodEntry);
  const addWin = useStore((s) => s.addWin);

  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const [winText, setWinText] = useState("");

  const today = new Date().toDateString();
  const loggedToday = moodEntries.some((e) => new Date(e.createdAt).toDateString() === today);

  function logMood() {
    addMoodEntry({ id: crypto.randomUUID(), mood, note, createdAt: new Date().toISOString() });
    setNote("");
  }

  function logWin() {
    if (!winText.trim()) return;
    addWin({ id: crypto.randomUUID(), text: winText.trim(), createdAt: new Date().toISOString() });
    setWinText("");
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-6 pb-24">
      <h1 className="text-xl font-semibold">Journal d'humeur</h1>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <p className="mb-3 text-sm font-medium">Comment te sens-tu aujourd'hui ?</p>
        <MoodSlider value={mood} onChange={setMood} />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Une note, si tu veux (facultatif)"
          className="mt-3 w-full rounded-xl border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <button onClick={logMood} className="mt-3 w-full rounded-xl bg-brand-500 py-2 text-sm font-medium text-white">
          {loggedToday ? "Ajouter une autre entrée" : "Enregistrer"}
        </button>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <p className="mb-3 text-sm font-medium">Ta progression</p>
        <ProgressChart entries={moodEntries} />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <p className="mb-3 text-sm font-medium">Petites victoires</p>
        <div className="flex gap-2">
          <input
            value={winText}
            onChange={(e) => setWinText(e.target.value)}
            placeholder="Une petite victoire aujourd'hui..."
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <button onClick={logWin} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white">
            Ajouter
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {[...wins].reverse().map((w) => (
            <li key={w.id} className="rounded-xl bg-brand-50 px-3 py-2 text-sm dark:bg-slate-900">
              <span>{w.text}</span>
              <span className="ml-2 text-[10px] text-slate-400">
                {new Date(w.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </li>
          ))}
          {wins.length === 0 && <p className="text-sm text-slate-400">Pas encore de victoire notée.</p>}
        </ul>
      </section>
    </div>
  );
}
