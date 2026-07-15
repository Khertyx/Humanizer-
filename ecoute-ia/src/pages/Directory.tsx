import { useState } from "react";

// Données de démonstration uniquement. Voir docs/DESIGN.md 1.2/6 : en
// production, cette liste doit être remplacée par une source de données
// réelle et maintenue (API officielle ou base curatée).
const SAMPLE_DIRECTORY = [
  { name: "Maison des Adolescents", city: "Paris", phone: "01 00 00 00 00" },
  { name: "Centre Médico-Psychologique", city: "Lyon", phone: "04 00 00 00 00" },
  { name: "Point Accueil Écoute Jeunes", city: "Marseille", phone: "04 00 00 00 01" },
  { name: "Maison des Adolescents", city: "Toulouse", phone: "05 00 00 00 00" },
];

export function Directory() {
  const [query, setQuery] = useState("");
  const results = SAMPLE_DIRECTORY.filter((r) =>
    r.city.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6 pb-24">
      <h1 className="text-xl font-semibold">Annuaire</h1>
      <p className="text-sm text-slate-500">
        Des professionnels de santé mentale près de chez toi. Cette liste de
        démonstration sera remplacée par une base réelle et à jour en
        production.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ville ou code postal"
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
      />
      <ul className="space-y-2">
        {results.map((r) => (
          <li key={r.name + r.city} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
            <p className="font-medium">{r.name}</p>
            <p className="text-sm text-slate-500">{r.city}</p>
            <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="text-sm text-brand-600 dark:text-brand-300">
              {r.phone}
            </a>
          </li>
        ))}
        {query && results.length === 0 && (
          <p className="text-sm text-slate-400">Aucun résultat pour "{query}" dans cette démonstration.</p>
        )}
      </ul>
    </div>
  );
}
