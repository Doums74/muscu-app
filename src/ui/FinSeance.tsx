import { useEffect, useState } from 'preact/hooks';
import { trouverExercice } from '../domaine/bibliotheque';
import type { SeanceRealisee, SerieRealisee } from '../domaine/types';
import { enregistrerSeance } from '../stockage/depot';
import type { ClientGitHub } from '../stockage/github';
import type { Stockage } from '../stockage/local';

interface Props {
  seance: SeanceRealisee;
  client: ClientGitHub;
  stockage: Stockage;
  onRetour(): void;
}

export function formaterSerie(exerciceId: string, s: SerieRealisee): string {
  const def = trouverExercice(exerciceId);
  const unite = def?.mesure === 'secondes' ? ' s' : '';
  return s.charge > 0 ? `${s.reps}${unite} × ${s.charge} kg` : `${s.reps}${unite}`;
}

export function FinSeance({ seance, client, stockage, onRetour }: Props) {
  const [statut, setStatut] = useState<'envoi' | 'envoyee' | 'en-attente'>('envoi');

  useEffect(() => {
    void enregistrerSeance(client, stockage, seance).then(setStatut);
  }, [seance.id]);

  const libelle = {
    envoi: 'Envoi en cours…',
    envoyee: 'Séance envoyée ✓',
    'en-attente': 'Enregistrée — sera envoyée au retour du réseau',
  }[statut];

  return (
    <main class="ecran fin">
      <h1>Bravo !</h1>
      <p class={`bandeau ${statut === 'en-attente' ? 'attente' : ''}`}>{libelle}</p>
      <ul class="recap">
        {seance.exercices.map(e => (
          <li key={e.prevu.exerciceId}>
            <strong>{trouverExercice(e.prevu.exerciceId)?.nom ?? e.prevu.exerciceId}</strong>
            <ul>
              {e.series.map((s, i) => (
                <li key={i} class={s.difficulte}>
                  {formaterSerie(e.prevu.exerciceId, s)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <button class="principal" onClick={onRetour}>
        Retour à l'accueil
      </button>
    </main>
  );
}
