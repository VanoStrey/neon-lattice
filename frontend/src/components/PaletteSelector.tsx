import React from 'react';
import { Palette } from 'lucide-react';
import { PALETTES } from '../types/simulation';

interface PaletteSelectorProps {
  currentPaletteId: number;
  onSelectPalette: (id: number) => void;
}

export const PaletteSelector: React.FC<PaletteSelectorProps> = ({
  currentPaletteId,
  onSelectPalette,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-neutral-300 uppercase">
        <Palette className="w-3.5 h-3.5 text-cyan-400" />
        <span>Chromatographic Palettes</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {PALETTES.map((p) => {
          const isActive = p.id === currentPaletteId;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPalette(p.id)}
              className={`group relative flex flex-col p-2 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'border-cyan-400 bg-neutral-900/80 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-800/40'
              }`}
            >
              <div
                className={`h-4 w-full rounded-sm bg-gradient-to-r ${p.gradient} mb-1.5 shadow-inner transition-transform group-hover:scale-[1.02]`}
              />
              <span className={`text-[11px] font-medium tracking-tight truncate ${isActive ? 'text-cyan-200' : 'text-neutral-400'}`}>
                {p.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
