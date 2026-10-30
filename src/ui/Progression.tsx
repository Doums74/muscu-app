import { trouverExercice } from '../domaine/bibliotheque';
import { courbe, exercicesPrincipaux } from '../domaine/stats';
import type { Programme, SeanceRealisee } from '../domaine/types';

interface Props {
  programme: Programme | null;
  historique: SeanceRealisee[];
  onRetour(): void;
}

const L = 320;
const H = 140;
const MARGE = 24;

function Graphique({ points }: { points: { date: string; charge: number }[] }) {
  const charges = points.map(p => p.charge);
  const min = Math.min(...charges);
  const max = Math.max(...charges);
  const x = (i: number) => (points.length === 1 ? L / 2 : MARGE + (i * (L - 2 * MARGE)) / (points.length - 1));
  const y = (c: number) => (max === min ? H / 2 : H - MARGE - ((c - min) * (H - 2 * MARGE)) / (max - min));
  const trace = points.map((p, i) => `${x(i)},${y(p.charge)}`).join(' ');
  return (
    <svg class="graphique" viewBox={`0 0 ${L} ${H}`} role="img" aria-label="Évolution de la charge">
      <polyline class="ligne" points={trace} />
      {points.map((p, i) => (
        <circle key={p.date} class="point" cx={x(i)} cy={y(p.charge)} r={4} />
      ))}
      <text x={4} y={12}>{max} kg</text>
      <text x={4} y={H - 4}>{min} kg</text>
    </svg>
  );
}

export function Progression({ programme, historique, onRetour }: Props) {
  const series = (programme ? exercicesPrincipaux(programme) : [])
    .map(id => ({ id, points: courbe(historique, id) }))
    .filter(s => s.points.length > 0);

  return (
    <main class="ecran progression">
      <h1>Progression</h1>
      {series.length === 0 && <p class="bandeau">Pas encore de données</p>}
      {series.map(({ id, points }) => (
        <section class="carte" key={id}>
          <h2>{trouverExercice(id)?.nom ?? id}</h2>
          <p class="meta">
            {points[0].charge} → {points[points.length - 1].charge} kg
          </p>
          <Graphique points={points} />
        </section>
      ))}
      <button class="principal" onClick={onRetour}>
        Retour
      </button>
    </main>
  );
}
