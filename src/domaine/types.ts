export type Bloc = 'echauffement' | 'explosivite' | 'force' | 'unilateral' | 'gainage';
export type TypeSeance = 'A' | 'B' | 'C' | 'D';
export type Difficulte = 'facile' | 'correct' | 'dur';
export type Mesure = 'reps' | 'secondes';

export interface Exercice {
  id: string;
  nom: string;
  bloc: Bloc;
  mesure: Mesure;
  increment: number; // kg ; 0 = poids du corps
  risqueDos: boolean;
  remplacementDos?: string; // obligatoire si risqueDos
  pointsCles: [string, string, string];
  video: string;
}

export interface ExerciceProgramme {
  exerciceId: string;
  series: number;
  repsMin: number;
  repsMax: number;
  chargeDepart: number;
  repos: number;
}

export interface Programme {
  blocId: string;
  debut: string; // date ISO AAAA-MM-JJ
  seances: Record<TypeSeance, ExerciceProgramme[]>;
  notes?: string;
}

export interface SeriePrevue {
  reps: number; // cible (reps ou secondes)
  charge: number;
}

export interface ExercicePrevu {
  exerciceId: string;
  series: SeriePrevue[];
  repsMin: number;
  repsMax: number;
  repos: number;
  remplace?: string; // id d'origine si remplacé (douleur dos)
}

export interface SeancePrevue {
  id: string; // ex. "2026-11-02-A"
  type: TypeSeance;
  blocId: string;
  semaine: number;
  source: 'claude' | 'locale';
  genereeLe: string;
  exercices: ExercicePrevu[];
  message?: string;
}

export interface SerieRealisee {
  reps: number;
  charge: number;
  difficulte: Difficulte;
}

export interface ExerciceRealise {
  prevu: ExercicePrevu;
  series: SerieRealisee[];
}

export interface SeanceRealisee {
  id: string;
  type: TypeSeance;
  blocId: string;
  semaine: number;
  date: string; // ISO complet
  douleurDos: boolean;
  exercices: ExerciceRealise[];
}
