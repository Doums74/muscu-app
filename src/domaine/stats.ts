import { trouverExercice } from './bibliotheque';
import { chargeMax } from './calcul';
import { estPrincipale } from './rotation';
import type { Programme, SeanceRealisee } from './types';

function debutSemaine(d: Date): Date {
  const lundi = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7));
  return lundi;
}

export function regulariteSemaine(historique: SeanceRealisee[], maintenant: Date): { faites: number; objectif: 3 } {
  const debut = debutSemaine(maintenant);
  const fin = new Date(debut);
  fin.setDate(fin.getDate() + 7);
  const faites = historique.filter(s => {
    const d = new Date(s.date);
    return estPrincipale(s.type) && d >= debut && d < fin;
  }).length;
  return { faites, objectif: 3 };
}

export function courbe(historique: SeanceRealisee[], exerciceId: string): { date: string; charge: number }[] {
  return historique
    .flatMap(s => s.exercices.filter(e => e.prevu.exerciceId === exerciceId).map(e => ({ date: s.date, charge: chargeMax(e) })))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function exercicesPrincipaux(programme: Programme): string[] {
  const ids = (['A', 'B', 'C'] as const).flatMap(t => programme.seances[t].map(e => e.exerciceId));
  return [...new Set(ids)].filter(id => trouverExercice(id)?.bloc === 'force');
}
