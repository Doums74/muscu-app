# Muscu — spécification (validée le 2026-10-30)

App personnelle de musculation pour débutant : elle dit quelle série faire, combien de répétitions, quelle charge et combien de repos, et fait progresser le programme d'après les séances passées.

> Les données personnelles (âge, poids, taille) vivent dans le dépôt privé `muscu-data/profil.json`, jamais dans ce dépôt public.

## Objectif et programme

- Débutant, salle de sport complète. Objectif : tonique sans prendre de volume, au service de la boxe anglaise, du foot et du ski. Priorité : renforcer le bas du dos.
- 3 séances principales par semaine, aux jours choisis par l'utilisateur, dans l'ordre A → B → C → A… Séance D optionnelle (gainage, bas du dos, mobilité, cardio court), proposée sans être imposée.
- Chaque séance (A, B, C et D) commence par un **échauffement à la corde à sauter** chronométré : 3 manches de 3 min au départ, 1 min de repos entre les manches, +30 s par manche quand les 3 sont faites, jusqu'à 3 × 5 min (15 min). *(ajouté le 2026-10-30)*
- Chaque séance principale enchaîne ensuite 4 blocs : **explosivité** → **force** → **unilatéral** → **gainage / bas du dos**. Force en 8 à 10 répétitions au bloc 1 (apprentissage), puis 5 à 8 à partir du bloc 2. *(révisé le 2026-10-30)*
- Chaque séance A, B, C est complète (jambes, poussée, tirage, unilatéral, bas du dos) ; les mouvements clés reviennent 2 fois par semaine. Prévention foot chaque semaine : Nordic assisté (ischios) et planche de Copenhague (adducteurs). *(ajouté le 2026-10-30)*
- Blocs de 6 semaines (18 séances principales) : semaine 1 = apprentissage et calibrage avec charges légères ; semaines 2 à 5 = progression ; semaine 6 = semaine allégée. Puis nouveau bloc avec variantes et bilan écrit.
- Repos par défaut, modulables par l'IA dans ces plages : explosivité 90–120 s, force 120–180 s, unilatéral et accessoires 60–90 s, gainage 45–60 s.
- Chaque exercice : 3 points clés (placement, mouvement, erreur à éviter) + lien vidéo de démonstration.

## Fonctionnement

1. **Mac** : l'utilisateur lance « prépare ma séance » dans Claude Code (abonnement, pas d'API). Claude pose le check-in (énergie, courbatures, douleur au dos, sport récent ou prévu), lit l'historique, écrit la prochaine séance, la fait valider par les garde-fous, puis la pousse sur GitHub.
2. **Salle, Pixel 7** : la web app guide série par série. Saisie du poids, des répétitions et de la difficulté (facile, correct, dur). Minuteur de repos automatique avec vibration et bip, écran maintenu allumé.
3. **Fin de séance** : le résultat est poussé dans le dépôt privé, ou mis en file d'attente si hors ligne.

**Premier jour** : Claude crée le premier bloc de 6 semaines depuis le profil et le présente pour validation avant de le pousser.

## Garde-fous (codés, appliqués à toute séance venant de l'IA)

- Jamais plus de +5 % de charge d'une séance à l'autre sur un exercice.
- Uniquement des exercices de la bibliothèque validée.
- Semaine allégée planifiée (semaine 6).
- Si l'IA ne répond pas ou si la séance n'a pas été préparée : l'app génère elle-même la séance suivante en double progression. Toutes les répétitions faites la dernière fois → la charge monte ; sinon elle reste ; 2 échecs de suite → elle redescend un peu.
- Douleur au dos signalée sur place → les exercices à risque sont remplacés par des versions douces prévues dans la bibliothèque.
- Série notée « dur » et pas finie → −5 à −10 % de charge sur les séries suivantes de l'exercice.

## Technique

- Web app installable (PWA), hors connexion, sur Google Pixel 7 (Android, Chrome).
- Code : dépôt GitHub **public** `muscu-app`, hébergé sur GitHub Pages.
- Données : dépôt GitHub **privé** `muscu-data`. Le téléphone y accède avec une clé fine-grained limitée à ce dépôt (Contents read/write), saisie une fois et stockée uniquement sur le téléphone.
- Coût total : 0 €.

## V1

Inclus : historique des séances, courbe de progression des exercices principaux, compteur de régularité « x/3 séances cette semaine ».
Hors V1 : nutrition, photos, mensurations, IA en temps réel à la salle.
