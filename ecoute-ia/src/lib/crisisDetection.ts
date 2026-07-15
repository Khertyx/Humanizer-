import type { CrisisLevel } from "../types";

// Couche de détection de crise — indépendante du modèle génératif.
// Voir docs/DESIGN.md section 4 pour la spécification complète.
// Cette liste de mots-clés est un point de départ et doit être enrichie et
// validée par un professionnel de santé mentale avant toute mise en
// production réelle.

const RED_PATTERNS: RegExp[] = [
  /\bje\s+veux\s+(me\s+)?(tuer|suicider)\b/i,
  /\bje\s+vais\s+(me\s+)?(tuer|suicider)\b/i,
  /\bje\s+veux\s+(en\s+finir|mourir)\b/i,
  /\bj'ai\s+d[ée]cid[ée]\s+d'en\s+finir\b/i,
  /\bj'ai\s+(pris|avale)\s+.*(m[ée]dicament|cachet|boite\s+enti[eè]re)/i,
  /\bj'ai\s+un\s+plan\s+pour\s+(mourir|en\s+finir|me\s+tuer)\b/i,
  /\bce\s+soir\s+je\s+vais\s+le\s+faire\b/i,
  /\bj'ai\s+les\s+moyens\s+de\s+(mourir|en\s+finir|me\s+tuer)\b/i,
  /\bje\s+me\s+(suis\s+)?coup[ée]\b/i,
  /\bje\s+ne\s+veux\s+plus\s+vivre\b/i,
  /\b[àa]\s+quoi\s+bon\s+continuer\b/i,
  /\badieu\b/i,
  /\bderni[eè]re\s+fois\s+que\s+(je|vous)\b/i,
];

const ORANGE_PATTERNS: RegExp[] = [
  /\bje\s+n'en\s+peux\s+plus\b/i,
  /\bje\s+voudrais\s+dispara[iî]tre\b/i,
  /\bje\s+ne\s+vois\s+plus\s+l'int[ée]r[êe]t\b/i,
  /\bpersonne\s+ne\s+me\s+manquerait\b/i,
  /\bje\s+suis\s+un\s+poids\s+pour\s+tout\s+le\s+monde\b/i,
  /\bj'ai\s+d[ée]j[àa]\s+pens[ée]\s+[àa]\s+me\s+faire\s+du\s+mal\b/i,
  /\bavant\s+je\s+me\s+scarifiais\b/i,
  /\bje\s+me\s+sens\s+vide\b/i,
  /\bje\s+n'ai\s+plus\s+go[uû]t\s+[àa]\s+rien\b/i,
];

// Lexique de détresse pondéré pour un score heuristique complémentaire.
// Sert de filet de sécurité pour des formulations qui n'ont pas matché
// littéralement un motif ci-dessus.
const DISTRESS_WORDS: Record<string, number> = {
  "désespoir": 2,
  "désespérée": 2,
  "désespéré": 2,
  "insupportable": 2,
  "épuisée": 1,
  "épuisé": 1,
  "seule": 1,
  "seul": 1,
  "inutile": 2,
  "fardeau": 2,
  "abandonnée": 1,
  "abandonné": 1,
  "vide": 1,
  "noir": 1,
  "peur": 1,
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function sentimentScore(text: string): number {
  const normalized = normalize(text);
  let score = 0;
  for (const [word, weight] of Object.entries(DISTRESS_WORDS)) {
    const normWord = normalize(word);
    if (normalized.includes(normWord)) score += weight;
  }
  return score;
}

export interface CrisisResult {
  level: CrisisLevel;
  matched: boolean;
}

export function detectCrisis(text: string): CrisisResult {
  const normalized = normalize(text);

  for (const pattern of RED_PATTERNS) {
    if (pattern.test(normalized)) {
      return { level: "rouge", matched: true };
    }
  }

  for (const pattern of ORANGE_PATTERNS) {
    if (pattern.test(normalized)) {
      return { level: "orange", matched: true };
    }
  }

  // Filet heuristique : un score de détresse élevé, sans mot-clé explicite,
  // fait remonter en vigilance orange plutôt que de rester silencieux.
  if (sentimentScore(text) >= 4) {
    return { level: "orange", matched: true };
  }

  return { level: "vert", matched: false };
}
