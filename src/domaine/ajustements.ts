import { trouverExercice } from './bibliotheque';
import { arrondiProche, chargeMax, derniereFois } from './calcul';
import type { ExercicePrevu, SeancePrevue, SeanceRealisee, SerieRealisee } from './types';

/** Remplace les exercices à risque pour le dos par leur version douce. */
export function appliquerDouleurDos(seance: SeancePrevue, historique: SeanceRealisee[]): SeancePrevue {
  return {
    ...seance,
    exercices: seance.exercices.map(ex => {
      const def = trouverExercice(ex.exerciceId);
      if (!def?.risqueDos || !def.remplacementDos) return ex;
      const derniere = derniereFois(historique, def.remplacementDos)[0];
      const charge = derniere ? chargeMax(derniere) : 0;
      return {
        ...ex,
        exerciceId: def.remplacementDos,
        remplace: ex.exerciceId,
        series: ex.series.map(s => ({ ...s, charge })),
      };
    }),
  };
}

/** Série notée « dur » et pas finie : les séries suivantes baissent d'environ 8 %, au moins d'un incrément. */
export function ajusterApresSerie(ex: ExercicePrevu, indexSerie: number, faite: SerieRealisee): ExercicePrevu {
  const increment = trouverExercice(ex.exerciceId)?.increment ?? 0;
  const cible = ex.series[indexSerie]?.reps ?? 0;
  if (faite.difficulte !== 'dur' || faite.reps >= cible || increment === 0) return ex;

  const nouvelle = Math.max(0, Math.min(arrondiProche(faite.charge * 0.92, increment), faite.charge - increment));
  return {
    ...ex,
    series: ex.series.map((s, i) => (i > indexSerie ? { ...s, charge: nouvelle } : s)),
  };
}
