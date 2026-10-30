import type { SeanceRealisee, TypeSeance } from './types';

export const SEANCES_PAR_BLOC = 18;
const ORDRE = ['A', 'B', 'C'] as const;

export function estPrincipale(t: TypeSeance): boolean {
  return t !== 'D';
}

function principalesDuBloc(historique: SeanceRealisee[], blocId: string): SeanceRealisee[] {
  return historique
    .filter(s => s.blocId === blocId && estPrincipale(s.type))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function prochainType(historique: SeanceRealisee[], blocId: string): 'A' | 'B' | 'C' {
  const seances = principalesDuBloc(historique, blocId);
  const derniere = seances[seances.length - 1];
  if (!derniere) return 'A';
  return ORDRE[(ORDRE.indexOf(derniere.type as 'A' | 'B' | 'C') + 1) % ORDRE.length];
}

export function semaineDuBloc(historique: SeanceRealisee[], blocId: string): number {
  return Math.floor(principalesDuBloc(historique, blocId).length / 3) + 1;
}

export function blocTermine(historique: SeanceRealisee[], blocId: string): boolean {
  return principalesDuBloc(historique, blocId).length >= SEANCES_PAR_BLOC;
}
