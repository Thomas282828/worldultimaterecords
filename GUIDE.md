# Mettre WorldUltimateRecords en ligne

Temps nécessaire : environ 45 minutes pour le site, plus 30 minutes pour l'abonnement. Tout est gratuit, sauf le nom de domaine (facultatif) et les frais Stripe sur chaque paiement.

| Fichier | À quoi il sert |
|---|---|
| `site/` | Le site complet, à envoyer sur GitHub |
| `site/config.js` | Le seul fichier à modifier : clés, nom de l'éditeur, contact, chaîne YouTube |
| `supabase.sql` | Crée ou met à jour la base de données |
| `supabase/functions/stripe-webhook/index.ts` | Active le Pass Néon quand un joueur paie (étape 11) |
| `GUIDE.md` | Ce guide |

Sans configuration, le site fonctionne en « mode démo » : chaque visiteur ne voit que ses propres scores.

**Tu as déjà installé une version précédente ?** Va directement à « Mettre à jour une installation existante », en bas.

---

## Étape 1 : créer le projet Supabase

1. Va sur **supabase.com** et crée un compte.
2. Clique sur **New project**. Nom : `worldultimaterecords`. Choisis un mot de passe de base de données et garde-le. Région : **West EU (Paris)** ou la plus proche, dans l'Union européenne (c'est ce qu'annonce la page de confidentialité).
3. Clique sur **Create new project** et attends 1 à 2 minutes.

## Étape 2 : créer la base de données

1. Menu de gauche : **SQL Editor** → **New query**.
2. Ouvre `supabase.sql` avec le Bloc-notes, copie **tout** et colle-le.
3. Clique sur **Run**. Tu dois voir *Success. No rows returned*.

## Étape 3 : autoriser les visiteurs sans compte

1. **Authentication** → **Sign In / Providers**.
2. Active **Allow anonymous sign-ins**, puis **Save**.

## Étape 4 : créer ton compte administrateur

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Ton e-mail, un mot de passe solide, coche **Auto Confirm User**, puis **Create user**.
3. **SQL Editor** → **New query**, colle ces deux lignes avec ton e-mail, puis **Run** :

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'ton-email@exemple.com' on conflict do nothing;
```

Tu dois voir *1 row affected*.

En tant qu'admin, tu es le seul à pouvoir prendre les pseudos réservés (Mr.Novyra, WorldUltimateRecords, Admin…).

## Étape 5 : remplir `config.js`

Ouvre `site/config.js` avec le Bloc-notes :

1. **supabaseUrl** et **supabaseAnonKey** : Supabase → **Project Settings** → **API** (ou **API Keys**). Copie le *Project URL* et la clé *anon public* / *publishable*. **Jamais la clé `service_role` ou `secret`.**
2. **editorName** et **contactEmail** : obligatoires pour les mentions légales. Je te conseille une adresse créée exprès pour le site (ex. `contact.worldultimaterecords@gmail.com`) : elle sera visible publiquement, et c'est là que les parents peuvent demander la suppression d'une vidéo.
3. **youtubeChannelUrl** (facultatif) : l'adresse de ta chaîne. Un bouton « S'abonner » apparaît alors en haut du site.
4. **youtubeShorts** (facultatif) : les identifiants de tes Shorts à afficher sur le site. Pour `https://youtube.com/shorts/abcDEF12345`, l'identifiant est `abcDEF12345`. Exemple : `youtubeShorts: ["abcDEF12345", "xyz98765432"]`.
5. Laisse **turnstileSiteKey** vide pour l'instant (étape 9).

## Étape 6 : mettre le site sur GitHub

1. Crée un compte sur **github.com**.
2. **+** (en haut à droite) → **New repository**. Nom : `worldultimaterecords`, **Public**, **Create repository**.
3. Clique sur **uploading an existing file**.
4. Ouvre le dossier `site`, sélectionne **tout son contenu** (fichiers + dossiers `img` et `vendor`) et glisse-le dans la page. Il faut glisser le contenu, pas le dossier `site` lui-même.
5. **Commit changes**.

## Étape 7 : activer GitHub Pages

1. Dans le dépôt : **Settings** → **Pages**.
2. *Source* : **Deploy from a branch**. *Branch* : **main**, **/ (root)**. **Save**.
3. Après 1 à 2 minutes, l'adresse s'affiche : `https://ton-pseudo.github.io/worldultimaterecords/`

## Étape 8 : relier Supabase à l'adresse du site

Nécessaire pour les e-mails « Protéger mon compte ».

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL** : colle l'adresse de l'étape 7. Dans **Redirect URLs**, ajoute la même adresse. **Save**.

## Étape 9 : activer l'anti-robot (recommandé avant de partager le lien)

Sans ça, un robot peut créer des milliers de faux joueurs. Il faut faire **les trois parties d'affilée**, sinon plus personne ne peut se connecter entre-temps.

**A. Chez Cloudflare**

1. Crée un compte gratuit sur **cloudflare.com**.
2. Menu **Turnstile** → **Add widget** (ou *Add site*).
3. Nom : `WorldUltimateRecords`. **Hostname** : `ton-pseudo.github.io` (et ton nom de domaine si tu en as un). Mode : **Managed**. Valide.
4. Note la **Site Key** et la **Secret Key**.

**B. Chez Supabase**

1. **Authentication** → **Attack Protection** (parfois *Bot and Abuse Protection*).
2. Active **Enable CAPTCHA protection**, choisis **Cloudflare Turnstile**, colle la **Secret Key**. **Save**.

**C. Dans `config.js`**

1. Colle la **Site Key** dans `turnstileSiteKey`, puis envoie le fichier modifié sur GitHub (Add file → Upload files).

## Étape 10 : tester

1. Ouvre le site : la pastille indique **Classement en ligne** (en vert).
2. Choisis un pseudo, joue à un défi navigateur, enregistre : le score apparaît dans **Records** et dans **Profil**.
3. Lance un défi caméra : coche les deux cases d'accord, filme une courte tentative, envoie-la.
4. En bas de page, **Espace admin** → connecte-toi : l'onglet devient « Records (1) », valide ta vidéo.
5. Depuis un autre téléphone, signale la vidéo : elle apparaît dans « Signalements ».

---

## Les nouveautés et comment elles marchent

- **Mentions légales et confidentialité** : page « Mentions légales » en bas du site, remplie avec `editorName` et `contactEmail`. C'est un modèle sérieux, mais pas un avis d'avocat : relis-le, surtout si le site devient commercial (publicité, sponsors).
- **Accord avant chaque vidéo** : le joueur doit cocher « J'ai 15 ans ou plus, ou l'accord d'un parent » et « J'accepte que ma vidéo soit publique ». La base de données refuse toute vidéo sans cet accord.
- **Signalements** : bouton « Signaler » sur les vidéos (Shorts, tableau des tentatives). Au 3ᵉ signalement, la vidéo est masquée automatiquement. Dans « Signalements », tu la rétablis ou la supprimes. Une vidéo refusée est supprimée du stockage.
- **Pseudos réservés** : un pseudo appartient à un seul joueur. Impossible de jouer sous le nom d'un autre.
- **Profils** : clique sur un pseudo pour voir ses médailles (or, argent, bronze = 1ᵉʳ, 2ᵉ, 3ᵉ d'un classement) et ses meilleurs scores. Dans « Profil », chaque joueur peut supprimer une tentative ou tout son compte.
- **Compte protégé** : un joueur peut ajouter son e-mail pour retrouver son pseudo sur un autre appareil (lien de connexion par e-mail, sans mot de passe).
- **Notifications** : la cloche en haut prévient quand une vidéo est validée ou refusée, quand un record est battu, et toi quand des vidéos attendent. Avec « Activer les notifications », le navigateur affiche aussi une alerte, tant que le site est ouvert dans un onglet.
- **Défis de la semaine** : 3 défis changent automatiquement chaque lundi, avec un classement de la semaine.
- **3 essais par défi et par jour** (heure de Paris) : un essai est compté dès que le joueur lance un défi navigateur ou un enregistrement vidéo, même s'il abandonne. Supprimer une tentative ne rend pas l'essai. Les défis navigateur restent jouables sans limite en « mode entraînement » (score non enregistré). Toi, en tant qu'admin, tu n'as pas de limite.
- **Pass Néon** : abonnement mensuel ou annuel (étape 11). Essais illimités, badge PASS doré qui évolue avec l'ancienneté (1 mois, 3 mois, 6 mois, 1 an), pseudo en couleur, statistiques détaillées avec courbe de progression, ligues privées, vidéos vérifiées en priorité, 3 défis exclusifs, mise en avant dans les Shorts, 30 records créés au lieu de 5.
- **Ligues privées** : un membre du Pass Néon crée une ligue (5 maximum) et partage son code ou son lien. Tout le monde peut la rejoindre gratuitement (50 membres maximum) et voit le classement entre membres, défi par défi. Seuls les membres voient le nom et la liste de la ligue.
- **Limites anti-abus** : 40 tentatives par heure et par joueur, 30 signalements par jour, 30 records créés par joueur.
- **Battles d'aura** (onglet « Aura ») : les joueurs postent une vidéo sur le thème de leur choix, en indiquant s'ils y gagnent ou y perdent de l'aura, ou lancent un duel. Les votes d'une vidéo « perdre de l'aura » comptent en négatif. Une vidéo peut être importée depuis l'appareil (60 s et 48 Mo maximum) ou filmée sur le site. Le premier joueur qui relève un duel devient l'adversaire, puis les votes restent ouverts 7 jours. Chaque vote reçu vaut +100 aura (visible sur le profil et dans le « Hall of aura »). Un joueur a 1 vote par battle, modifiable. Il ne peut pas voter pour lui-même ni dans un duel où il joue. Toutes les vidéos d'aura passent par toi avant d'être publiées : tu les valides ou les refuses en haut de l'onglet Aura. Les vidéos importées peuvent avoir été montées : refuse tout ce qui est dangereux, humiliant ou filmé sans l'accord des personnes. Les façons de gagner ou perdre de l'aura sont votées par les joueurs (👍) : les plus votées montent en haut des listes. Les joueurs peuvent en proposer de nouvelles ; tu les valides ou les refuses en haut de l'onglet Aura.

## Étape 11 : le Pass Néon (abonnement payant)

### Avant de commencer : ce qu'il faut pour encaisser de l'argent

Dès que le site vend quelque chose, la loi française change pour toi :

- **Être majeur.** Stripe exige un titulaire de compte majeur. Si tu ne l'es pas, c'est un parent qui doit ouvrir le compte et le statut ci-dessous.
- **Avoir un statut**, le plus simple étant la **micro-entreprise** : inscription gratuite sur le site officiel autoentrepreneur.urssaf.fr. Tu obtiens un **SIRET** à mettre dans `config.js` (`siret`). Tu déclares ensuite ton chiffre d'affaires à l'URSSAF.
- **TVA** : tant que tu restes sous le seuil de franchise, tu ne factures pas de TVA. Mets alors `tvaMention: "TVA non applicable, art. 293 B du CGI"` dans `config.js`.
- **Un médiateur de la consommation** : obligatoire pour vendre à des particuliers. Plusieurs organismes proposent une adhésion annuelle pour les petites entreprises. Indique son nom et son site dans `mediator`.
- **Relire les conditions de l'abonnement** (page Mentions légales, section « Conditions de l'abonnement ») : c'est un modèle, pas un avis juridique. Un expert-comptable ou la CCI peut te conseiller.

Tant que `stripePaymentLink` est vide, le site affiche « L'abonnement ouvre bientôt » et la limite de 3 essais s'applique quand même.

### A. Créer l'abonnement chez Stripe

Commence en **mode test** (interrupteur « Test mode » en haut du tableau de bord Stripe) : aucun vrai paiement.

1. Crée un compte sur **stripe.com**.
2. **Catalogue de produits** → **Ajouter un produit** : nom `Pass Néon`, prix **2,99 €**, **Récurrent**, **Mensuel**. Enregistre.
   Ajoute aussi un **deuxième prix** au même produit : **24,99 €**, **Récurrent**, **Annuel**.
3. **Payment Links** → **Nouveau** → choisis le produit Pass Néon. Dans l'onglet **Après le paiement**, choisis **Ne pas afficher de page de confirmation** et **Rediriger vers ton site** : `https://ton-pseudo.github.io/worldultimaterecords/#membre`. Crée le lien et copie-le dans `stripePaymentLink`. Refais la même chose avec le prix annuel et copie ce second lien dans `stripePaymentLinkYearly` (laisse-le vide si tu ne veux proposer que le mensuel).
4. **Paramètres** → **Facturation** → **Portail client** : active-le, autorise la **résiliation**, puis copie le **lien de connexion** (`https://billing.stripe.com/p/login/...`) dans `stripePortalLink`.
5. **Développeurs** → **Clés API** : copie la **clé secrète** (`sk_test_...`). Elle ne va **jamais** dans `config.js`.

### B. Installer la fonction qui active le Pass

1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nom : `stripe-webhook` (exactement). Remplace le code d'exemple par tout le contenu de `supabase/functions/stripe-webhook/index.ts`, puis **Deploy**.
3. Dans les réglages de la fonction, **désactive « Verify JWT »** (ou « Enforce JWT verification ») et enregistre. Stripe ne peut pas envoyer de jeton Supabase ; c'est la signature Stripe qui sécurise la fonction.
4. **Edge Functions** → **Secrets** : ajoute `STRIPE_SECRET_KEY` avec ta clé secrète Stripe.

### C. Relier Stripe à la fonction

1. Stripe → **Développeurs** → **Webhooks** (ou **Destinations d'événements**) → **Ajouter**.
2. URL : `https://TON-PROJET.supabase.co/functions/v1/stripe-webhook` (le début est ton `supabaseUrl`).
3. Événements : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Copie le **secret de signature** (`whsec_...`) et ajoute-le dans Supabase → Edge Functions → Secrets sous le nom `STRIPE_WEBHOOK_SECRET`.

### D. Tester

1. Envoie le `config.js` mis à jour sur GitHub.
2. Sur le site : protège ton pseudo avec un mot de passe (onglet Profil, voir étape 12), puis va sur **Pass Néon**, coche les 3 cases et clique sur **S'abonner**.
3. Paie avec la carte de test `4242 4242 4242 4242`, une date future et n'importe quel code.
4. Reviens sur le site : en quelques secondes, le badge **PASS** apparaît et les essais deviennent illimités.
5. Si rien ne se passe : Stripe → Webhooks → ton point de terminaison → regarde les erreurs. Une erreur 400 = mauvais `STRIPE_WEBHOOK_SECRET`. Une erreur 401 = « Verify JWT » encore activé.

### E. Passer en vrai

Désactive le mode test dans Stripe, puis refais **A**, **C** et l'étape 4 de **B** avec les clés et le lien **live**. Mets à jour `config.js` et les secrets Supabase.

À savoir : pour une carte européenne, Stripe prélève environ 0,25 € + 1,5 % par paiement, plus environ 0,7 % pour la gestion des abonnements. Sur 2,99 €, il te reste donc environ 2,65 € par abonné et par mois, avant cotisations URSSAF. Vérifie les tarifs à jour sur stripe.com/fr/pricing.

## Étape 12 : le mot de passe du pseudo (retrouver ses records partout)

Sans cette étape, un joueur est lié à son navigateur : s'il change de téléphone ou vide son navigateur, il perd son pseudo et ses records. Avec elle, il ajoute un mot de passe à son pseudo (onglet **Profil → Mon compte**) et se reconnecte sur n'importe quel appareil avec **pseudo + mot de passe** : il retrouve ses records, ses vidéos, ses battles d'aura et son Pass Néon.

1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nom : `pseudo-account` (exactement). Remplace le code d'exemple par tout le contenu de `supabase/functions/pseudo-account/index.ts`, puis **Deploy**.
3. Laisse **« Verify JWT » activé** (c'est le réglage par défaut). Aucun secret à ajouter.
4. Colle à nouveau `supabase.sql` dans **SQL Editor** → **Run** (ça crée la petite table anti-force brute : 10 essais ratés par pseudo bloquent 15 minutes).
5. Teste : onglet **Profil** → **Protéger mon pseudo** avec un mot de passe. Ouvre ensuite le site dans une fenêtre de navigation privée, va dans **Profil** → **Déjà un pseudo avec mot de passe ?**, entre ton pseudo et ton mot de passe : tes records doivent réapparaître.

Bon à savoir :
- Le mot de passe est stocké par Supabase (chiffré), jamais dans ta base ni sur GitHub. Toi non plus tu ne peux pas le voir.
- Un joueur qui oublie son mot de passe peut aussi lier un e-mail (« Autre option : l'e-mail ») pour recevoir un lien de connexion.
- Si l'enregistrement du mot de passe affiche une erreur d'adresse e-mail invalide, ouvre `index.ts` et remplace `joueurs.wur.invalid` par `joueurs.invalid`, et fais pareil dans `app.js` (ligne `TECH_MAIL`), puis redéploie.

## Langues (10 langues)

Un sélecteur en haut à droite affiche le site en français, anglais, chinois, hindi, espagnol, arabe (de droite à gauche), bengali, portugais, russe ou indonésien. Au premier passage, le site choisit la langue du navigateur ; le choix du joueur est ensuite mémorisé.

- `i18n.js` fait la traduction, les dictionnaires sont dans le dossier `site/i18n/` (un fichier `.json` par langue).
- Le français reste la langue de base : pour corriger une traduction, ouvre le fichier de la langue et modifie le texte à droite du texte français.
- Les pseudos, les noms et règles des records créés par les joueurs ne sont pas traduits.
- Si tu ajoutes un nouveau texte au site, il s'affichera en français dans les autres langues tant que tu ne l'ajoutes pas aux dictionnaires.

## Nom de domaine (facultatif, environ 10 €/an)

1. Achète `worldultimaterecords.fr` (ou `.com`) chez un registraire : OVH, Gandi, Namecheap…
2. GitHub → **Settings** → **Pages** → **Custom domain** : tape ton domaine → **Save**.
3. Chez le registraire, zone DNS, ajoute :
   - 4 enregistrements **A** pour `@` : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 enregistrement **CNAME** pour `www` → `ton-pseudo.github.io`
4. Attends jusqu'à 24 h, puis coche **Enforce HTTPS** dans GitHub Pages.
5. Mets à jour la **Site URL** Supabase (étape 8) et ajoute le domaine dans Turnstile (étape 9A).

## Mettre à jour une installation existante

1. Sur GitHub, ouvre le dossier `site`, puis envoie tous les fichiers du dossier `site` (Add file → Upload files) en les glissant, **y compris le dossier `i18n`** (glisse le dossier entier dans la zone d'envoi). Ils remplacent les anciens. Pour `config.js`, prends le nouveau fichier et recopie-y tes valeurs actuelles (clés Supabase, etc.) : il contient de nouvelles lignes pour le Pass Néon et les mentions légales.
2. Supabase → SQL Editor → colle tout `supabase.sql` → **Run**. Aucun score n'est supprimé. Les joueurs existants gardent leur pseudo quand c'est possible.
3. Fais les étapes 8, 9 et 11 si ce n'est pas déjà fait.

**Important pour les nouveaux défis navigateur et les battles d'aura** : refais bien l'étape 2 ci-dessus (coller `supabase.sql` et **Run**). Sinon, les scores des nouveaux défis ne pourront pas être enregistrés, et l'onglet Aura restera vide.

## Bon à savoir

- **Offre gratuite Supabase** : 1 Go pour les vidéos, soit plusieurs centaines de tentatives d'une minute. Un projet gratuit est mis en pause après 7 jours sans visite : relance-le depuis le tableau de bord.
- **E-mails** : le service d'e-mails inclus dans Supabase est très limité (quelques e-mails par heure). Si beaucoup de joueurs protègent leur compte, branche un service gratuit comme Brevo dans **Authentication** → **Emails** → **SMTP Settings**.
- **Notifications quand le site est fermé** (e-mail ou téléphone) : elles demandent un petit serveur (Supabase Edge Functions). C'est faisable dans une prochaine étape.
- **Vidéos** : 50 Mo maximum chacune. Le gainage est limité à 25 minutes de vidéo.
- **Caméra** : uniquement sur une adresse `https://` (c'est le cas de GitHub Pages). Sur iPhone, iOS 14.3 ou plus récent.
- **« Mode démo » affiché** : `config.js` est vide ou mal rempli (guillemets, virgules).
- **Erreur de connexion** : vérifie l'étape 3 (connexion anonyme) et, si tu as fait l'étape 9, que la clé Turnstile est bien dans Supabase **et** dans `config.js`.
