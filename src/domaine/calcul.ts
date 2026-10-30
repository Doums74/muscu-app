import type { ExerciceRealise, SeanceRealisee } from './types';

const net = (x: number) => Number(x.toFixed(3));

export function arrondiInf(x: number, increment: number): number {
  if (increment === 0) return x;
  return net(Math.floor(x / increment + 1e-9) * increment);
}

export function arrondiProche(x: number, increment: number): number {
  if (increment === 0) return x;
  return net(Math.round(x / increment) * increment);
}

/** Hausse maximale autorisée d'une séance à l'autre : +5 %, mais toujours au moins un incrément. */
export function augmentationMax(charge: number, increment: number): number {
  if (increment === 0) return 0;
  return Math.max(increment, arrondiInf(charge * 0.05, increment));
}

/** Les n dernières réalisations d'un exercice, de la plus récente à la plus ancienne. */
export function derniereFois(historique: SeanceRealisee[], exerciceId: string, n = 1): ExerciceRealise[] {
  const trie = [...historique].sort((a, b) => a.date.localeCompare(b.date));
  const resultat: ExerciceRealise[] = [];
  for (let i = trie.length - 1; i >= 0 && resultat.length < n; i--) {
    for (const ex of trie[i].exercices) {
      if (ex.prevu.exerciceId === exerciceId) {
        resultat.push(ex);
        break;
      }
    }
  }
  return resultat;
}

/** Charge maximale soulevée lors d'une réalisation. */
export function chargeMax(ex: ExerciceRealise): number {
  return Math.max(0, ...ex.series.map(s => s.charge));
}

/**
 * Charge de référence d'une réalisation : la charge max soulevée, mais jamais plus d'une hausse
 * autorisée au-dessus de la charge prévue — une faute de frappe (200 au lieu de 20) ne doit pas
 * faire monter les séances suivantes.
 */
export function chargeReference(ex: ExerciceRealise, increment: number): number {
  const reelle = chargeMax(ex);
  const prevue = Math.max(0, ...ex.prevu.series.map(s => s.charge));
  if (prevue === 0) return reelle;
  return Math.min(reelle, prevue + augmentationMax(prevue, increment));
}
