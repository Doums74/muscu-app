import { useEffect, useState } from 'preact/hooks';
import { ajusterApresSerie } from '../domaine/ajustements';
import { trouverExercice } from '../domaine/bibliotheque';
import type { Difficulte, ExercicePrevu, SeancePrevue, SeanceRealisee, SerieRealisee } from '../domaine/types';
import { mettreEnAttente } from '../stockage/depot';
import { CLES, stockageNavigateur, type Stockage } from '../stockage/local';
import { alerterFinRepos, creerMinuteur, formaterDuree, garderEcranAllume } from './minuteur';

interface Props {
  seance: SeancePrevue;
  douleurDos: boolean;
  onTerminer(s: SeanceRealisee): void;
  onAbandon?(): void;
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
  debutEffort?: number | null; // échauffement chronométré en cours
}

export const NOMS_BLOCS = { echauffement: 'Échauffement', explosivite: 'Explosivité', force: 'Force', unilateral: 'Unilatéral', gainage: 'Gainage · bas du dos' } as const;

export function cible(ex: ExercicePrevu, iSerie: number): string {
  const def = trouverExercice(ex.exerciceId);
  const s = ex.series[iSerie];
  if (def?.bloc === 'echauffement') return formaterDuree(s.reps);
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

/** Accepte « 17,5 » comme « 17.5 » (clavier français). */
const nombre = (texte: string) => Number(texte.trim().replace(',', '.')) || 0;

export function SeanceEnCours({ seance, douleurDos, onTerminer, onAbandon, stockage = stockageNavigateur, maintenant = Date.now }: Props) {
  const [etat, setEtat] = useState(() => etatInitial(seance, douleurDos, stockage, maintenant));
  const [, rafraichir] = useState(0);
  const ex = etat.exercices[etat.iExo];
  const def = trouverExercice(ex.exerciceId);
  const serie = ex.series[etat.iSerie];
  const [reps, setReps] = useState(String(serie.reps));
  const [charge, setCharge] = useState(String(serie.charge));

  // Charge pré-remplie : celle de la série précédente du même exercice (si elle n'a pas été ratée), sinon la prévue.
  const precedente = etat.realisees[etat.iExo][etat.iSerie - 1];
  const rateePrecedente = precedente && precedente.difficulte === 'dur' && precedente.reps < ex.series[etat.iSerie - 1].reps;
  const chargeProposee = precedente && !rateePrecedente ? precedente.charge : serie.charge;

  useEffect(() => {
    setReps(String(serie.reps));
    setCharge(String(chargeProposee));
  }, [etat.iExo, etat.iSerie, serie.reps, chargeProposee]);

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

  useEffect(() => {
    if (etat.debutEffort == null) return;
    const debutEffort = etat.debutEffort;
    const id = setInterval(() => {
      if (maintenant() - debutEffort >= serie.reps * 1000) {
        alerterFinRepos();
        enregistrer({ reps: serie.reps, charge: 0, difficulte: 'correct' });
      } else rafraichir(n => n + 1);
    }, 250);
    return () => clearInterval(id);
  }, [etat.debutEffort]);

  function changer(suivant: EtatSeance) {
    stockage.ecrire(CLES.enCours, suivant);
    setEtat(suivant);
  }

  function terminer(final: EtatSeance) {
    const r = resultat(seance, final, douleurDos);
    mettreEnAttente(stockage, r); // d'abord en sécurité, ensuite seulement on efface la séance en cours
    stockage.effacer(CLES.enCours);
    onTerminer(r);
  }

  function valider(difficulte: Difficulte) {
    const faite: SerieRealisee = {
      reps: nombre(reps),
      charge: def && def.increment > 0 ? nombre(charge) : serie.charge,
      difficulte,
    };
    const prevue = serie.charge;
    if (prevue > 0 && faite.charge > prevue * 1.2 + (def?.increment ?? 0)) {
      if (!window.confirm(`Tu as saisi ${faite.charge} kg alors que ${prevue} kg sont prévus. C'est bien ça ?`)) return;
    }
    enregistrer(faite);
  }

  function enregistrer(faite: SerieRealisee) {
    const realisees = etat.realisees.map((r, i) => (i === etat.iExo ? [...r, faite] : r));
    const exercices = etat.exercices.map((e, i) => (i === etat.iExo ? ajusterApresSerie(e, etat.iSerie, faite) : e));
    const dernierExo = etat.iExo === exercices.length - 1;
    const derniereSerie = etat.iSerie === ex.series.length - 1;
    const base = { ...etat, exercices, realisees, debutEffort: null };

    if (dernierExo && derniereSerie) return terminer(base);
    changer({
      ...base,
      iExo: derniereSerie ? etat.iExo + 1 : etat.iExo,
      iSerie: derniereSerie ? 0 : etat.iSerie + 1,
      finRepos: maintenant() + ex.repos * 1000,
    });
  }

  function terminerPlusTot() {
    if (etat.realisees.every(r => r.length === 0)) {
      if (window.confirm('Abandonner cette séance ? Rien ne sera enregistré.')) {
        stockage.effacer(CLES.enCours);
        onAbandon?.();
      }
      return;
    }
    if (window.confirm('Terminer la séance maintenant ? Les séries faites seront enregistrées.')) terminer(etat);
  }

  const total = etat.exercices.length;
  const barre = (
    <div class="progression-seance">
      Exercice {etat.iExo + 1}/{total}
    </div>
  );

  if (etat.debutEffort != null) {
    const restant = Math.max(0, serie.reps - Math.floor((maintenant() - etat.debutEffort) / 1000));
    const ecoule = () => Math.min(serie.reps, Math.round((maintenant() - (etat.debutEffort ?? 0)) / 1000));
    return (
      <main class="ecran repos">
        {barre}
        <h2>{def?.nom}</h2>
        <p class="ensuite">
          Manche {etat.iSerie + 1}/{ex.series.length}
        </p>
        <div class="chrono">{formaterDuree(restant)}</div>
        <button class="principal" onClick={() => enregistrer({ reps: ecoule(), charge: 0, difficulte: 'correct' })}>
          Arrêter l'échauffement
        </button>
      </main>
    );
  }

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

  if (def?.bloc === 'echauffement') {
    return (
      <main class="ecran seance">
        {barre}
        <p class="bloc">{NOMS_BLOCS.echauffement}</p>
        <h2>{def.nom}</h2>
        <p class="serie">
          Manche {etat.iSerie + 1}/{ex.series.length}
        </p>
        <p class="cible">{cible(ex, etat.iSerie)}</p>
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
        <button class="principal" onClick={() => changer({ ...etat, debutEffort: maintenant() })}>
          Démarrer
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
            <input type="text" inputMode="decimal" value={charge} onInput={e => setCharge(e.currentTarget.value)} />
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
