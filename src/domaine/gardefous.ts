import { trouverExercice } from './bibliotheque';
import { arrondiInf, augmentationMax, chargeMax, derniereFois } from './calcul';
import type { Bloc, Exercice, ExercicePrevu, Programme, SeancePrevue, SeanceRealisee, TypeSeance } from './types';

export const PLAGES_REPOS: Record<Bloc, [number, number]> = {
  explosivite: [90, 120],
  force: [120, 180],
  unilateral: [60, 90],
  gainage: [45, 60],
};

const ORDRE_BLOCS: Bloc[] = ['explosivite', 'force', 'unilateral', 'gainage'];
const TYPES: TypeSeance[] = ['A', 'B', 'C', 'D'];
const MAX_SERIES = 6;
const PLAGE_REPS = { reps: [1, 30], secondes: [5, 120] } as const;

const borner = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
const estNombre = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const estObjet = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

function formeExerciceValide(x: unknown): x is ExercicePrevu {
  return (
    estObjet(x) &&
    typeof x.exerciceId === 'string' &&
    Array.isArray(x.series) &&
    x.series.every(s => estObjet(s) && estNombre(s.reps) && estNombre(s.charge)) &&
    estNombre(x.repsMin) &&
    estNombre(x.repsMax) &&
    estNombre(x.repos)
  );
}

function formeSeanceValide(x: unknown): x is SeancePrevue {
  return (
    estObjet(x) &&
    typeof x.id === 'string' &&
    TYPES.includes(x.type as TypeSeance) &&
    typeof x.blocId === 'string' &&
    estNombre(x.semaine) &&
    Array.isArray(x.exercices) &&
    x.exercices.every(formeExerciceValide)
  );
}

function corrigerExercice(
  ex: ExercicePrevu,
  def: Exercice,
  semaine: number,
  historique: SeanceRealisee[],
  avertir: (m: string) => void,
): ExercicePrevu {
  const [rMin, rMax] = PLAGE_REPS[def.mesure];
  const [reposMin, reposMax] = PLAGES_REPOS[def.bloc];

  let series = ex.series.slice(0, MAX_SERIES);
  if (ex.series.length > MAX_SERIES) avertir(`${def.nom} : ${ex.series.length} séries ramenées à ${MAX_SERIES}.`);

  const derniere = derniereFois(historique, def.id)[0];
  let plafond = Infinity;
  if (derniere && def.increment > 0) {
    const max = chargeMax(derniere);
    plafond = semaine === 6 ? arrondiInf(max * 0.9, def.increment) : max + augmentationMax(max, def.increment);
  }

  series = series.map(s => {
    const reps = borner(Math.round(s.reps), rMin, rMax);
    if (reps !== s.reps) avertir(`${def.nom} : cible de ${s.reps} ramenée à ${reps}.`);
    let charge = def.increment === 0 ? 0 : Math.max(0, s.charge);
    if (charge > plafond) {
      avertir(`${def.nom} : charge de ${charge} kg ramenée à ${plafond} kg (${semaine === 6 ? 'semaine allégée' : 'hausse maximale'}).`);
      charge = plafond;
    }
    return { reps, charge };
  });

  const repos = borner(ex.repos, reposMin, reposMax);
  if (repos !== ex.repos) avertir(`${def.nom} : repos de ${ex.repos} s ramené à ${repos} s.`);

  const repsMin = borner(ex.repsMin, rMin, rMax);
  const repsMax = borner(Math.max(ex.repsMax, repsMin), rMin, rMax);

  return { ...ex, series, repsMin, repsMax, repos };
}

export function validerSeance(
  brut: unknown,
  historique: SeanceRealisee[],
): { seance: SeancePrevue | null; avertissements: string[] } {
  const avertissements: string[] = [];
  const avertir = (m: string) => avertissements.push(m);

  if (!formeSeanceValide(brut)) {
    return { seance: null, avertissements: ['Séance préparée illisible : elle est ignorée.'] };
  }

  const exercices: ExercicePrevu[] = [];
  for (const ex of brut.exercices) {
    const def = trouverExercice(ex.exerciceId);
    if (!def) {
      avertir(`Exercice inconnu « ${ex.exerciceId} » retiré de la séance.`);
      continue;
    }
    if (ex.series.length === 0) {
      avertir(`${def.nom} : aucune série prévue, exercice retiré.`);
      continue;
    }
    exercices.push(corrigerExercice(ex, def, brut.semaine, historique, avertir));
  }

  if (exercices.length === 0) {
    avertir('Aucun exercice valide dans la séance préparée.');
    return { seance: null, avertissements };
  }

  return {
    seance: { ...brut, source: brut.source ?? 'claude', genereeLe: brut.genereeLe ?? '', exercices },
    avertissements,
  };
}

export function validerProgramme(brut: unknown): { programme: Programme | null; erreurs: string[] } {
  const erreurs: string[] = [];

  if (!estObjet(brut) || typeof brut.blocId !== 'string' || typeof brut.debut !== 'string' || !estObjet(brut.seances)) {
    return { programme: null, erreurs: ['Programme illisible (blocId, debut ou seances manquant).'] };
  }

  const seances = brut.seances as Record<string, unknown>;
  for (const type of TYPES) {
    const liste = seances[type];
    if (!Array.isArray(liste) || liste.length === 0) {
      erreurs.push(`Séance ${type} absente ou vide.`);
      continue;
    }

    const blocs: Bloc[] = [];
    for (const ex of liste) {
      if (!estObjet(ex) || typeof ex.exerciceId !== 'string' || ![ex.series, ex.repsMin, ex.repsMax, ex.chargeDepart, ex.repos].every(estNombre)) {
        erreurs.push(`Séance ${type} : exercice mal formé.`);
        continue;
      }
      const def = trouverExercice(ex.exerciceId);
      if (!def) {
        erreurs.push(`Séance ${type} : exercice inconnu « ${ex.exerciceId} ».`);
        continue;
      }
      blocs.push(def.bloc);
      const [min, max] = PLAGES_REPOS[def.bloc];
      if ((ex.repos as number) < min || (ex.repos as number) > max)
        erreurs.push(`Séance ${type} : repos de ${def.nom} hors plage (${min}-${max} s).`);
      if ((ex.repsMin as number) > (ex.repsMax as number))
        erreurs.push(`Séance ${type} : ${def.nom} a repsMin > repsMax.`);
    }

    if (type === 'D') {
      if (!blocs.includes('gainage')) erreurs.push('Séance D : il faut au moins un exercice de gainage.');
    } else {
      const manquants = ORDRE_BLOCS.filter(b => !blocs.includes(b));
      if (manquants.length) erreurs.push(`Séance ${type} : bloc(s) manquant(s) : ${manquants.join(', ')}.`);
      const rangs = blocs.map(b => ORDRE_BLOCS.indexOf(b));
      if (rangs.some((r, i) => i > 0 && r < rangs[i - 1]))
        erreurs.push(`Séance ${type} : les blocs doivent suivre l'ordre explosivité → force → unilatéral → gainage.`);
    }
  }

  return { programme: erreurs.length ? null : (brut as unknown as Programme), erreurs };
}
