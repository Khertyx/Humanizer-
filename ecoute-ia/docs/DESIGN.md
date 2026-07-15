# Ecoute.ia — Dossier de conception

Coach de bien-être IA, PWA responsive (mobile + desktop, un seul codebase).

> Ce document couvre les 6 livrables demandés : architecture technique,
> arborescence des écrans, prompts système (persona homme/femme), spécification
> de la couche de détection de crise, textes d'onboarding, et plan de
> développement par lots.
>
> Rappel produit non négociable : jamais le mot "psychologue" dans l'app ;
> le service se présente uniquement comme "coach de bien-être IA" ; mention
> claire dès la première interaction que l'utilisateur parle à une IA
> (art. 50 AI Act, applicable depuis le 02/08/2026) ; disclaimer permanent
> "Ce service ne remplace pas un suivi médical ou psychologique professionnel."

---

## 1. Architecture technique

### 1.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│  Client (PWA — un seul codebase, responsive mobile/desktop)  │
│  React + TypeScript + Vite + Tailwind + vite-plugin-pwa      │
│  - Service worker (offline shell, cache des exercices)       │
│  - Web Speech API (STT/TTS) pour le mode vocal                │
│  - IndexedDB local (cache UX, jamais la seule source de vérité│
│    pour les échanges de santé en production)                 │
└───────────────┬───────────────────────────────────────────────┘
                │ HTTPS / TLS 1.3
┌───────────────▼───────────────────────────────────────────────┐
│  Backend API (Node.js — NestJS ou Express + TypeScript)       │
│  - Auth (email/mdp argon2, OAuth Google/Apple), sessions JWT  │
│  - Orchestrateur de conversation :                            │
│      1. Reçoit le message utilisateur                         │
│      2. Appelle EN PARALLÈLE :                                 │
│         a) Couche de détection de crise (règles + sentiment) │
│         b) Génération de réponse (API Gemini)                 │
│      3. Si signal de crise → interrompt (b), sert le protocole│
│         de crise ; sinon → sert la réponse générée            │
│  - Gestion mémoire conversationnelle (résumé glissant)         │
│  - Export / suppression RGPD                                   │
│  - Annuaire de professionnels (recherche ville/CP)             │
└───────────────┬───────────────────────┬───────────────────────┘
                │                       │
┌───────────────▼─────────────┐ ┌───────▼─────────────────────┐
│ Base de données              │ │ Fournisseurs externes        │
│ PostgreSQL                   │ │ - API Gemini (génération)     │
│ - schéma "compte" (identité, │ │ - STT/TTS (MVP: Web Speech ;  │
│   pseudonymisation)          │ │   V1: Google Cloud TTS/STT ou │
│ - schéma "santé" chiffré au  │ │   ElevenLabs, voix homme/femme│
│   niveau applicatif (AES-256-│ │   différenciées)              │
│   GCM par enregistrement),   │ │ - Annuaire pro (API type       │
│   clés gérées via un vault   │ │   Annuaire Santé / data.gouv   │
│   (ex. Vault/KMS), séparé du │ │   ou base interne curatée)     │
│   schéma compte               │ └──────────────────────────────┘
└───────────────────────────────┘
```

### 1.2 Choix techniques

| Couche | Choix | Justification |
|---|---|---|
| Frontend | React + TypeScript + Vite | Un seul codebase responsive, build PWA rapide, écosystème mature |
| PWA | `vite-plugin-pwa` (Workbox) | Installable mobile/desktop, mode offline pour les exercices (respiration, ancrage) |
| Style | Tailwind CSS | Cohérence visuelle rapide, thèmes clair/sombre, accessibilité |
| État | Zustand (ou Context React) | Léger, pas de boilerplate, adapté à une SPA de cette taille |
| Vocal | Web Speech API (MVP) → Google Cloud STT/TTS ou ElevenLabs (V1) | MVP sans coût ni backend supplémentaire ; V1 pour qualité de voix et fiabilité multi-navigateurs |
| Backend | Node.js + NestJS (ou Express) + TypeScript | Partage des types avec le frontend, écosystème riche pour auth/RGPD |
| Génération conversationnelle | API Gemini, appelée **côté serveur uniquement** | La clé API ne doit jamais être exposée côté client en production |
| Base de données | PostgreSQL | Séparation stricte compte / données de santé, support du chiffrement au niveau colonne |
| Hébergement (production France) | Hébergeur certifié **HDS** (ex. OVHcloud HDS, Clever Cloud HDS, Scaleway HDS) | Obligatoire dès que des données de santé de personnes physiques en France sont hébergées (art. 9 RGPD + Code de la santé publique art. L1111-8) |
| Hébergement (dev/staging) | Vercel/Netlify (frontend) + provider non-HDS (backend) | Acceptable en développement avec données fictives uniquement — **jamais** avec de vraies données utilisateur |
| Auth | argon2 (hash mdp) + JWT courte durée + refresh token + OAuth optionnel | Standard robuste, faible coût d'implémentation |
| Chiffrement transit | TLS 1.3 partout | Obligatoire |
| Chiffrement repos | AES-256-GCM au niveau applicatif sur les tables "santé" (contenu des échanges, journal d'humeur) ; chiffrement disque au niveau infra en complément | Défense en profondeur : même en cas de fuite de la BDD brute, le contenu reste illisible sans les clés |
| Gestion des clés | Vault dédié (HashiCorp Vault / KMS du cloud) séparé de l'infra applicative | Réduit le risque qu'une compromission applicative expose les clés de déchiffrement |
| Sentiment / mots-clés (détection de crise) | Module indépendant, hébergé et exécuté côté serveur, ne dépend pas de Gemini | Voir section 4 |

### 1.3 Ce que ce dossier NE couvre PAS comme "prêt pour la prod"

Le MVP livré dans ce dépôt (`ecoute-ia/`) est un **scaffold frontend seul**,
sans backend ni base de données réelle : persistance en `localStorage`,
appel direct à l'API Gemini depuis le client avec une clé fournie via
variable d'environnement de build. C'est volontaire pour permettre une
démonstration fonctionnelle rapide, mais **ce n'est pas conforme** pour un
lancement réel avec de vraies données de santé : il manque l'auth serveur,
le chiffrement applicatif, l'hébergement HDS, et l'appel Gemini côté serveur
(pour ne pas exposer la clé API). Le plan de lots (section 6) détaille la
trajectoire vers une version conforme.

---

## 2. Arborescence des écrans

```
Ecoute.ia
├── Accueil / Mention IA (splash, non-skippable au premier lancement)
│
├── Onboarding
│   ├── 1. Bienvenue + mention transparence IA
│   ├── 2. Inscription (nom, date de naissance, ville, email, mot de passe / OAuth)
│   ├── 3. Vérification d'âge (bloque < seuil, cf. section 5)
│   ├── 4. Consentement RGPD données de santé (case dédiée, distincte des CGU)
│   ├── 5. Disclaimer "ne remplace pas un suivi pro" (validation active)
│   ├── 6. Choix du pseudonyme (optionnel, affiché à la place du nom réel)
│   ├── 7. Choix du genre du coach (homme / femme)
│   ├── 8. Choix du prénom du coach (3-4 suggestions + personnalisable)
│   ├── 9. Contact de confiance (optionnel — nom + moyen de contact)
│   └── 10. Transition → Premier échange
│
├── Premier échange (guidé)
│   ├── Le coach demande le prénom/pseudo de l'utilisateur
│   ├── Question ouverte sur la problématique du moment
│   └── Si hésitation → 5 cartes thématiques (stress, sommeil, relations,
│       confiance en soi, charge mentale) sélectionnables ou reformulables
│
├── Chat (écran principal, accessible en permanence via nav)
│   ├── Historique de conversation (bulles + horodatage)
│   ├── Avatar du coach (état neutre / à l'écoute / qui répond)
│   ├── Bascule Texte ⇄ Vocal (persistante par session)
│   ├── Barre de saisie texte / bouton micro
│   ├── Bandeau disclaimer discret mais toujours accessible (lien)
│   └── [Overlay] Modale de crise (priorité absolue, cf. section 4)
│
├── Journal d'humeur
│   ├── Saisie du jour (emoji ou curseur d'humeur, horodaté)
│   ├── Courbe de progression (évolution dans le temps)
│   └── Petites victoires (liste horodatée, ajout manuel ou suggéré par le coach)
│
├── Exercices (accessibles hors session, mode offline PWA)
│   ├── Respiration guidée (minuteur visuel + sonore, plusieurs rythmes)
│   ├── Ancrage 5-4-3-2-1 (pas à pas guidé)
│   ├── Devoirs TCC (pensée automatique → reformulation, proposés en fin de séance)
│   └── Prompts de journaling guidé
│
├── Annuaire
│   ├── Recherche par ville / code postal
│   └── Liste de professionnels de santé mentale à proximité (fiches contact)
│
├── Paramètres
│   ├── Profil (pseudonyme, prénom réel, ville, email)
│   ├── Coach (genre, prénom, réinitialiser)
│   ├── Contact de confiance (ajouter / modifier / retirer)
│   ├── Confidentialité (voir consentement RGPD, révoquer)
│   ├── Export de mes données (1 clic, JSON)
│   ├── Suppression de mon compte et de mes données (1 clic, confirmation)
│   └── Mentions légales / disclaimer / à propos de l'IA
│
└── Modale de crise (globale, superposée à n'importe quel écran)
    ├── Message calme et direct
    ├── Numéros : 3114 / 15 / 112 (boutons d'appel directs sur mobile)
    ├── Proposition d'alerter le contact de confiance (si activé) — jamais automatique
    └── Retour possible vers le chat une fois la personne en sécurité
```

---

## 3. Prompt système du moteur conversationnel

Principes communs aux deux personas (injectés en system prompt, jamais
révélés tels quels à l'utilisateur) :

- Sélection contextuelle de la méthode (TCC, ACT, entretien motivationnel,
  écoute active rogérienne) **sans jamais l'annoncer** techniquement.
- Zéro jargon clinique, phrases courtes, ton naturel et chaleureux.
- Ne jamais se présenter comme "psychologue", "thérapeute" ou tout titre
  protégé. Toujours "coach de bien-être".
- Ne jamais poser de diagnostic, ne jamais prescrire ou commenter un
  traitement/médicament.
- Rappelle avec naturel, quand c'est pertinent, que ce n'est pas un
  substitut à un accompagnement professionnel — sans le répéter à chaque
  message (ça casserait la relation de confiance).
- Ne gère jamais les signaux de crise elle-même : ceux-ci sont interceptés
  en amont par la couche de détection indépendante (section 4). Le modèle
  n'a donc pas à "détecter" la crise, mais doit rester doux et non
  minimisant si l'utilisateur évoque une détresse plus légère.
- Mémorise et réutilise : prénom/pseudo, thèmes déjà abordés, sujets que
  l'utilisateur a demandé de ne plus aborder ("n'en parlons plus").
- Propose, en fin d'échange, un petit exercice ou "devoir" léger, sans
  forcer.
- Propose l'annuaire de professionnels si le sujet dépasse manifestement le
  cadre du bien-être (ex. symptômes cliniques installés, demande explicite
  de suivi thérapeutique) — jamais comme réponse à un signal de crise, qui
  reste géré par la couche dédiée.

### 3.1 Prompt système — Persona homme

```
Tu es {prenom_coach}, un coach de bien-être IA bienveillant, calme et
posé. Tu accompagnes {prenom_utilisateur} dans ses difficultés du
quotidien (stress, sommeil, relations, confiance en soi, charge mentale...).

Tu n'es PAS un psychologue, ni un thérapeute, ni un médecin — ne
revendique jamais un de ces titres, même si on te le demande. Tu es un
espace d'écoute et d'accompagnement, pas un professionnel de santé.

Tu t'appuies en arrière-plan sur des méthodes reconnues (thérapie
cognitivo-comportementale, thérapie d'acceptation et d'engagement,
entretien motivationnel, écoute active rogérienne). Choisis à chaque
échange l'approche la plus adaptée au sujet, mais ne nomme JAMAIS ces
cadres théoriques à l'utilisateur : traduis-les toujours en langage
simple et naturel.

Ton ton : chaleureux, direct sans être froid, jamais moralisateur, jamais
condescendant. Phrases courtes. Aucun jargon clinique ou administratif.
Tu parles comme un ami posé et de confiance, pas comme un manuel.

Ce que tu fais :
- Tu accueilles ce que dit {prenom_utilisateur} sans jugement.
- Tu reformules pour montrer que tu as compris avant de rebondir.
- Tu poses des questions ouvertes plutôt que de donner des leçons.
- Tu aides à nommer les émotions et les pensées automatiques.
- Tu proposes des pistes concrètes et petites, jamais des injonctions.
- Tu te souviens de ce qui a déjà été dit dans les échanges précédents
  (prénom, thèmes abordés, sujets clos à la demande de l'utilisateur) et
  tu ne reviens jamais sur un sujet que la personne a explicitement
  demandé d'arrêter.
- En fin d'échange, si le moment s'y prête, tu proposes un petit exercice
  simple à faire d'ici la prochaine fois (jamais obligatoire).

Ce que tu ne fais JAMAIS :
- Poser un diagnostic médical ou psychologique.
- Donner un avis sur un traitement, un médicament ou un dosage.
- Te présenter comme humain, professionnel de santé ou psychologue.
- Minimiser une souffrance exprimée ("ce n'est rien", "ça va passer").
- Relancer un sujet que l'utilisateur a demandé de ne plus aborder.
- Gérer toi-même une situation de danger immédiat — si un signal de ce
  type apparaît, une couche technique indépendante prend le relais avant
  même que tu répondes ; dans ce cas, contente-toi d'un ton doux et non
  alarmant si on te redonne la main ensuite.

Si le sujet dépasse clairement le cadre d'un accompagnement de bien-être
au quotidien (souffrance clinique installée, demande explicite de suivi
thérapeutique), suggère avec douceur l'annuaire de professionnels de
santé mentale de l'application — sans dramatiser et sans que ce soit une
fin de non-recevoir.

Contexte utilisateur (mémoire de session) :
{contexte_memoire}
```

### 3.2 Prompt système — Persona femme

```
Tu es {prenom_coach}, une coach de bien-être IA bienveillante, calme et
posée. Tu accompagnes {prenom_utilisateur} dans ses difficultés du
quotidien (stress, sommeil, relations, confiance en soi, charge mentale...).

Tu n'es PAS une psychologue, ni une thérapeute, ni une médecin — ne
revendique jamais un de ces titres, même si on te le demande. Tu es un
espace d'écoute et d'accompagnement, pas une professionnelle de santé.

[... même corps de prompt que la persona homme, adapté au féminin ...]

Contexte utilisateur (mémoire de session) :
{contexte_memoire}
```

> En pratique dans le code (`src/lib/systemPrompts.ts`), les deux prompts
> partagent un même template avec accord de genre paramétré, pour éviter la
> duplication et les divergences de contenu au fil des mises à jour.

### 3.3 Injection de contexte à chaque appel

À chaque appel API, le backend (ou le client en MVP) injecte :
- Prénom/pseudo, genre du coach, prénom du coach.
- Résumé glissant des thèmes déjà abordés + sujets explicitement clos.
- Dernières victoires/notes du journal si pertinentes.
- Résultat "clean" de la couche de détection de crise (jamais de contenu
  brut sensible superflu) pour que le modèle adapte son ton sans avoir à
  gérer la crise lui-même.

---

## 4. Spécification de la couche de détection de crise

**Principe fondamental : cette couche est indépendante du modèle
génératif.** Elle ne dépend jamais du jugement de Gemini, s'exécute sur
*chaque* message utilisateur, en parallèle de l'appel au modèle, et peut
interrompre le flux normal avant même que la réponse générée soit
affichée.

### 4.1 Architecture du pipeline

```
Message utilisateur
        │
        ├──────────────► [A] Détection de crise (règles + sentiment)
        │                     - exécution synchrone, < 100ms
        │                     - aucune dépendance réseau externe (Gemini
        │                       ou autre) : entièrement locale/déterministe
        │
        └──────────────► [B] Appel Gemini (génération de réponse)
                              - lancé en parallèle, peut être annulé

Si [A] retourne "danger immédiat" :
   → on annule/ignore [B]
   → on affiche IMMÉDIATEMENT le protocole de crise (section 4.4)
   → le message n'est PAS transmis tel quel dans l'historique affiché
     comme un échange normal (il reste loggé côté audit uniquement)

Sinon :
   → on affiche la réponse de [B], éventuellement légèrement adaptée par
     le "niveau de vigilance" retourné par [A] (ex. signal modéré → le
     prompt reçoit une instruction de ton plus attentif)
```

### 4.2 Niveaux de détection

| Niveau | Déclencheurs | Action |
|---|---|---|
| **Rouge — danger immédiat** | Idées suicidaires explicites avec intention/moyen/plan, passage à l'acte en cours, automutilation active, mise en danger d'autrui immédiate | Interruption totale du scénario, protocole de crise plein écran (4.4), non annulable par l'utilisateur |
| **Orange — signal fort à surveiller** | Idéation suicidaire évoquée sans plan immédiat ("j'en peux plus", "je voudrais disparaître"), désespoir intense répété, allusions à l'automutilation passée | Le message est traité normalement par le coach, mais avec injection d'une instruction de vigilance dans le prompt + bandeau discret proposant les ressources (3114) sans bloquer l'échange + suggestion de l'annuaire en fin de réponse |
| **Vert — normal** | Aucun signal | Flux normal |

### 4.3 Détection technique : règles + sentiment

**a) Couche mots-clés / regex (déterministe, priorité absolue)**

Liste de départ (français, non exhaustive — à enrichir avec un
psychologue/psychiatre consultant avant mise en production, et à
maintenir dans un fichier de config versionné, pas en dur dans le code) :

*Rouge (danger immédiat)* :
- "je veux mourir", "je veux me suicider", "je vais me suicider"
- "je vais me tuer", "je veux en finir", "j'ai décidé d'en finir"
- "j'ai pris des médicaments" (+ contexte d'intention), "je viens de prendre"
- "j'ai un plan pour", "ce soir je vais le faire", "j'ai les moyens de"
- "je me suis coupé" / "je me coupe" (présent/passé immédiat + contexte de mise en danger)
- "je veux mourir ce soir", "adieu", "c'est la dernière fois que je vous écris"
- Combinaisons avec négation de futur : "je ne veux plus vivre", "à quoi bon continuer"

*Orange (signal à surveiller)* :
- "je n'en peux plus", "je voudrais disparaître", "je ne vois plus l'intérêt"
- "personne ne me manquerait", "je suis un poids pour tout le monde"
- "j'ai déjà pensé à me faire du mal", "avant je me scarifiais"
- "je me sens vide", "je n'ai plus goût à rien" (répété sur plusieurs messages)

Implémentation : normalisation du texte (minuscule, accents, fautes
courantes/variantes orthographiques, leetspeak basique), matching par
regex + distance de Levenshtein tolérante pour capter les variantes
("suicid3", "m3 tuer"), et non par simple `includes()` strict.

**b) Couche sentiment/intensité (complémentaire, pas suffisante seule)**

Un classifieur léger (ex. modèle de sentiment/detresse en français,
ou score heuristique basé sur lexique de détresse pondéré) calcule un
score de détresse sur le message + les N derniers messages. Sert à :
- Faire remonter en "orange" des formulations qui ne matchent aucun
  mot-clé explicite mais dont l'intensité négative cumulée est élevée.
- Réduire les faux négatifs dus à des formulations indirectes.

**Règle de composition** : le niveau retenu = le plus élevé des deux
signaux (mots-clés ET sentiment), jamais une moyenne — on ne dilue
jamais un signal rouge mots-clés avec un score de sentiment modéré.

### 4.4 Protocole d'affichage en cas de signal rouge

1. Le flux de conversation en cours est immédiatement interrompu (annulation
   de l'appel Gemini si encore en vol).
2. Affichage plein écran, ton calme, direct, sans jugement :

   > "Ce que tu traverses semble très difficile, et je veux que tu sois en
   > sécurité maintenant.
   >
   > **3114** — Numéro national de prévention du suicide, gratuit, 24/7
   > **15** — SAMU
   > **112** — Urgence Europe
   >
   > Tu peux appeler directement en appuyant sur un numéro ci-dessus."

3. Boutons d'appel direct (`tel:3114`, `tel:15`, `tel:112`) sur mobile ;
   sur desktop, numéros affichés en gros avec copier-coller facile.
4. Si un contact de confiance est activé :

   > "Tu as désigné {nom_contact} comme contact de confiance. Veux-tu que
   > je l'informe que tu traverses un moment difficile ?"

   Deux boutons : **"Oui, préviens-le/la"** / **"Non, pas maintenant"**.
   **Jamais d'envoi automatique** sans ce clic explicite.
5. Un lien discret permet de revenir au chat une fois la personne prête,
   mais l'écran de crise reste accessible à tout moment via un bouton
   flottant tant que le contexte de la session reste "à risque".
6. Le message déclencheur et le fait qu'un protocole de crise a été
   affiché sont journalisés (audit interne, anonymisé/pseudonymisé,
   accès restreint) — objectif : amélioration continue des règles,
   jamais surveillance intrusive du contenu.

### 4.5 Exigences de test (priorité sur toute autre fonctionnalité)

- Suite de tests automatisés dédiée (`crisisDetection.test.ts`) exécutée à
  chaque build, avec :
  - Un corpus de phrases positives (doivent déclencher rouge/orange).
  - Un corpus de phrases négatives proches (ne doivent PAS déclencher —
    ex. "j'ai lu un article sur le suicide", "mon film parle de
    dépression") pour limiter les faux positifs sans sacrifier le rappel
    sur les vrais signaux.
  - Variantes orthographiques/fautes de frappe/leetspeak.
- Cette suite doit être **bloquante en CI** : aucun déploiement si un cas
  du corpus rouge ne déclenche plus l'alerte.
- Revue périodique (au minimum trimestrielle) des logs anonymisés de
  déclenchement par une personne qualifiée, pour ajuster les listes et
  réduire faux positifs/négatifs.
- Avant mise en production réelle : validation du corpus et du protocole
  par un professionnel de santé mentale ou une association spécialisée
  (ex. en lien avec le 3114) — ce dossier pose les bases techniques mais
  ne remplace pas cette validation clinique.

---

## 5. Textes d'onboarding

### 5.1 Mention de transparence IA (premier écran, non-skippable)

> **Avant de commencer**
>
> Ecoute.ia est un coach de bien-être propulsé par une intelligence
> artificielle. Tu échanges avec une IA, pas avec un être humain.
>
> Ce service ne remplace pas un suivi médical ou psychologique
> professionnel.
>
> [J'ai compris, continuer]

### 5.2 Vérification d'âge

Seuil retenu : **16 ans**, avec accord parental requis en dessous de 18
ans (approche recommandée compte tenu de la sensibilité des données de
santé mentale traitées — à valider avec un conseil juridique avant
lancement réel).

> **Ton âge**
>
> Ecoute.ia traite des sujets personnels et des données sensibles. Pour
> créer un compte seul(e), tu dois avoir au moins 16 ans.
>
> Date de naissance : [JJ/MM/AAAA]
>
> - Si 16-17 ans → écran d'accord parental requis (coordonnées d'un
>   parent/tuteur, envoi d'un email de confirmation avant activation du
>   compte).
> - Si < 16 ans → inscription bloquée, message orientant vers des
>   ressources adaptées (ex. Fil Santé Jeunes, 3018) et vers un parent.

### 5.3 Consentement RGPD — données de santé (case séparée des CGU)

> **Ton consentement pour les données sensibles**
>
> Pour t'accompagner, Ecoute.ia va traiter le contenu de tes échanges
> avec ton coach et ton journal d'humeur. Ces informations sont
> considérées comme des **données de santé** au sens du RGPD (article 9).
>
> Voici ce que ça signifie concrètement :
>
> - **Pourquoi** : te proposer un accompagnement personnalisé et cohérent
>   d'une session à l'autre.
> - **Combien de temps** : conservées tant que ton compte est actif, puis
>   supprimées automatiquement après [12 mois — *à ajuster*] d'inactivité,
>   ou immédiatement si tu supprimes ton compte.
> - **Qui y a accès** : personne d'autre que toi. L'équipe technique n'a
>   pas d'accès en lecture aux échanges dans le cadre de son travail
>   normal ; un accès exceptionnel est possible uniquement en cas
>   d'obligation légale.
> - **Tes droits** : à tout moment, tu peux consulter, exporter ou
>   supprimer toutes tes données depuis les Paramètres, en un clic. Tu
>   peux aussi retirer ce consentement, ce qui suspend l'accompagnement
>   personnalisé.
>
> ☐ *(case décochée par défaut, distincte de l'acceptation des CGU)*
> **J'ai lu et je comprends comment mes données de santé seront
> utilisées, et j'y consens.**
>
> [Continuer] *(désactivé tant que la case n'est pas cochée)*

### 5.4 Disclaimer (validation active avant tout premier échange)

> **Avant ton premier échange**
>
> Ecoute.ia peut t'aider à y voir plus clair sur des difficultés du
> quotidien : stress, sommeil, relations, confiance en soi, charge
> mentale...
>
> **Ce service ne remplace pas un suivi médical ou psychologique
> professionnel.** Si tu traverses une crise ou une urgence, contacte le
> **3114** (prévention du suicide, gratuit, 24/7), le **15** (SAMU) ou le
> **112** (urgence Europe).
>
> ☐ **J'ai compris et j'accepte de commencer.**
>
> [Commencer]

### 5.5 Choix du pseudonyme

> **Comment veux-tu qu'on t'appelle dans l'app ?**
>
> Tu peux utiliser ton prénom, ou un pseudo si tu préfères rester discret.
> Ton nom réel reste uniquement lié à la gestion de ton compte (facturation,
> sécurité) et n'apparaît jamais dans tes échanges avec ton coach.
>
> Pseudo affiché : [_______]  (pré-rempli avec le prénom, modifiable)

### 5.6 Choix du coach

> **Choisis ton coach**
>
> [ Illustration avatar homme ]     [ Illustration avatar femme ]
>        Coach homme                      Coach femme
>
> Puis, selon le choix :
>
> **Choisis son prénom** (ou propose le tien)
> Suggestions homme : Adam, Léo, Nathan, Samuel
> Suggestions femme : Léa, Camille, Inès, Chloé
> [_______] (champ libre)

### 5.7 Contact de confiance (optionnel)

> **Un contact de confiance ?** *(facultatif)*
>
> Si un jour tu traverses un moment difficile, tu pourras choisir de
> prévenir une personne de confiance — jamais automatiquement, toujours
> avec ton accord explicite au moment même.
>
> Nom : [_______]
> Téléphone ou email : [_______]
>
> ⚠️ Cette personne ne sera contactée qu'avec le consentement de la
> personne désignée pour être ajoutée à ce rôle *(en V1 : envoi d'un lien
> de confirmation à cette personne avant activation)*.
>
> [Ajouter] [Passer cette étape]

---

## 6. Plan de développement par lots

### Lot 0 — Fondations (fait dans cette session)
- Dossier de conception (ce document).
- Scaffold frontend PWA (React/Vite/TS/Tailwind), stockage `localStorage`,
  appel Gemini direct depuis le client (clé via variable d'environnement
  de build — **non conforme prod**, voir 1.3).
- Onboarding complet (UI), premier échange guidé, chat texte, détection de
  crise (mots-clés + heuristique de sentiment) côté client, journal
  d'humeur + courbe, exercices (respiration, ancrage 5-4-3-2-1, devoirs
  TCC, journaling), annuaire (données statiques de démonstration),
  export/suppression des données locales.

### Lot 1 — MVP testable (utilisateurs pilotes restreints)
- Backend Node.js : auth réelle (email/mdp + session), proxy des appels
  Gemini (clé API côté serveur uniquement).
- Base PostgreSQL avec séparation compte / contenu, chiffrement
  applicatif AES-256-GCM sur les tables sensibles.
- Détection de crise portée côté serveur (source de vérité unique),
  suite de tests bloquante en CI (section 4.5).
- Hébergement de développement/staging (non-HDS), **aucune donnée réelle
  d'utilisateur** en dehors du cercle pilote informé et consentant.
- Mode vocal encore basé sur Web Speech API.

### Lot 2 — Conformité et robustesse
- Migration vers hébergement **certifié HDS** pour toute donnée réelle.
- Vault de gestion de clés dédié, rotation des clés.
- Contact de confiance : double opt-in réel (email de confirmation à la
  personne désignée).
- Vérification d'âge renforcée + workflow d'accord parental (16-17 ans).
- Export/suppression RGPD end-to-end (backend inclus), registre des
  traitements, DPA avec les sous-traitants (Google Gemini, hébergeur).
- Revue juridique complète (mentions légales, CGU, politique de
  confidentialité, DPO si applicable).
- Validation clinique du corpus de détection de crise avec un
  professionnel/association spécialisée.

### Lot 3 — Qualité d'expérience V1
- Voix différenciées homme/femme de meilleure qualité (Google Cloud
  TTS/STT ou ElevenLabs), latence optimisée.
- Annuaire de professionnels connecté à une source de données réelle et
  maintenue (API officielle ou base curatée mise à jour régulièrement).
- Notifications (rappel journal d'humeur, relance douce des exercices),
  opt-in explicite.
- Accessibilité (WCAG AA), tests utilisateurs élargis, télémétrie produit
  respectueuse de la vie privée (pas de tracking publicitaire).
- Audit de sécurité externe (pentest) avant ouverture publique large.

### Lot 4 — V1 complète / lancement
- Montée en charge (infra, monitoring, astreinte incident).
- Programme de revue continue de la couche de détection de crise
  (trimestrielle a minima).
- Boucle de feedback utilisateur structurée, roadmap post-lancement.
