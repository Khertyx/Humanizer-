# SETUP.md — Content Engine Khertyx : audit Phase 0

Date de l'audit : 2026-07-19
Vérifié en direct via les intégrations Make et Airtable (lecture seule, rien modifié).

## ⚠️ Constat principal : le scénario S4 réel ne correspond pas à la base décrite dans le brief

Le brief suppose que le scénario de publication (« S4 ») est branché sur la base Airtable
**« Automatisation Facebook »** (`app9qlmxZN3Wd8221`), avec 3 tables séparées (Posts LinkedIn /
Posts Facebook / Posts Instagram) et des statuts `Idee / Pret / Publié / Erreur`.

Ce n'est **pas** ce qui tourne réellement. Le scénario Make actif qui publie sur les réseaux est :

- **Scénario** : `Khertyx — Publication Automatique Réseaux Sociaux` (ID Make `6208424`)
- **Base réelle utilisée** : `Khertyx — Acquisition Clients` (`appkUgwVAxF8uUIsQ`), table unique
  `tblNm7zq20gPiSVrG` (un seul record = un « contenu », avec une colonne texte par réseau)
- **Statuts réels utilisés** : `Planifié` (déclenche la publication), `Brouillon` (généré, pas
  encore validé), `Publié` — pas de `Idee/Pret` comme décrit dans le brief.
- La base `Automatisation Facebook` (`app9qlmxZN3Wd8221`) avec ses 3 tables Posts LinkedIn/
  Facebook/Instagram (statuts `Idee/Pret/Publié/Erreur`) **existe bien** mais n'est utilisée par
  **aucun scénario Make actif** — elle semble être une maquette antérieure, jamais branchée.

**Conséquence directe :** avant de continuer, il faut décider sur quelle base construire
(voir section « Décisions à prendre » en fin de document). Rien n'a été modifié en attendant.

## 1. Connexions Make — statut réel

| Connexion | Module natif | Statut | Expiration | Détail |
|---|---|---|---|---|
| LinkedIn (OpenID Connect) | `linkedin:CreatePost` | ✅ Active | 2027-07-17 | Connectée à **https://www.linkedin.com/in/yannick-lejoly-b08ba231a/** — **profil personnel de Yannick**, pas une Page Entreprise Khertyx. Les posts LinkedIn générés par le système partiraient donc sous le nom personnel, pas sous « Khertyx ». |
| Facebook | `facebook-pages:CreatePost` / `CreateComment` | ✅ Active | 2026-09-15 | Connectée à la Page **« KhertyX (Pléchâtel) »** (page_id `936978536168509`). Renouvellement à prévoir avant mi-septembre 2026. |
| Instagram for Business | `instagram-business:CreatePostPhoto` | ✅ Active (via la même connexion Facebook) | 2026-09-15 | Compte IG Business **@khertyx** (accountId `17841478143002082`), déjà lié à la Page Facebook ci-dessus. La config existe et est plus avancée que ce que le brief supposait. |
| Airtable | `airtable:ActionSearchRecords` / `ActionUpdateRecords` | ✅ Active | 2026-09-17 | User `usr6XbkYoMIwPQAf7`. Deux autres connexions Airtable existent en double (OAuth non utilisée, Token/Key non utilisée) — à nettoyer un jour, sans urgence. |
| Gemini AI (texte + image) | `gemini-ai:*` | ✅ Active | Pas d'expiration (clé API basique) | Confirmé : le module `generateAnImageV2` (génération d'image) existe dans le package Make `gemini-ai` et utilise la **même connexion** que la génération de texte. Pas besoin d'une connexion séparée pour l'image — reste à valider en conditions réelles que le plan/quota de la clé couvre bien l'usage image (à tester en Phase 5, un seul appel suffit pour vérifier). |

## 2. État du scénario de publication (« S4 »)

- Nom réel : **Khertyx — Publication Automatique Réseaux Sociaux** (id 6208424)
- **Statut : INACTIF** (`isActive: false`) et marqué **`isinvalid: true`** par Make — c'est-à-dire
  qu'il ne tourne pas actuellement, même s'il a un déclencheur quotidien programmé à 09:00.
  Il faut l'ouvrir dans Make pour voir le module en erreur de configuration avant de le
  réactiver — cela n'a pas été modifié ici, à faire manuellement ou sur confirmation.
- Filtre de déclenchement : `{Date Publication} = TODAY()` ET `{Statut} = "Planifié"`.
  ⚠️ Ce n'est pas le statut `Pret` mentionné dans le brief — la validation humaine existante
  consiste à faire passer le record de `Brouillon` à `Planifié` (et à fixer sa date).
- Flux : Airtable (recherche) → LinkedIn post → Facebook post → (si 1er commentaire renseigné)
  Facebook comment → (si photo dispo) Instagram post → Airtable update statut `Publié`.
- Point Instagram/URL publique : confirmé dans le blueprint — le module utilise
  `ifempty(pièce-jointe[1].url, champ Image URL)`. Les URLs d'attachment Airtable ne sont
  **pas garanties stables dans le temps** (elles expirent) : c'est très probablement la source
  du problème « non totalement validé » noté dans le brief. Recommandation : toujours remplir un
  lien public stable (Drive/Cloudinary) dans le champ « Image URL » plutôt que compter sur la
  pièce jointe Airtable telle quelle.

## 3. Scénario de génération de contenu — en existe déjà un !

Il existe déjà un scénario qui couvre une bonne partie des Phases C/D du brief :

- **Khertyx — Idée → Contenus IA (LinkedIn / Facebook / Instagram / TikTok)** (id 6208506)
- Déclenché par webhook (une « idée » en entrée), **actif**.
- Un seul prompt Gemini (`gemini-3.1-flash-lite`) génère en une passe : post LinkedIn, post
  Facebook, légende Instagram, script TikTok, et 1er commentaire Facebook — puis passe le
  record en statut `Brouillon`.
- Ne fait **pas** de génération d'image, ne consulte pas de veille concurrents/tendances,
  et n'utilise **pas** les 3 personas séparés demandés dans le brief (SEO/GEO, Copywriter,
  Growth) — un seul prompt fourre-tout fait tout à la fois.
- **4 exécutions en échec dans la DLQ** (dead-letter queue) au moment de l'audit — à
  inspecter avant de s'en servir de base pour la suite.

## 4. Diagnostic S4 — cause trouvée et corrigée

Deux paramètres de modules utilisaient des noms de champs obsolètes (l'app Airtable et l'app
Facebook Pages de Make ont changé de schéma depuis la dernière édition du scénario le 16 juin) :

1. **Module 1 (Airtable — Recherche)** : utilisait `filterByFormula`, un nom de champ qui
   n'existe plus dans la version 3 de l'app Airtable. Le nom actuel attendu est `formula`.
   → Corrigé (même valeur de formule conservée : `AND({Date Publication}=TODAY(),{Statut}="Planifié")`).
2. **Module 6 (Facebook — 1er commentaire)** : utilisait `object_id`, un nom de champ qui
   n'existe plus dans la version 6 de l'app Facebook Pages. Le nom actuel attendu est `id`.
   → Corrigé (même valeur : `{{3.id}}`, l'ID du post Facebook créé au module 3).

Les deux corrections ont été validées individuellement (`validate_module_configuration` renvoie
`valid: true` pour les 6 modules du scénario) et appliquées au blueprint réel via l'API Make.

**Point restant :** après correction, Make renvoie toujours `isinvalid: true` au niveau du
scénario. Cela ressemble à un indicateur qui ne se recalcule qu'à l'activation (ou à l'ouverture
dans l'éditeur), plutôt qu'à un vrai problème résiduel — les 6 modules valident individuellement
sans erreur. À confirmer en tentant une activation ou en ouvrant le scénario dans Make.

**Vérification faite avant tout** : sur les 18 records actuels de la table « 📅 Calendrier de
Contenu », 11 sont au statut `Planifié` mais **aucun n'a de `Date Publication` renseignée** —
le filtre de S4 (date = aujourd'hui ET statut = Planifié) ne peut donc rien publier par erreur
dans l'état actuel, même si le scénario était réactivé immédiatement.

## 5. Écart supplémentaire vs le brief : le statut « À valider »

Le champ Statut de la table réelle a une description qui mentionne déjà 5 états logiques
(Brouillon → À valider → Planifié → Publié → Erreur), mais l'option `À valider` **n'existe pas
réellement** dans la liste des choix du champ (seuls Brouillon/Planifié/Publié/Erreur existent).
C'est exactement le statut intermédiaire de validation humaine demandé en Phase 1 du brief — à
ajouter comme choix réel, sans casser le filtre de S4 qui ne regarde que `Planifié`.

## Décisions prises (voir échange utilisateur)

1. **Base cible : « Khertyx — Acquisition Clients »** (`appkUgwVAxF8uUIsQ`), table unique
   « 📅 Calendrier de Contenu » (`tblNm7zq20gPiSVrG`) — pas la base « Automatisation Facebook ».
2. **Génération de contenu : remplacer** le scénario mono-prompt existant par un flux à 3
   personas (SEO/GEO, Copywriter, Growth) + génération d'image. L'ancien scénario
   (« Khertyx — Idée → Contenus IA ») sera mis en pause pour éviter les doublons.
3. **S4 : diagnostiqué et corrigé** (voir section 4). Reste à confirmer l'activation.
