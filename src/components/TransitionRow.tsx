import { type Transition, type TransitionSide } from '../types';
import { TransitionSidePanel } from './TrackPanel';

interface TransitionRowProps {
  transition: Transition;
  index: number;
  onChange: (transition: Transition) => void;
  onRemove: () => void;
}

export function TransitionRow({ transition, index, onChange, onRemove }: TransitionRowProps) {
  return (
    <div className="transition-row">
      <div className="transition-row-header">
        <span className="transition-index">{index + 1}</span>
        <button className="btn-danger btn-sm" onClick={onRemove} title="Remove transition">×</button>
      </div>
      <div className="transition-row-body">
        <div className="transition-half">
          <span className="transition-half-label transition-half-label-out">OUT</span>
          <TransitionSidePanel
            side={transition.left}
            onChange={(left: TransitionSide) => onChange({ ...transition, left })}
          />
        </div>
        <div className="transition-mid-divider" />
        <div className="transition-half">
          <span className="transition-half-label transition-half-label-in">IN</span>
          <TransitionSidePanel
            side={transition.right}
            onChange={(right: TransitionSide) => onChange({ ...transition, right })}
          />
        </div>
      </div>
    </div>
  );
}
