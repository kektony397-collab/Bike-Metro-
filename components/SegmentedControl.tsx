import React from 'react';
import { FareModeKey } from '../types';

interface SegmentedControlProps {
  selected: FareModeKey;
  onChange: (mode: FareModeKey) => void;
  disabled?: boolean;
}

const modes: { key: FareModeKey; label: string; icon: string }[] = [
  { key: 'BikeTaxi', label: 'Taxi', icon: 'two_wheeler' },
  { key: 'BikeBoost', label: 'Boost', icon: 'electric_bolt' },
  { key: 'BikeMetro', label: 'Metro', icon: 'train' },
];

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ selected, onChange, disabled }) => {
  return (
    <div className="flex w-full rounded-full border border-md-sys-color-outline bg-md-sys-color-surface h-12 overflow-hidden">
      {modes.map((mode) => {
        const isSelected = selected === mode.key;
        return (
          <button
            key={mode.key}
            disabled={disabled}
            onClick={() => onChange(mode.key)}
            className={`
              flex-1 flex items-center justify-center gap-2 text-sm font-medium relative ripple
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${
                isSelected
                  ? 'bg-md-sys-color-secondaryContainer text-md-sys-color-onSecondaryContainer'
                  : 'text-md-sys-color-onSurface hover:bg-md-sys-color-surfaceVariant/20'
              }
            `}
          >
            {isSelected && <span className="material-symbols-rounded text-lg">check</span>}
            {!isSelected && <span className="material-symbols-rounded text-lg">{mode.icon}</span>}
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};
