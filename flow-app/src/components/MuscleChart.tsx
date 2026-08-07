import { type MuscleTotal } from '../muscleAggregate';

interface MuscleChartProps {
  totals: MuscleTotal[];
  title?: string;
  /** Compact bars for inside section cards. */
  compact?: boolean;
  /** Shown when there is nothing to display yet. */
  emptyHint?: string;
}

/**
 * Horizontal bar chart of muscle-group engagement. Pure CSS, no chart
 * library. Values are 0–100 relative to the most-worked group in scope.
 */
export function MuscleChart({ totals, title, compact, emptyHint }: MuscleChartProps) {
  if (totals.length === 0) {
    return (
      <div className="muscle-chart muscle-chart-empty">
        {title && <div className="muscle-chart-title">{title}</div>}
        <p className="muscle-chart-hint">{emptyHint ?? 'No muscle data yet.'}</p>
      </div>
    );
  }

  return (
    <div className={`muscle-chart${compact ? ' muscle-chart-compact' : ''}`}>
      {title && <div className="muscle-chart-title">{title}</div>}
      <ul className="muscle-bars">
        {totals.map((t) => (
          <li key={t.group} className="muscle-bar-row">
            <span className="muscle-bar-label">{t.group}</span>
            <span className="muscle-bar-track">
              <span
                className="muscle-bar-fill"
                style={{ width: `${t.value}%`, background: intensityColor(t.value) }}
              />
            </span>
            <span className="muscle-bar-value">{t.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Green (low) → amber (mid) → red (high) gradient by value. */
function intensityColor(value: number): string {
  if (value >= 75) return '#f87171';
  if (value >= 50) return '#fb923c';
  if (value >= 30) return '#fbbf24';
  return '#34d399';
}
