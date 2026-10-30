import { trouverExercice } from '../domaine/bibliotheque';
import type { SeanceRealisee } from '../domaine/types';
import { formaterSerie } from './FinSeance';

interface Props {
  historique: SeanceRealisee[];
  onRetour(): void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

export function Historique({ historique, onRetour }: Props) {
  const trie = [...historique].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <main class="ecran historique">
      <h1>Historique</h1>
      {trie.length === 0 && <p class="bandeau">Aucune séance pour l'instant</p>}
      <ul class="carte">
        {trie.map(s => (
          <li key={s.id}>
            <details>
              <summary>
                {formatDate(s.date)} — Séance {s.type} · semaine {s.semaine}
                {s.douleurDos ? ' · dos' : ''}
              </summary>
              <ul class="recap">
                {s.exercices.map(e => (
                  <li key={e.prevu.exerciceId}>
                    <strong>{trouverExercice(e.prevu.exerciceId)?.nom ?? e.prevu.exerciceId}</strong>
                    <ul>
                      {e.series.map((x, i) => (
                        <li key={i} class={x.difficulte}>
                          {formaterSerie(e.prevu.exerciceId, x)}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
      <button class="principal" onClick={onRetour}>
        Retour
      </button>
    </main>
  );
}
