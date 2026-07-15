import { describe, expect, it } from "vitest";
import { detectCrisis } from "./crisisDetection";

// Suite bloquante (docs/DESIGN.md 4.5) : ces cas doivent toujours déclencher
// le niveau attendu. Toute régression ici doit bloquer le build.
describe("detectCrisis — signaux rouges (danger immédiat)", () => {
  const redCases = [
    "je veux me suicider ce soir",
    "j'ai décidé d'en finir",
    "j'ai un plan pour me tuer",
    "je ne veux plus vivre",
    "à quoi bon continuer",
    "je me suis coupé hier soir et je recommence",
  ];

  it.each(redCases)("détecte %s comme rouge", (text) => {
    expect(detectCrisis(text).level).toBe("rouge");
  });
});

describe("detectCrisis — signaux oranges (vigilance)", () => {
  const orangeCases = [
    "je n'en peux plus en ce moment",
    "je voudrais disparaître parfois",
    "personne ne me manquerait de toute façon",
    "je me sens vide depuis des semaines",
  ];

  it.each(orangeCases)("détecte %s comme orange", (text) => {
    expect(detectCrisis(text).level).not.toBe("vert");
  });
});

describe("detectCrisis — faux positifs à éviter", () => {
  const safeCases = [
    "j'ai lu un article intéressant sur la prévention du suicide",
    "le film parlait de dépression, c'était touchant",
    "je suis un peu fatigué mais ça va",
    "j'ai passé une bonne journée avec mes amis",
  ];

  it.each(safeCases)("ne déclenche pas de rouge pour %s", (text) => {
    expect(detectCrisis(text).level).not.toBe("rouge");
  });
});
