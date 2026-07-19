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
3. **S4 : diagnostiqué, corrigé et réactivé.** `isinvalid: false`, `isActive: true`,
   prochaine exécution 2026-07-20 09:00 (Europe/Paris).

## 6. Phase 1 réalisée — nouvelles tables dans « Khertyx — Acquisition Clients »

| Table | ID | Contenu |
|---|---|---|
| Personas | `tblDhaySYFLsYcAmz` | 3 records déjà remplis avec les prompts système complets (voir section 7) |
| Concurrents | `tblniG3h9j8fzk6ii` | Nom, Type (Local Bretagne/Référence nationale), Réseaux suivis, Notes de positionnement, Dernière analyse |
| Veille Tendances | `tblfjgRlJHE154UEx` | Sujet/Format repéré, Date, Réseau, Source, Score d'impact estimé, Persona à l'origine |
| Benchmarks Performants | `tbllyhq27XHFhfuU0` | Titre, Réseau, Lien du post, Pourquoi ça performe, Posts générés inspirés (lié à Calendrier de Contenu) |
| Log Décisions | `tblYiFzoq9Qg7qbYw` | Date, Scénario Make, Action, Détail, Post concerné (lié à Calendrier de Contenu) |

Sur la table existante « 📅 Calendrier de Contenu » : ajout du champ **Hook** (multilineText) et
renommage du champ de lien inverse créé automatiquement en **Benchmarks liés**.

**⚠️ Action manuelle restante (non automatisable via l'API Airtable disponible) :** ajouter le
choix **« À valider »** au champ Statut existant (actuellement Brouillon/Planifié/Publié/Erreur).
L'outil d'édition de champ ne permet pas d'ajouter une option à une liste déroulante existante —
il faut l'ajouter à la main dans Airtable (ouvrir le champ Statut → Modifier les options →
ajouter « À valider » entre Brouillon et Planifié, 30 secondes). Une fois fait, le Scénario D
pourra écrire ce statut, et S4 continuera de ne regarder que « Planifié » sans rien casser.

## 7bis. Diagnostic des 4 échecs DLQ de « Khertyx — Idée → Contenus IA »

Historique complet des exécutions en erreur inspecté. Aucun des problèmes trouvés ne vient du
blueprint actuel (le scénario a été modifié plusieurs fois le 25 juin, ces erreurs viennent de
versions antérieures) :

1. **Quota Gemini à 0 sur le tier gratuit** (`generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0`) — survenu à répétition sur le modèle `gemini-2.0-flash-lite`. Le scénario utilise maintenant `gemini-3.1-flash-lite`, sur lequel des runs ont réussi ensuite. **Point de vigilance réel pour la suite** : le nouveau scénario multi-personas fera plusieurs appels Gemini par génération (3 personas + 1 image, contre 1 seul appel avant) — donc plus de risque de retomber sur une limite de quota si le plan n'est pas passé en payant. À tester avec un seul enregistrement avant de lancer un cycle hebdomadaire complet.
2. **Erreur de mapping sur le champ Script TikTok** (`'2591' n'est pas un tableau valide`) — un ancien mapping utilisait des fonctions `trim`/`substring` qui cassaient sur une valeur inattendue. Le mapping actuel est une simple référence directe au résultat Gemini, ce bug n'existe plus dans la version en place.
3. **401 sur un module Mistral** — le scénario utilisait Mistral à une étape antérieure de son développement, avec une connexion mal authentifiée. Le blueprint actuel n'utilise plus du tout Mistral (uniquement Gemini), ce point est obsolète.
4. **403 « Invalid permissions… model not found »** sur un module Airtable — message d'erreur incohérent avec le module concerné (probablement un résidu d'un appel amont raté). Non reproductible dans la config actuelle.

**Conclusion : rien ne bloque la construction du nouveau scénario**, mais la vigilance quota
Gemini (point 1) est à garder à l'esprit — c'est le seul risque qui pourrait resurgir avec un
scénario qui multiplie les appels IA par génération.

## 8. Phase 3-4 réalisée — nouveau scénario de génération (3 personas + image), testé de bout en bout

**Scénario créé : « Khertyx — Génération Contenu (3 Personas + Image) »** (id Make `6622279`),
dans le même dossier que S4. Remplace l'ancien scénario mono-prompt (« Khertyx — Idée → Contenus
IA », id `6208506`, **mis en pause** pour éviter les doublons).

Flux : recherche Airtable des records `Statut = Brouillon` avec une idée renseignée → 3 appels
Gemini chaînés (persona SEO/GEO → persona Growth/Marketing IA → persona Copywriter, chacun lisant
son prompt système directement depuis la table Personas) → génération d'image Gemini → upload
Google Drive → écriture des contenus + statut `À valider` dans le Calendrier de Contenu → entrée
d'audit dans Log Décisions. Chaque étape IA a un filet de sécurité (email + note d'erreur sur le
record si un appel échoue, sans bloquer le reste du pipeline). Planifié chaque lundi 07:00
(Europe/Paris) — cohérent avec « génération automatique hebdo » du brief.

**Changement de déclencheur en cours de route :** le scénario a d'abord été construit avec un
webhook (comme l'ancien), mais son test s'est heurté à une limitation de l'environnement de
développement (pas de la production) : le domaine public `hook.eu1.make.com` est bloqué par la
politique réseau de ce sandbox, donc impossible d'y envoyer une requête de test réelle. Plutôt que
de laisser un scénario non testé, il a été reconstruit avec un déclencheur Airtable natif
(recherche des `Brouillon`), ce qui est à la fois testable immédiatement et plus fidèle à l'esprit
« génération automatique » du brief qu'un bouton manuel.

### Test de bout en bout réalisé (record `rec7HejtsoSeMufJR`, "TEST — Content Engine 3 Personas")

Exécution réelle lancée via l'API Make (`scenarios_run`), succès confirmé. Résultat vérifié
directement dans Airtable :
- Hook, Contenu LinkedIn, Contenu Facebook, Contenu Instagram, Script TikTok, Premier Commentaire :
  tous remplis, ton conforme à la charte (bénéfice concret, zéro jargon, CTA `khertyx.com/audit-gratuit`).
- Statut passé automatiquement de `Brouillon` à `À valider`. ✅
- Une entrée a été créée dans Log Décisions et liée au post. ✅
- Une image a été générée et uploadée sur Google Drive, lien écrit dans « Médias (URL) ».

**Point trouvé puis résolu :** le lien Google Drive généré (`https://drive.google.com/uc?...`) a
été testé directement — il renvoyait **403 Forbidden sans authentification**. Les fichiers
uploadés via l'API Drive sur un compte Gmail personnel sont privés par défaut, et aucun module
Make du package Google Drive ne permet de changer les permissions de partage. C'est exactement le
point que le brief signalait déjà comme « non totalement validé ».

**Résolu : bascule sur Cloudinary.** Yannick a autorisé une connexion Cloudinary via une demande
d'identifiants Make (`credential-requests` — les identifiants ne passent jamais par la
conversation, il les a saisis directement dans Make). Le module 9 du scénario 6622279 utilise
maintenant `cloudinary:UploadResource` (upload direct du base64 renvoyé par Gemini, `file_type:
"data"`) au lieu de Google Drive, et écrit `{{9.secure_url}}` dans « Médias (URL) » au lieu de
`{{9.directDownloadLink}}`.

Re-testé de bout en bout (record `rec599jACgoQz8liy`, supprimé après vérification) : le scénario
tourne sans erreur et produit une URL du type
`https://res.cloudinary.com/fwdxpxxs/image/upload/v.../....jpg`.

**Point à vérifier toi-même :** je n'ai pas pu confirmer l'accessibilité publique de cette URL
précise depuis cet environnement — la politique réseau de ce sandbox bloque `res.cloudinary.com`
en sortie (403 renvoyé par le proxy interne du sandbox lui-même, avant même d'atteindre
Cloudinary — contrairement au cas Google Drive où le 403 venait bien de Google). Par défaut, un
upload Cloudinary de type `upload` (celui utilisé ici) est public sans configuration
supplémentaire, donc ça devrait fonctionner — un test rapide d'ouverture du lien dans une fenêtre
de navigation privée suffit à confirmer.

## 9. Phase 3 réalisée — Scénarios A (veille concurrents) et B (veille tendances), testés en direct

**Scénario A — « Khertyx — Veille Concurrents »** (id Make `6623883`) : hebdomadaire, lundi 06:00
(Europe/Paris). Parcourt tous les records de la table Concurrents, fait une recherche web réelle
via le grounding Gemini (`google_search_context`) sur chacun, et met à jour ses « Notes de
positionnement » (en conservant l'historique des analyses précédentes) et sa « Dernière analyse ».

**Scénario B — « Khertyx — Veille Tendances »** (id Make `6623893`) : hebdomadaire, lundi 06:30.
Une recherche web groundée (persona Growth/Marketing IA) identifie les formats qui performent
actuellement + 3 posts de référence, puis un second appel Gemini (sans grounding, cette fois pour
structurer proprement le texte libre) découpe le résultat en jusqu'à 3 records Veille Tendances et
3 records Benchmarks Performants. Une entrée est aussi loguée dans Log Décisions.

Les deux scénarios ont été **testés en conditions réelles** (`scenarios_run`) :
- Scénario A : testé sur un concurrent fictif de test (Make.com, supprimé après vérification) —
  résumé factuel généré avec sources citées, écrit correctement en base.
- Scénario B : testé directement sur les tables réelles (pas de données de test à nettoyer,
  contrairement à A/D) — a produit 3 tendances réelles (score 8 à 10/10, formats « avant/après
  chiffré », « breakdown de problème métier », « coulisses ») et 3 benchmarks réels avec 2 URLs
  sources trouvées ; le modèle a correctement laissé le 3ᵉ lien vide plutôt que d'en inventor un.
  **Ces 6 records réels sont conservés en base** — c'est le premier cycle de veille du système,
  pas des données de test à supprimer.

Point de vigilance commun aux deux scénarios : le module Gemini de grounding
(`createACompletionGeminiPro`) ne renvoie pas de métadonnées de citation structurées côté Make
(pas de champ `groundingMetadata`) — les URLs sources proviennent uniquement de ce que le modèle
choisit d'écrire dans le texte. Fiable la plupart du temps sur les tests réalisés, mais pas garanti
à 100 % ; à surveiller sur quelques semaines d'usage réel.

## 7. Phase 2 réalisée — 3 personas en base

Les 3 prompts système (Expert SEO/GEO, Expert Copywriter, Expert Growth/Marketing IA) sont
rédigés et stockés dans la table Personas, éditables sans toucher aux scénarios Make. Ils
intègrent déjà la charte de contenu Khertyx (zéro jargon/anglicisme, bénéfice métier concret,
ton pro accessible, cible généraliste entrepreneurs, formats par réseau).
