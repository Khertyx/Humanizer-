# Ecoute.ia — Coach de bien-être IA

MVP frontend (PWA) du coach de bien-être IA "Ecoute.ia". Voir
[`docs/DESIGN.md`](docs/DESIGN.md) pour le dossier de conception complet
(architecture cible, arborescence des écrans, prompts système, spécification
de la détection de crise, textes d'onboarding, plan de développement par lots).

## Ce que ce scaffold fait déjà

- Onboarding complet : mention de transparence IA, inscription, vérification
  d'âge (16 ans), consentement RGPD données de santé (case dédiée), disclaimer,
  pseudonymisation, choix du coach (genre + prénom), contact de confiance.
- Premier échange guidé, puis chat texte/vocal avec un coach dont le ton
  s'appuie sur un prompt système inspiré TCC / ACT / entretien motivationnel /
  écoute active — jamais nommés à l'utilisateur.
- **Couche de détection de crise indépendante du modèle génératif**
  (`src/lib/crisisDetection.ts`), testée (`npm test`), qui interrompt le
  scénario en cours et affiche 3114 / 15 / 112 en cas de signal rouge.
- Journal d'humeur avec courbe de progression, petites victoires.
- Exercices : respiration guidée, ancrage 5-4-3-2-1, devoir léger TCC,
  journaling guidé.
- Annuaire (données de démonstration), réglages, export/suppression des
  données en un clic.
- Installable en PWA (manifest + service worker via `vite-plugin-pwa`).

## Fiabilité : fonctionne même sans clé API

Le chat appelle l'API Gemini si `VITE_GEMINI_API_KEY` est définie. **Sans
clé**, ou en cas d'erreur réseau, l'app bascule automatiquement sur une
réponse d'écoute active générée localement (`localFallbackReply` dans
`src/lib/geminiClient.ts`) : l'application reste toujours démontrable et ne
plante jamais faute de configuration. La détection de crise, elle,
fonctionne dans tous les cas — elle ne dépend jamais de Gemini.

## Ce que ce scaffold NE fait PAS (volontairement, voir docs/DESIGN.md 1.3)

Pas de backend, pas de base de données réelle, pas d'authentification, pas
d'hébergement HDS : les données sont stockées en `localStorage` sur
l'appareil. Ce n'est pas conforme pour un lancement réel avec de vraies
données de santé — voir le plan de lots (`docs/DESIGN.md` section 6) pour la
trajectoire vers une version conforme (backend Node.js, PostgreSQL chiffré,
hébergement HDS, appel Gemini côté serveur).

## Démarrer en local

```bash
npm install
cp .env.example .env   # optionnel : ajouter une clé Gemini
npm run dev
```

## Tests et build

```bash
npm test        # suite de détection de crise (bloquante)
npm run build    # build de production + PWA
```
