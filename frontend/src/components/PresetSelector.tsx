import React from 'react';
import { Sparkles } from 'lucide-react';
import { PRESETS, PresetInfo } from '../types/simulation';

interface PresetSelectorProps {
  currentPresetId: number;
  onSelectPreset: (presetId: number) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentPresetId,
  onSelectPreset,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-neutral-300 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Archetypal Reaction Regimes</span>
        </div>
        <span className="text-[10px] text-neutral-500 font-mono">Gray-Scott Model</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRESETS.map((preset: PresetInfo) => {
          const isActive = preset.id === currentPresetId;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={`flex flex-col p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'border-fuchsia-400 bg-neutral-900/90 shadow-[0_0_12px_rgba(255,0,128,0.25)] ring-1 ring-fuchsia-400/40'
                  : 'border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-800/50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`text-xs font-semibold tracking-wide ${
                    isActive ? 'text-fuchsia-200' : 'text-neutral-200'
                  }`}
                >
                  {preset.name}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-400 font-mono">
                  #{preset.id + 1}
                </span>
              </div>

              <p className="text-[10px] text-neutral-400 line-clamp-1 leading-tight mb-2">
                {preset.tagline}
              </p>

              <div className="mt-auto flex items-center justify-between text-[9px] font-mono text-neutral-500 pt-1 border-t border-neutral-800/50">
                <span>F: {preset.feed.toFixed(4)}</span>
                <span>k: {preset.kill.toFixed(4)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
