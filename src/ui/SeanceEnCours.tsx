import { useEffect, useState } from 'preact/hooks';
import { ajusterApresSerie } from '../domaine/ajustements';
import { trouverExercice } from '../domaine/bibliotheque';
import type { Difficulte, ExercicePrevu, SeancePrevue, SeanceRealisee, SerieRealisee } from '../domaine/types';
import { CLES, stockageNavigateur, type Stockage } from '../stockage/local';
import { alerterFinRepos, creerMinuteur, formaterDuree, garderEcranAllume } from './minuteur';

interface Props {
  seance: SeancePrevue;
  douleurDos: boolean;
  onTerminer(s: SeanceRealisee): void;
  stockage?: Stockage;
  maintenant?: () => number;
}

export interface EtatSeance {
  seanceId: string;
  seance: SeancePrevue;
  douleurDos: boolean;
  debut: string;
  exercices: ExercicePrevu[];
  realisees: SerieRealisee[][];
  iExo: number;
  iSerie: number;
  finRepos: number | null;
}

export const NOMS_BLOCS = { explosivite: 'Explosivité', force: 'Force', unilateral: 'Unilatéral', gainage: 'Gainage · bas du dos' } as const;

export function cible(ex: ExercicePrevu, iSerie: number): string {
  const def = trouverExercice(ex.exerciceId);
  const s = ex.series[iSerie];
  if (def?.mesure === 'secondes') return s.charge > 0 ? `${s.reps} s · ${s.charge} kg` : `${s.reps} s`;
  return def && def.increment > 0 ? `${s.reps} reps · ${s.charge} kg` : `${s.reps} reps`;
}

function etatInitial(seance: SeancePrevue, douleurDos: boolean, stockage: Stockage, maintenant: () => number): EtatSeance {
  const sauve = stockage.lire<EtatSeance>(CLES.enCours);
  if (sauve?.seanceId === seance.id) return sauve;
  return {
    seanceId: seance.id,
    seance,
    douleurDos,
    debut: new Date(maintenant()).toISOString(),
    exercices: seance.exercices,
    realisees: seance.exercices.map(() => []),
    iExo: 0,
    iSerie: 0,
    finRepos: null,
  };
}

function resultat(seance: SeancePrevue, etat: EtatSeance, douleurDos: boolean): SeanceRealisee {
  return {
    id: seance.id,
    type: seance.type,
    blocId: seance.blocId,
    semaine: seance.semaine,
    date: etat.debut,
    douleurDos,
    exercices: etat.exercices
      .map((prevu, i) => ({ prevu, series: etat.realisees[i] }))
      .filter(e => e.series.length > 0),
  };
}

export function SeanceEnCours({ seance, douleurDos, onTerminer, stockage = stockageNavigateur, maintenant = Date.now }: Props) {
  const [etat, setEtat] = useState(() => etatInitial(seance, douleurDos, stockage, maintenant));
  const [, rafraichir] = useState(0);
  const ex = etat.exercices[etat.iExo];
  const def = trouverExercice(ex.exerciceId);
  const serie = ex.series[etat.iSerie];
  const [reps, setReps] = useState(String(serie.reps));
  const [charge, setCharge] = useState(String(serie.charge));

  useEffect(() => {
    setReps(String(serie.reps));
    setCharge(String(serie.charge));
  }, [etat.iExo, etat.iSerie, serie.reps, serie.charge]);

  useEffect(() => {
    let liberer = () => {};
    void garderEcranAllume().then(f => (liberer = f));
    return () => liberer();
  }, []);

  useEffect(() => {
    if (etat.finRepos === null) return;
    const minuteur = creerMinuteur({ fin: etat.finRepos }, maintenant);
    const id = setInterval(() => {
      if (minuteur.fini()) {
        alerterFinRepos();
        changer({ ...etat, finRepos: null });
      } else rafraichir(n => n + 1);
    }, 250);
    return () => clearInterval(id);
  }, [etat.finRepos]);

  function changer(suivant: EtatSeance) {
    stockage.ecrire(CLES.enCours, suivant);
    setEtat(suivant);
  }

  function terminer(final: EtatSeance) {
    stockage.effacer(CLES.enCours);
    onTerminer(resultat(seance, final, douleurDos));
  }

  function valider(difficulte: Difficulte) {
    const faite: SerieRealisee = {
      reps: Number(reps) || 0,
      charge: def && def.increment > 0 ? Number(charge) || 0 : serie.charge,
      difficulte,
    };
    const realisees = etat.realisees.map((r, i) => (i === etat.iExo ? [...r, faite] : r));
    const exercices = etat.exercices.map((e, i) => (i === etat.iExo ? ajusterApresSerie(e, etat.iSerie, faite) : e));
    const dernierExo = etat.iExo === exercices.length - 1;
    const derniereSerie = etat.iSerie === ex.series.length - 1;
    const base = { ...etat, exercices, realisees };

    if (dernierExo && derniereSerie) return terminer(base);
    changer({
      ...base,
      iExo: derniereSerie ? etat.iExo + 1 : etat.iExo,
      iSerie: derniereSerie ? 0 : etat.iSerie + 1,
      finRepos: maintenant() + ex.repos * 1000,
    });
  }

  function terminerPlusTot() {
    if (window.confirm('Terminer la séance maintenant ? Les séries faites seront enregistrées.')) terminer(etat);
  }

  const total = etat.exercices.length;
  const barre = (
    <div class="progression-seance">
      Exercice {etat.iExo + 1}/{total}
    </div>
  );

  if (etat.finRepos !== null) {
    const restant = creerMinuteur({ fin: etat.finRepos }, maintenant).restant();
    return (
      <main class="ecran repos">
        {barre}
        <h2>Repos</h2>
        <div class="chrono">{formaterDuree(restant)}</div>
        <p class="ensuite">
          Ensuite : {def?.nom} — série {etat.iSerie + 1}/{ex.series.length} ({cible(ex, etat.iSerie)})
        </p>
        <button class="principal" onClick={() => changer({ ...etat, finRepos: null })}>
          Passer le repos
        </button>
        <button class="discret" onClick={terminerPlusTot}>
          Terminer la séance
        </button>
      </main>
    );
  }

  const libelleReps = def?.mesure === 'secondes' ? 'Secondes' : 'Reps';
  return (
    <main class="ecran seance">
      {barre}
      <p class="bloc">{def ? NOMS_BLOCS[def.bloc] : ''}</p>
      <h2>{def?.nom ?? ex.exerciceId}</h2>
      {ex.remplace && <p class="note">Remplace {trouverExercice(ex.remplace)?.nom} (dos)</p>}
      <p class="serie">
        Série {etat.iSerie + 1}/{ex.series.length}
      </p>
      <p class="cible">{cible(ex, etat.iSerie)}</p>
      {def && (
        <details class="technique">
          <summary>Technique</summary>
          <ul>
            {def.pointsCles.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <a href={def.video} target="_blank" rel="noopener noreferrer">
            Voir une démonstration vidéo
          </a>
        </details>
      )}
      <div class="saisie">
        <label>
          {libelleReps}
          <input type="number" inputMode="numeric" value={reps} onInput={e => setReps(e.currentTarget.value)} />
        </label>
        {def && def.increment > 0 && (
          <label>
            Charge (kg)
            <input type="number" inputMode="decimal" step="0.5" value={charge} onInput={e => setCharge(e.currentTarget.value)} />
          </label>
        )}
      </div>
      <div class="difficultes">
        <button class="facile" onClick={() => valider('facile')}>Facile</button>
        <button class="correct" onClick={() => valider('correct')}>Correct</button>
        <button class="dur" onClick={() => valider('dur')}>Dur</button>
      </div>
      <button class="discret" onClick={terminerPlusTot}>
        Terminer la séance
      </button>
    </main>
  );
}
