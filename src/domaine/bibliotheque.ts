import type { Exercice } from './types';

const yt = (recherche: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(recherche).replace(/%20/g, '+')}`;

export const BIBLIOTHEQUE: Exercice[] = [
  // --- Explosivité ---
  {
    id: 'saut-boite', nom: 'Saut sur box', bloc: 'explosivite', mesure: 'reps', increment: 0, risqueDos: false,
    pointsCles: ['Box basse au début (40-50 cm), pieds largeur de hanches', 'Élan des bras, saut puis réception douce genoux fléchis', 'Redescendre en marchant, jamais en sautant en arrière'],
    video: yt('box jump technique débutant'),
  },
  {
    id: 'saut-longueur', nom: 'Saut en longueur sans élan', bloc: 'explosivite', mesure: 'reps', increment: 0, risqueDos: false,
    pointsCles: ['Pieds largeur de hanches, bras en arrière', 'Pousser fort vers l\'avant avec les hanches et les bras', 'Se réceptionner stable, genoux alignés sur les pieds'],
    video: yt('broad jump technique'),
  },
  {
    id: 'saut-lateral', nom: 'Bonds latéraux (patineur)', bloc: 'explosivite', mesure: 'reps', increment: 0, risqueDos: false,
    pointsCles: ['Sur une jambe, buste légèrement penché', 'Bondir sur le côté et se réceptionner sur l\'autre jambe', 'Tenir 1 s stable à chaque réception (genou dans l\'axe)'],
    video: yt('skater jumps technique'),
  },
  {
    id: 'pompes-explosives', nom: 'Pompes explosives', bloc: 'explosivite', mesure: 'reps', increment: 0, risqueDos: false,
    pointsCles: ['Position de pompe, corps gainé de la tête aux talons', 'Descendre contrôlé puis pousser le plus vite possible', 'Débuter mains surélevées sur un banc si trop dur'],
    video: yt('explosive push up technique'),
  },
  {
    id: 'lancer-medecine-ball-poitrine', nom: 'Lancer de medecine ball poitrine (mur)', bloc: 'explosivite', mesure: 'reps', increment: 1, risqueDos: false,
    pointsCles: ['Face au mur à 2-3 m, ballon contre la poitrine', 'Pousser des jambes puis lancer fort des deux bras', 'Rattraper, se replacer, chaque lancer à fond'],
    video: yt('medicine ball chest pass wall'),
  },
  {
    id: 'lancer-rotatif-medecine-ball', nom: 'Lancer rotatif de medecine ball (mur)', bloc: 'explosivite', mesure: 'reps', increment: 1, risqueDos: false,
    pointsCles: ['De profil au mur, ballon à la hanche', 'La rotation part des pieds et des hanches, pas des bras', 'Bras presque tendus, dos neutre — idéal pour la boxe'],
    video: yt('medicine ball rotational throw wall'),
  },
  {
    id: 'kettlebell-swing', nom: 'Kettlebell swing', bloc: 'explosivite', mesure: 'reps', increment: 4, risqueDos: true, remplacementDos: 'saut-boite',
    pointsCles: ['Charnière de hanche : fesses en arrière, dos plat', 'Projeter les hanches vers l\'avant, les bras ne lèvent pas', 'Ne jamais arrondir le bas du dos en bas du mouvement'],
    video: yt('kettlebell swing technique débutant'),
  },

  // --- Force ---
  {
    id: 'squat-barre', nom: 'Squat à la barre', bloc: 'force', mesure: 'reps', increment: 2.5, risqueDos: true, remplacementDos: 'goblet-squat',
    pointsCles: ['Barre sur les trapèzes, pieds largeur d\'épaules', 'Descendre hanches et genoux ensemble, poitrine haute', 'Garder le dos neutre : on arrête avant que le bassin bascule'],
    video: yt('squat barre technique débutant'),
  },
  {
    id: 'goblet-squat', nom: 'Goblet squat', bloc: 'force', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Haltère tenu contre la poitrine, coudes vers le bas', 'Descendre entre les genoux, buste droit', 'Talons au sol, genoux dans l\'axe des pieds'],
    video: yt('goblet squat technique'),
  },
  {
    id: 'souleve-terre-roumain', nom: 'Soulevé de terre roumain (haltères)', bloc: 'force', mesure: 'reps', increment: 2, risqueDos: true, remplacementDos: 'hip-thrust',
    pointsCles: ['Genoux légèrement fléchis, haltères le long des cuisses', 'Pousser les fesses en arrière, dos plat, jusqu\'à l\'étirement des ischios', 'Remonter en serrant les fessiers, sans hyper-cambrer'],
    video: yt('romanian deadlift dumbbell technique'),
  },
  {
    id: 'hip-thrust', nom: 'Hip thrust', bloc: 'force', mesure: 'reps', increment: 2.5, risqueDos: false,
    pointsCles: ['Haut du dos sur le banc, barre sur les hanches (avec mousse)', 'Pousser par les talons jusqu\'à l\'alignement genoux-hanches-épaules', 'Menton rentré, côtes basses : c\'est le fessier qui travaille, pas le dos'],
    video: yt('hip thrust technique'),
  },
  {
    id: 'developpe-couche-halteres', nom: 'Développé couché haltères', bloc: 'force', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Omoplates serrées, pieds au sol', 'Descendre les haltères au niveau de la poitrine, coudes à 45°', 'Pousser en contrôlant, sans rebond'],
    video: yt('développé couché haltères technique'),
  },
  {
    id: 'developpe-epaules-assis', nom: 'Développé épaules assis (haltères)', bloc: 'force', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Assis dos contre le dossier, abdos serrés', 'Pousser les haltères au-dessus de la tête', 'Ne pas cambrer le bas du dos pour finir la répétition'],
    video: yt('seated dumbbell shoulder press technique'),
  },
  {
    id: 'rowing-barre', nom: 'Rowing barre', bloc: 'force', mesure: 'reps', increment: 2.5, risqueDos: true, remplacementDos: 'rowing-poitrine-appuyee',
    pointsCles: ['Buste penché à 45°, dos plat, genoux fléchis', 'Tirer la barre vers le nombril en serrant les omoplates', 'Garder le buste immobile, pas d\'élan'],
    video: yt('barbell row technique débutant'),
  },
  {
    id: 'rowing-poitrine-appuyee', nom: 'Rowing poitrine appuyée', bloc: 'force', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Poitrine contre un banc incliné, haltères bras tendus', 'Tirer les coudes vers l\'arrière en serrant les omoplates', 'Redescendre lentement, sans décoller la poitrine'],
    video: yt('chest supported dumbbell row'),
  },
  {
    id: 'tirage-vertical', nom: 'Tirage vertical (poulie haute)', bloc: 'force', mesure: 'reps', increment: 2.5, risqueDos: false,
    pointsCles: ['Prise un peu plus large que les épaules, buste légèrement incliné', 'Tirer la barre vers le haut de la poitrine, coudes vers le bas', 'Remonter contrôlé, ne pas tirer avec le dos'],
    video: yt('lat pulldown technique'),
  },
  {
    id: 'presse-cuisses', nom: 'Presse à cuisses', bloc: 'force', mesure: 'reps', increment: 5, risqueDos: false,
    pointsCles: ['Pieds largeur d\'épaules au milieu de la plateforme', 'Descendre tant que le bas du dos reste collé au dossier', 'Pousser sans verrouiller les genoux en haut'],
    video: yt('leg press technique'),
  },

  // --- Unilatéral ---
  {
    id: 'fente-arriere', nom: 'Fente arrière (haltères)', bloc: 'unilateral', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Grand pas en arrière, buste droit', 'Descendre jusqu\'à frôler le sol avec le genou arrière', 'Remonter en poussant sur le talon avant (reps par jambe)'],
    video: yt('reverse lunge dumbbell technique'),
  },
  {
    id: 'fente-marchee', nom: 'Fentes marchées', bloc: 'unilateral', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Haltères le long du corps, regard devant', 'Pas ample, genou avant au-dessus de la cheville', 'Enchaîner sans s\'arrêter, buste stable (reps par jambe)'],
    video: yt('walking lunges technique'),
  },
  {
    id: 'split-squat-bulgare', nom: 'Split squat bulgare', bloc: 'unilateral', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Pied arrière posé sur un banc, pied avant loin devant', 'Descendre verticalement, genou avant stable', 'Commencer sans charge pour trouver l\'équilibre (reps par jambe)'],
    video: yt('bulgarian split squat technique'),
  },
  {
    id: 'step-up', nom: 'Step-up sur banc', bloc: 'unilateral', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Pied entier sur le banc (hauteur genou)', 'Monter en poussant sur la jambe du haut, pas d\'élan de l\'autre', 'Redescendre lentement (reps par jambe)'],
    video: yt('dumbbell step up technique'),
  },
  {
    id: 'fente-laterale', nom: 'Fente latérale', bloc: 'unilateral', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Grand pas sur le côté, l\'autre jambe reste tendue', 'Fesses en arrière, genou fléchi dans l\'axe du pied', 'Revenir en poussant fort — très utile pour le ski (reps par côté)'],
    video: yt('lateral lunge technique'),
  },
  {
    id: 'souleve-terre-une-jambe', nom: 'Soulevé de terre sur une jambe', bloc: 'unilateral', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Un haltère dans la main opposée à la jambe d\'appui', 'Basculer le buste en tendant la jambe libre derrière, dos plat', 'Bassin horizontal, ne pas pivoter (reps par jambe)'],
    video: yt('single leg romanian deadlift technique'),
  },
  {
    id: 'rowing-un-bras', nom: 'Rowing un bras (haltère)', bloc: 'unilateral', mesure: 'reps', increment: 2, risqueDos: false,
    pointsCles: ['Main et genou sur le banc, dos plat', 'Tirer l\'haltère vers la hanche, coude près du corps', 'Ne pas tourner le buste pour tirer (reps par bras)'],
    video: yt('one arm dumbbell row technique'),
  },

  // --- Gainage / bas du dos ---
  {
    id: 'bird-dog', nom: 'Bird dog', bloc: 'gainage', mesure: 'reps', increment: 0, risqueDos: false,
    pointsCles: ['À quatre pattes, dos plat, mains sous les épaules', 'Tendre bras et jambe opposés, tenir 5 s', 'Le bassin ne bouge pas : imaginer un verre d\'eau sur le dos (reps par côté)'],
    video: yt('bird dog exercise McGill'),
  },
  {
    id: 'mcgill-curl-up', nom: 'Curl-up McGill', bloc: 'gainage', mesure: 'reps', increment: 0, risqueDos: false,
    pointsCles: ['Sur le dos, une jambe pliée, mains sous le bas du dos', 'Décoller légèrement tête et épaules, tenir 8-10 s', 'Ne pas enrouler la colonne ni tirer sur la nuque'],
    video: yt('McGill curl up'),
  },
  {
    id: 'extension-lombaire', nom: 'Extension lombaire (banc 45°)', bloc: 'gainage', mesure: 'reps', increment: 2, risqueDos: true, remplacementDos: 'bird-dog',
    pointsCles: ['Bassin calé au bord du coussin, corps aligné', 'Descendre en pliant les hanches, dos neutre', 'Remonter jusqu\'à l\'alignement, jamais au-delà (pas d\'hyper-extension)'],
    video: yt('45 degree back extension technique'),
  },
  {
    id: 'pallof-press', nom: 'Pallof press (poulie)', bloc: 'gainage', mesure: 'reps', increment: 2.5, risqueDos: false,
    pointsCles: ['De profil à la poulie, poignée contre la poitrine', 'Tendre les bras devant soi sans laisser le buste tourner', 'Gainage anti-rotation : utile pour la boxe (reps par côté)'],
    video: yt('pallof press technique'),
  },
  {
    id: 'planche', nom: 'Planche', bloc: 'gainage', mesure: 'secondes', increment: 0, risqueDos: false,
    pointsCles: ['Sur les avant-bras, coudes sous les épaules', 'Serrer fessiers et abdos, corps droit', 'S\'arrêter dès que le bas du dos se creuse'],
    video: yt('planche gainage technique'),
  },
  {
    id: 'planche-laterale', nom: 'Planche latérale', bloc: 'gainage', mesure: 'secondes', increment: 0, risqueDos: false,
    pointsCles: ['Sur un avant-bras, coude sous l\'épaule', 'Hanches hautes, corps aligné', 'Débuter genoux au sol si besoin (temps par côté)'],
    video: yt('side plank McGill'),
  },
  {
    id: 'dead-bug', nom: 'Dead bug', bloc: 'gainage', mesure: 'reps', increment: 0, risqueDos: false,
    pointsCles: ['Sur le dos, bras tendus, genoux à 90°', 'Descendre bras et jambe opposés lentement', 'Le bas du dos reste plaqué au sol (reps par côté)'],
    video: yt('dead bug exercise technique'),
  },
  {
    id: 'marche-valise', nom: 'Marche valise (un haltère)', bloc: 'gainage', mesure: 'secondes', increment: 2, risqueDos: false,
    pointsCles: ['Un haltère lourd d\'un seul côté', 'Marcher droit, épaules à l\'horizontale', 'Ne pas se pencher vers l\'haltère (temps par côté)'],
    video: yt('suitcase carry technique'),
  },
  {
    id: 'pont-fessier', nom: 'Pont fessier', bloc: 'gainage', mesure: 'reps', increment: 0, risqueDos: false,
    pointsCles: ['Sur le dos, pieds à plat près des fesses', 'Monter les hanches en serrant les fessiers, tenir 2 s', 'Ne pas cambrer : côtes basses'],
    video: yt('glute bridge technique'),
  },
];

const parId = new Map(BIBLIOTHEQUE.map(e => [e.id, e]));

export function trouverExercice(id: string): Exercice | undefined {
  return parId.get(id);
}
