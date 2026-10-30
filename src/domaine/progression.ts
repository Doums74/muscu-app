import { trouverExercice } from './bibliotheque';
import { arrondiInf, arrondiProche, chargeReference, derniereFois } from './calcul';
import { validerSeance } from './gardefous';
import { prochainType, semaineDuBloc } from './rotation';
import type { ExercicePrevu, ExerciceProgramme, ExerciceRealise, Programme, SeancePrevue, SeanceRealisee, TypeSeance } from './types';

export function dateLocale(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const aEchoue = (ex: ExerciceRealise, repsMin: number) => ex.series.some(s => s.reps < repsMin);

function exerciceSuivant(ep: ExerciceProgramme, historique: SeanceRealisee[], semaine: number): ExercicePrevu {
  const def = trouverExercice(ep.exerciceId);
  const increment = def?.increment ?? 0;
  const [derniere, avantDerniere] = derniereFois(historique, ep.exerciceId, 2);
  let nbSeries = ep.series;
  let charge = ep.chargeDepart;
  let reps = ep.repsMax;

  if (increment === 0) {
    // Poids du corps : on progresse en répétitions (ou secondes) dans la fourchette du programme.
    charge = 0;
    reps = ep.repsMin;
    if (derniere) {
      const pas = def?.bloc === 'echauffement' ? 30 : def?.mesure === 'secondes' ? 5 : 1;
      const cibles = derniere.prevu.series.map(s => s.reps);
      const cibleAtteinte =
        derniere.series.length >= cibles.length && derniere.series.every((s, i) => s.reps >= (cibles[i] ?? cibles[0]));
      reps = cibleAtteinte ? Math.max(...derniere.series.map(s => s.reps)) + pas : cibles[0];
      reps = Math.min(ep.repsMax, Math.max(ep.repsMin, reps));
    }
  } else if (derniere) {
    const base = chargeReference(derniere, increment);
    const toutReussi =
      derniere.series.length >= derniere.prevu.series.length && derniere.series.every(s => s.reps >= ep.repsMax);
    if (semaine === 6) charge = arrondiInf(base * 0.9, increment);
    else if (toutReussi) charge = base + increment;
    else if (avantDerniere && aEchoue(derniere, ep.repsMin) && aEchoue(avantDerniere, ep.repsMin))
      charge = arrondiProche(base * 0.9, increment);
    else charge = base;
  }

  if (semaine === 6) {
    nbSeries = Math.max(1, nbSeries - 1);
    if (!derniere && increment > 0) charge = arrondiInf(charge * 0.9, increment);
  }

  return {
    exerciceId: ep.exerciceId,
    series: Array.from({ length: nbSeries }, () => ({ reps, charge })),
    repsMin: ep.repsMin,
    repsMax: ep.repsMax,
    repos: ep.repos,
  };
}

export function genererSeanceLocale(
  programme: Programme,
  historique: SeanceRealisee[],
  type: TypeSeance,
  maintenant: Date,
): SeancePrevue {
  const semaine = semaineDuBloc(historique, programme.blocId);
  return {
    id: `${dateLocale(maintenant)}-${type}`,
    type,
    blocId: programme.blocId,
    semaine,
    source: 'locale',
    genereeLe: maintenant.toISOString(),
    exercices: programme.seances[type].map(ep => exerciceSuivant(ep, historique, semaine)),
  };
}

export function choisirSeance(
  programme: Programme,
  prochaine: SeancePrevue | null,
  historique: SeanceRealisee[],
  maintenant: Date,
): { seance: SeancePrevue; avertissements: string[] } {
  const avertissements: string[] = [];
  const tour = prochainType(historique, programme.blocId);
  const utilisable = prochaine && prochaine.blocId === programme.blocId && !historique.some(h => h.id === prochaine.id);
  if (utilisable && prochaine.type !== 'D' && prochaine.type !== tour) {
    avertissements.push(`Séance préparée (${prochaine.type}) ignorée : c'est au tour de la séance ${tour}.`);
  } else if (utilisable) {
    const v = validerSeance(prochaine, historique);
    avertissements.push(...v.avertissements);
    if (v.seance) return { seance: v.seance, avertissements };
  }
  return { seance: genererSeanceLocale(programme, historique, tour, maintenant), avertissements };
}
